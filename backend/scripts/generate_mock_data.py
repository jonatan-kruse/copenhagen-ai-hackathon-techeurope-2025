"""
Generate mock consultant data using Faker and insert into Weaviate.
"""
import weaviate
import os
import sys
import argparse
import json
import random
from pathlib import Path
from dotenv import load_dotenv
from faker import Faker

# Add parent directory to path to import from main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

# Default to weaviate service name for Docker Compose, fallback to localhost for local dev
weaviate_url = os.getenv("WEAVIATE_URL", "http://weaviate:8080")

# Initialize Faker
fake = Faker()

# Skill pools for diverse consultant generation
SKILL_POOLS = {
    "frontend": [
        "React", "Vue.js", "Angular", "Svelte", "Next.js", "TypeScript",
        "Tailwind CSS", "Material UI", "GraphQL", "Redux", "Zustand"
    ],
    "backend": [
        "Python", "Java", "Go", "Node.js", "Rust", "C#", ".NET",
        "Django", "FastAPI", "Spring Boot", "Express", "REST APIs"
    ],
    "devops": [
        "Kubernetes", "Docker", "Terraform", "CI/CD", "Jenkins",
        "GitLab CI", "GitHub Actions", "Ansible", "Prometheus"
    ],
    "cloud": [
        "AWS", "Azure", "GCP", "Serverless", "Lambda", "EC2", "S3",
        "CloudFormation", "Cloud Functions", "Cloud Run"
    ],
    "data_science": [
        "Python", "R", "TensorFlow", "PyTorch", "Spark", "Pandas",
        "Scikit-learn", "Jupyter", "NumPy", "Data Visualization"
    ],
    "mobile": [
        "iOS", "Android", "Flutter", "React Native", "Swift", "Kotlin",
        "Xamarin", "Dart", "SwiftUI", "Jetpack Compose"
    ],
    "security": [
        "OWASP", "Penetration Testing", "Security Auditing", "OAuth",
        "JWT", "SSL/TLS", "Security Architecture"
    ],
    "testing": [
        "Jest", "Cypress", "Selenium", "Pytest", "JUnit", "Mocha",
        "Test-Driven Development", "QA Automation"
    ],
    "design": [
        "UI/UX Design", "Figma", "Adobe XD", "Design Systems",
        "Prototyping", "Sketch", "User Research"
    ],
    "other": [
        "Blockchain", "IoT", "Embedded Systems", "Game Development",
        "Web3", "Solidity", "Arduino", "Raspberry Pi"
    ]
}

# Education templates
EDUCATION_TEMPLATES = [
    "BS in Computer Science from {university}",
    "MS in Computer Science from {university}",
    "PhD in Computer Science from {university}",
    "BS in Software Engineering from {university}",
    "MS in Software Engineering from {university}",
    "BS in Information Systems from {university}",
    "MS in Data Science from {university}",
    "PhD in Machine Learning from {university}",
    "BS in Web Development from {university}",
    "MS in Cloud Computing from {university}",
    "BS in Computer Engineering from {university}",
    "MS in Cybersecurity from {university}"
]

# Experience templates
EXPERIENCE_TEMPLATES = [
    "{years} years of full-stack development experience",
    "{years} years in {domain} development",
    "{years} years in {domain} and {domain2}",
    "{years} years in AI and data engineering",
    "{years} years in enterprise software development",
    "{years} years in frontend development",
    "{years} years in backend development",
    "{years} years in mobile app development",
    "{years} years in DevOps and cloud infrastructure",
    "{years} years in cloud architecture and DevOps",
    "{years} years in machine learning and AI research",
    "{years} years in cybersecurity and application security",
    "{years} years in QA automation and testing",
    "{years} years in user interface and experience design",
    "{years} years in blockchain development and DeFi",
    "{years} years in embedded systems and IoT development",
    "{years} years in data science and machine learning",
    "{years} years in game development and interactive media",
    "{years} years in serverless architecture and cloud-native development",
    "{years} years in AWS infrastructure and cloud operations"
]

DOMAINS = [
    "frontend", "backend", "mobile", "DevOps", "cloud", "data science",
    "machine learning", "AI", "cybersecurity", "testing", "design",
    "blockchain", "IoT", "embedded systems", "game development"
]

AVAILABILITY_OPTIONS = ["available", "busy", "unavailable"]


def generate_consultant():
    """Generate a single consultant with diverse skills."""
    # Select 2-3 skill pools to draw from
    num_pools = random.randint(2, 3)
    selected_pools = random.sample(list(SKILL_POOLS.keys()), num_pools)
    
    # Generate skills from selected pools
    skills = []
    for pool in selected_pools:
        pool_skills = SKILL_POOLS[pool]
        num_skills = random.randint(1, 3)
        selected_skills = random.sample(pool_skills, min(num_skills, len(pool_skills)))
        skills.extend(selected_skills)
    
    # Remove duplicates while preserving order
    skills = list(dict.fromkeys(skills))
    
    # Limit to 5-7 skills
    if len(skills) > 7:
        skills = random.sample(skills, 7)
    
    # Generate years of experience
    years = random.randint(2, 12)
    
    # Generate experience description
    experience_template = random.choice(EXPERIENCE_TEMPLATES)
    if "{domain}" in experience_template:
        domain = random.choice(DOMAINS)
        if "{domain2}" in experience_template:
            domain2 = random.choice([d for d in DOMAINS if d != domain])
            experience = experience_template.format(years=years, domain=domain, domain2=domain2)
        else:
            experience = experience_template.format(years=years, domain=domain)
    else:
        experience = experience_template.format(years=years)
    
    # Generate education
    education_template = random.choice(EDUCATION_TEMPLATES)
    university = fake.company() + " University"
    education = education_template.format(university=university)
    
    # Generate availability
    availability = random.choice(AVAILABILITY_OPTIONS)
    
    return {
        "name": fake.name(),
        "email": fake.email(),
        "phone": fake.phone_number(),
        "skills": skills,
        "availability": availability,
        "experience": experience,
        "education": education
    }


