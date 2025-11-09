"""
Insert mock consultant data into Weaviate.
"""
import weaviate
import os
import sys
import argparse
import json
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path to import from main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

# Default to weaviate service name for Docker Compose, fallback to localhost for local dev
weaviate_url = os.getenv("WEAVIATE_URL", "http://weaviate:8080")

# Parse command-line arguments
parser = argparse.ArgumentParser(description="Insert mock consultant data into Weaviate")
parser.add_argument(
    "--force",
    action="store_true",
    help="Force re-seeding even if data already exists"
)
parser.add_argument(
    "--data-file",
    type=str,
    default=None,
    help="Path to JSON file containing consultant data (default: data/mock_consultants.json)"
)
args = parser.parse_args()

print(f"Connecting to Weaviate at {weaviate_url}")

# Wait for Weaviate to be ready (with retries)
import time
max_retries = 30
retry_delay = 2

client = None
for attempt in range(max_retries):
    try:
        client = weaviate.Client(url=weaviate_url)
        # Test connection by checking schema
        client.schema.get()
        print("Successfully connected to Weaviate")
        break
    except Exception as e:
        if attempt < max_retries - 1:
            print(f"Connection attempt {attempt + 1}/{max_retries} failed: {e}")
            print(f"Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
        else:
            print(f"ERROR: Failed to connect to Weaviate after {max_retries} attempts: {e}")
            sys.exit(1)

if client is None:
    print("ERROR: Failed to establish Weaviate connection")
    sys.exit(1)

# Load consultant data from JSON file
def load_consultant_data(data_file=None):
    """Load consultant data from JSON file."""
    if data_file is None:
        # Default to data/mock_consultants.json relative to backend directory
        script_dir = Path(__file__).parent
        backend_dir = script_dir.parent
        data_file = backend_dir / "data" / "mock_consultants.json"
    else:
        data_file = Path(data_file)
    
    if not data_file.exists():
        print(f"ERROR: Data file not found: {data_file}")
        sys.exit(1)
    
    try:
        with open(data_file, "r") as f:
            consultants = json.load(f)
        print(f"Loaded {len(consultants)} consultants from {data_file}")
        return consultants
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON in data file {data_file}: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Failed to load data file {data_file}: {e}")
        sys.exit(1)

def insert_consultants(force=False, data_file=None):
    """Insert mock consultants into Weaviate."""
    # Load consultant data
    mock_consultants = load_consultant_data(data_file)
    
    if not mock_consultants:
        print("ERROR: No consultant data to insert")
        sys.exit(1)
    
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
                print(f"WARNING: Database already contains {existing_count} consultant(s). Skipping mock data insertion.")
                print("Use --force flag to force re-seeding, or delete existing data first.")
                sys.exit(0)  # Exit successfully since this is expected behavior
            else:
                print(f"Force flag set: will insert data even though {existing_count} consultant(s) already exist")
        else:
            print("✓ No existing consultants found")
    except Exception as e:
        print(f"WARNING: Could not check existing data: {e}")
        print("Continuing with insertion anyway...")
    
    # Batch insert
    print(f"\nInserting {len(mock_consultants)} consultants...")
    inserted_count = 0
    errors = []
    
    try:
        with client.batch as batch:
            batch.batch_size = 10
            batch.num_workers = 1
            
            for consultant in mock_consultants:
                try:
                    batch.add_data_object(
                        data_object=consultant,
                        class_name="Consultant"
                    )
                    inserted_count += 1
                    if inserted_count % 5 == 0:
                        print(f"  Added {inserted_count}/{len(mock_consultants)} consultants...")
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
        result = client.query.get("Consultant", ["name"]).with_limit(len(mock_consultants) + 10).do()
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

if __name__ == "__main__":
    try:
        insert_consultants(force=args.force, data_file=args.data_file)
        sys.exit(0)
    except KeyboardInterrupt:
        print("\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

