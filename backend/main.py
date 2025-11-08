from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import weaviate
import os
import uuid
from dotenv import load_dotenv
from storage import LocalFileStorage
from services.resume_parser import parse_resume_pdf
from models import ConsultantData

load_dotenv()

app = FastAPI(title="Consultant Matching API", version="1.0.0")

# CORS middleware
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:8080")
cors_origins_list = [origin.strip() for origin in cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Weaviate client
weaviate_url = os.getenv("WEAVIATE_URL", "http://weaviate:8080")
try:
    client = weaviate.Client(url=weaviate_url)
except Exception as e:
    print(f"Warning: Could not connect to Weaviate at {weaviate_url}: {e}")
    client = None

# Storage
upload_dir = os.getenv("UPLOAD_DIR", "uploads/resumes")
storage = LocalFileStorage(base_dir=upload_dir)

# Pydantic models
class Consultant(ConsultantData):
    id: Optional[str] = None
    matchScore: Optional[float] = None
    resumeId: Optional[str] = None  # If present, consultant has a resume PDF

class ProjectDescription(BaseModel):
    projectDescription: str

class ConsultantResponse(BaseModel):
    consultants: List[Consultant]

class DeleteRequest(BaseModel):
    ids: List[str]

class SkillCount(BaseModel):
    skill: str
    count: int

class OverviewResponse(BaseModel):
    cvCount: int
    uniqueSkillsCount: int
    topSkills: List[SkillCount]

@app.get("/")
async def root():
    return {"message": "Consultant Matching API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/api/consultants/match", response_model=ConsultantResponse)
async def match_consultants(project: ProjectDescription):
    """
    Match consultants based on project description using Weaviate vector search.
    """
    if not client:
        return ConsultantResponse(consultants=[])
    
    try:
        # Use Weaviate's pure vector search (semantic similarity)
        # .with_near_text() generates a vector from the query text and compares it to stored object vectors
        response = (
            client.query
            .get("Consultant", ["name", "email", "phone", "skills", "availability", "experience", "education"])
            .with_near_text({
                "concepts": [project.projectDescription]
            })
            .with_additional(["id", "certainty", "distance"])
            .with_limit(20)
            .do()
        )
        
        consultants = []
        if "data" in response and "Get" in response["data"] and "Consultant" in response["data"]["Get"]:
            results = response["data"]["Get"]["Consultant"]
            
            for consultant in results:
                consultant_id = consultant.get("_additional", {}).get("id")
                additional = consultant.get("_additional", {})
                
                # Get similarity score from Weaviate vector search
                # Certainty is a similarity score (0-1, higher = more similar)
                # Convert to float in case Weaviate returns string, then convert to 0-100 scale
                certainty_raw = additional.get("certainty", 0.0)
                try:
                    certainty = float(certainty_raw) if certainty_raw else 0.0
                except (ValueError, TypeError):
                    certainty = 0.0
                match_score = round(certainty * 100, 1) if certainty else 0.0
                
                consultant_data = {
                    "id": consultant_id,
                    "name": consultant.get("name", ""),
                    "email": consultant.get("email", ""),
                    "phone": consultant.get("phone", ""),
                    "skills": consultant.get("skills", []),
                    "availability": consultant.get("availability", "available"),
                    "experience": consultant.get("experience", ""),
                    "education": consultant.get("education", ""),
                    "matchScore": match_score,
                    "resumeId": None
                }
                
                # Check if PDF exists for this consultant
                try:
                    pdf_path = storage.get_path(consultant_id)
                    if os.path.exists(pdf_path):
                        consultant_data["resumeId"] = consultant_id
                except:
                    pass
                
                consultants.append(consultant_data)
            
            # Results are already sorted by similarity from Weaviate
        
        return ConsultantResponse(consultants=consultants)
    
    except Exception as e:
        print(f"Error matching consultants: {e}")
        import traceback
        traceback.print_exc()
        return ConsultantResponse(consultants=[])

@app.get("/api/consultants", response_model=ConsultantResponse)
async def get_all_consultants():
    """
    Get all consultants.
    """
    if not client:
        return ConsultantResponse(consultants=[])
    
    try:
        response = (
            client.query
            .get("Consultant", ["name", "email", "phone", "skills", "availability", "experience", "education"])
            .with_additional(["id"])
            .with_limit(100)
            .do()
        )
        
        consultants = []
        if "data" in response and "Get" in response["data"] and "Consultant" in response["data"]["Get"]:
            results = response["data"]["Get"]["Consultant"]
            for consultant in results:
                # Extract ID from _additional field
                additional = consultant.get("_additional", {})
                consultant_id = additional.get("id")
                
                consultant_data = {
                    "id": consultant_id,
                    "name": consultant.get("name", ""),
                    "email": consultant.get("email", ""),
                    "phone": consultant.get("phone", ""),
                    "skills": consultant.get("skills", []),
                    "availability": consultant.get("availability", "available"),
                    "experience": consultant.get("experience", ""),
                    "education": consultant.get("education", ""),
                    "resumeId": None
                }
                
                # Check if PDF exists for this consultant
                try:
                    pdf_path = storage.get_path(consultant_id)
                    if os.path.exists(pdf_path):
                        consultant_data["resumeId"] = consultant_id
                except:
                    pass
                
                consultants.append(consultant_data)
        
        return ConsultantResponse(consultants=consultants)
    
    except Exception as e:
        print(f"Error fetching consultants: {e}")
        import traceback
        traceback.print_exc()
        return ConsultantResponse(consultants=[])

@app.delete("/api/consultants/{consultant_id}")
async def delete_consultant(consultant_id: str):
    """
    Delete a single consultant by ID.
    """
    if not client:
        return {"success": False, "error": "Weaviate client not available"}
    
    try:
        client.data_object.delete(
            uuid=consultant_id,
            class_name="Consultant"
        )
        return {"success": True, "message": f"Consultant {consultant_id} deleted successfully"}
    except Exception as e:
        print(f"Error deleting consultant {consultant_id}: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

@app.delete("/api/consultants")
async def delete_consultants_batch(request: DeleteRequest):
    """
    Delete multiple consultants by IDs.
    """
    if not client:
        return {"success": False, "error": "Weaviate client not available"}
    
    if not request.ids:
        return {"success": False, "error": "No IDs provided"}
    
    try:
        deleted_count = 0
        errors = []
        
        for consultant_id in request.ids:
            try:
                client.data_object.delete(
                    uuid=consultant_id,
                    class_name="Consultant"
                )
                deleted_count += 1
            except Exception as e:
                errors.append({"id": consultant_id, "error": str(e)})
        
        if errors:
            return {
                "success": True,
                "message": f"Deleted {deleted_count} consultant(s), {len(errors)} error(s)",
                "deleted_count": deleted_count,
                "errors": errors
            }
        
        return {
            "success": True,
            "message": f"Successfully deleted {deleted_count} consultant(s)",
            "deleted_count": deleted_count
        }
    except Exception as e:
        print(f"Error deleting consultants: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

@app.post("/api/resumes/upload")
async def upload_resume(file: UploadFile = File(...)):
    """
    Upload a PDF resume, parse it, and create a Consultant entry in Weaviate.
    Returns the consultant object with ID.
    """
    if not client:
        raise HTTPException(status_code=503, detail="Weaviate client not available")
    
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    # Generate UUID for consultant
    consultant_id = str(uuid.uuid4())
    
    try:
        # Read PDF bytes
        pdf_bytes = await file.read()
        
        # Parse resume - returns ConsultantData (pass bytes directly)
        consultant_data = parse_resume_pdf(pdf_bytes)
        
        # Save PDF to storage using consultant_id
        storage.save_pdf(pdf_bytes, consultant_id)
        
        # Insert into Weaviate Consultant collection with consultant_id as UUID
        # Convert ConsultantData to dict for Weaviate
        consultant_dict = consultant_data.model_dump()
        client.data_object.create(
            data_object=consultant_dict,
            class_name="Consultant",
            uuid=consultant_id
        )
        
        # Return consultant object with ID and resumeId
        return {
            "id": consultant_id,
            **consultant_dict,
            "resumeId": consultant_id
        }
    
    except Exception as e:
        # Clean up PDF if Weaviate insertion failed
        try:
            pdf_path = storage.get_path(consultant_id)
            if os.path.exists(pdf_path):
                os.unlink(pdf_path)
        except:
            pass
        
        print(f"Error uploading resume: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")

@app.get("/api/resumes/{resume_id}/pdf")
async def get_resume_pdf(resume_id: str):
    """
    Retrieve the original PDF file by consultant/resume ID.
    The ID is the same as the consultant ID for uploaded resumes.
    """
    try:
        file_path = storage.get_path(resume_id)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="PDF not found")
        
        return FileResponse(
            file_path,
            media_type="application/pdf",
            filename=f"{resume_id}.pdf"
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="PDF not found")
    except Exception as e:
        print(f"Error retrieving PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving PDF: {str(e)}")
@app.get("/api/overview", response_model=OverviewResponse)
async def get_overview():
    """
    Get overview statistics: number of CVs (consultants), unique skills, and top 10 most common skills.
    """
    if not client:
        return OverviewResponse(cvCount=0, uniqueSkillsCount=0, topSkills=[])
    
    try:
        # Fetch all consultants to count and collect skills
        response = (
            client.query
            .get("Consultant", ["skills"])
            .with_limit(1000)  # Large limit to get all consultants
            .do()
        )
        
        cv_count = 0
        all_skills = set()
        skill_counts = {}  # Dictionary to count occurrences of each skill
        
        if "data" in response and "Get" in response["data"] and "Consultant" in response["data"]["Get"]:
            results = response["data"]["Get"]["Consultant"]
            cv_count = len(results)
            
            # Collect all unique skills and count occurrences
            for consultant in results:
                skills = consultant.get("skills", [])
                if skills:
                    all_skills.update(skills)
                    for skill in skills:
                        skill_counts[skill] = skill_counts.get(skill, 0) + 1
        
        # Get top 10 most common skills
        sorted_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)
        top_skills = [SkillCount(skill=skill, count=count) for skill, count in sorted_skills[:10]]
        
        return OverviewResponse(
            cvCount=cv_count,
            uniqueSkillsCount=len(all_skills),
            topSkills=top_skills
        )
    
    except Exception as e:
        print(f"Error fetching overview: {e}")
        import traceback
        traceback.print_exc()
        return OverviewResponse(cvCount=0, uniqueSkillsCount=0, topSkills=[])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