def generate_consultants(count=30):
    """Generate multiple consultants."""
    consultants = []
    for i in range(count):
        consultant = generate_consultant()
        consultants.append(consultant)
        if (i + 1) % 10 == 0:
            print(f"Generated {i + 1}/{count} consultants...")
    return consultants


def connect_to_weaviate():
    """Connect to Weaviate with retries."""
    print(f"Connecting to Weaviate at {weaviate_url}")
    
    import time
    max_retries = 30
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            client = weaviate.Client(url=weaviate_url)
            # Test connection by checking schema
            client.schema.get()
            print("Successfully connected to Weaviate")
            return client
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"Connection attempt {attempt + 1}/{max_retries} failed: {e}")
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                print(f"ERROR: Failed to connect to Weaviate after {max_retries} attempts: {e}")
                sys.exit(1)
    
    return None


def insert_consultants(consultants, client, force=False):
    """Insert consultants into Weaviate."""
    # Check if class exists
    print("Checking Weaviate schema...")
    try:
        schema = client.schema.get()
        class_names = [c["class"] for c in schema.get("classes", [])]
        if "Consultant" not in class_names:
            print("ERROR: Consultant class does not exist. Please run init_weaviate.py first.")
            sys.exit(1)
        print("✓ Consultant class exists")
    except Exception as e:
        print(f"ERROR: Failed to check schema: {e}")
        sys.exit(1)
    
    # Check if database already has consultants
    print("Checking for existing consultants...")
    try:
        result = client.query.get("Consultant", ["name"]).with_limit(1).do()
        existing_count = len(result.get("data", {}).get("Get", {}).get("Consultant", []))
        if existing_count > 0:
            if not force:
                print(f"WARNING: Database already contains {existing_count} consultant(s). Skipping insertion.")
                print("Use --force flag to force re-seeding, or delete existing data first.")
                sys.exit(0)
            else:
                print(f"Force flag set: will insert data even though {existing_count} consultant(s) already exist")
        else:
            print("✓ No existing consultants found")
    except Exception as e:
        print(f"WARNING: Could not check existing data: {e}")
        print("Continuing with insertion anyway...")
    
    # Batch insert
    print(f"\nInserting {len(consultants)} consultants...")
    inserted_count = 0
    errors = []
    
    try:
        with client.batch as batch:
            batch.batch_size = 10
            batch.num_workers = 1
            
            for consultant in consultants:
                try:
                    batch.add_data_object(
                        data_object=consultant,
                        class_name="Consultant"
                    )
                    inserted_count += 1
                    if inserted_count % 10 == 0:
                        print(f"  Added {inserted_count}/{len(consultants)} consultants...")
                except Exception as e:
                    error_msg = f"Error adding consultant {consultant.get('name', 'Unknown')}: {e}"
                    print(f"  {error_msg}")
                    errors.append(error_msg)
            
            # Flush any remaining items in the batch before context exit
            batch.flush()
            
            # Check for batch errors after flush
            if hasattr(batch, 'errors') and batch.errors:
                print(f"WARNING: {len(batch.errors)} errors occurred during batch insert:")
                for error in batch.errors:
                    print(f"  - {error}")
                    errors.append(str(error))
    except Exception as e:
        print(f"ERROR: Batch insert failed: {e}")
        sys.exit(1)
    
    # Verify insertion
    print("\nVerifying insertion...")
    try:
        result = client.query.get("Consultant", ["name"]).with_limit(len(consultants) + 10).do()
        verified_count = len(result.get("data", {}).get("Get", {}).get("Consultant", []))
        print(f"✓ Verified: {verified_count} consultants now in database")
        
        if verified_count < inserted_count:
            print(f"WARNING: Expected {inserted_count} consultants but found {verified_count} in database")
            if errors:
                print("Some consultants may have failed to insert. Check errors above.")
    except Exception as e:
        print(f"WARNING: Could not verify insertion: {e}")
    
    if errors:
        print(f"\nWARNING: Completed with {len(errors)} error(s). {inserted_count} consultants inserted.")
    else:
        print(f"\n✓ Successfully inserted {inserted_count} consultants into Weaviate")
    
    return inserted_count, errors


def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Generate mock consultant data using Faker")
    parser.add_argument(
        "--count",
        type=int,
        default=30,
        help="Number of consultants to generate (default: 30)"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-seeding even if data already exists"
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Output JSON file path (if not provided, inserts directly into Weaviate)"
    )
    parser.add_argument(
        "--insert",
        action="store_true",
        help="Insert generated data into Weaviate (default: only if --output not specified)"
    )
    args = parser.parse_args()
    
    # Generate consultants
    print(f"Generating {args.count} consultants...")
    consultants = generate_consultants(args.count)
    print(f"✓ Generated {len(consultants)} consultants")
    
    # Save to file if output specified
    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w") as f:
            json.dump(consultants, f, indent=2)
        print(f"✓ Saved {len(consultants)} consultants to {output_path}")
    
    # Insert into Weaviate if requested or if no output file specified
    if args.insert or not args.output:
        client = connect_to_weaviate()
        if client:
            insert_consultants(consultants, client, force=args.force)
    
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

