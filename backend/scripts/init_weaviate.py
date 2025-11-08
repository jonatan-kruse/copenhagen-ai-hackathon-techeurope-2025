"""
Initialize Weaviate schema for Consultant and Resume classes.
"""
import weaviate
import os
from dotenv import load_dotenv

load_dotenv()

weaviate_url = os.getenv("WEAVIATE_URL", "http://localhost:8080")

client = weaviate.Client(url=weaviate_url)

# Define the Consultant schema
consultant_schema = {
    "class": "Consultant",
    "description": "A consultant with skills and availability",
    "properties": [
        {
            "name": "name",
            "dataType": ["string"],
            "description": "The name of the consultant"
        },
        {
            "name": "skills",
            "dataType": ["string[]"],
            "description": "List of skills the consultant has"
        },
        {
            "name": "availability",
            "dataType": ["string"],
            "description": "Availability status: available, busy, or unavailable"
        },
        {
            "name": "experience",
            "dataType": ["string"],
            "description": "Experience description of the consultant"
        }
    ]
}

# Define the Resume schema
resume_schema = {
    "class": "Resume",
    "description": "A resume parsed from PDF",
    "properties": [
        {
            "name": "name",
            "dataType": ["string"],
            "description": "Name extracted from resume"
        },
        {
            "name": "email",
            "dataType": ["string"],
            "description": "Email address from resume"
        },
        {
            "name": "phone",
            "dataType": ["string"],
            "description": "Phone number from resume"
        },
        {
            "name": "skills",
            "dataType": ["string[]"],
            "description": "List of skills extracted from resume"
        },
        {
            "name": "experience",
            "dataType": ["text"],
            "description": "Work experience summary"
        },
        {
            "name": "education",
            "dataType": ["text"],
            "description": "Education details"
        },
        {
            "name": "full_text",
            "dataType": ["text"],
            "description": "Complete extracted text for vectorization"
        }
    ]
}

# Check if Consultant class exists, if so delete it
try:
    client.schema.delete_class("Consultant")
    print("Deleted existing Consultant class")
except:
    print("No existing Consultant class found")

# Create the Consultant class
try:
    client.schema.create_class(consultant_schema)
    print("Successfully created Consultant class in Weaviate")
except Exception as e:
    print(f"Error creating Consultant schema: {e}")

# Check if Resume class exists, if so delete it
try:
    client.schema.delete_class("Resume")
    print("Deleted existing Resume class")
except:
    print("No existing Resume class found")

# Create the Resume class
try:
    client.schema.create_class(resume_schema)
    print("Successfully created Resume class in Weaviate")
except Exception as e:
    print(f"Error creating Resume schema: {e}")

