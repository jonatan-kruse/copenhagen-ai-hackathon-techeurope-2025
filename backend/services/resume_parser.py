"""
Resume PDF parsing service.
Extracts structured data from PDF resumes.
"""
import pyresumeparser
import json
from typing import Dict, Any


def parse_resume_pdf(pdf_path: str) -> Dict[str, Any]:
    """
    Parse PDF resume and extract structured data.
    
    Args:
        pdf_path: Path to PDF file
        
    Returns:
        Dictionary with structured resume data
    """
    try:
        parsed_result = pyresumeparser.parse_resume(pdf_path)
        
        # pyresumeparser returns a JSON string, not a dict
        # Parse it to a dictionary
        if isinstance(parsed_result, str):
            parsed_data = json.loads(parsed_result)
        elif isinstance(parsed_result, dict):
            parsed_data = parsed_result
        else:
            raise ValueError(f"Unexpected return type: {type(parsed_result)}")
        
        # pyresumeparser returns a dict with keys like:
        # first_name, last_name, email, phone, skills, companies_worked, 
        # designation, education, total_experience, projects_worked, etc.
        # Most values are lists
        
        # Extract name from first_name and last_name
        name_parts = []
        first_name = parsed_data.get('first_name', [])
        last_name = parsed_data.get('last_name', [])
        if isinstance(first_name, list) and first_name:
            name_parts.extend([str(n) for n in first_name if n])
        elif first_name:
            name_parts.append(str(first_name))
        if isinstance(last_name, list) and last_name:
            name_parts.extend([str(n) for n in last_name if n])
        elif last_name:
            name_parts.append(str(last_name))
        name = " ".join(name_parts) if name_parts else ""
        
        # Extract email (usually a list)
        email_list = parsed_data.get('email', [])
        email = ""
        if isinstance(email_list, list) and email_list:
            email = str(email_list[0])
        elif email_list:
            email = str(email_list)
        
        # Extract phone (usually a list)
        phone_list = parsed_data.get('phone', [])
        phone = ""
        if isinstance(phone_list, list) and phone_list:
            phone = str(phone_list[0])
        elif phone_list:
            phone = str(phone_list)
        
        # Extract skills (list)
        skills_list = parsed_data.get('skills', [])
        skills = []
        if isinstance(skills_list, list):
            skills = [str(s) for s in skills_list if s]
        elif skills_list:
            skills = [str(skills_list)]
        
        # Extract experience - combine multiple fields
        experience_parts = []
        
        # Total experience
        total_exp = parsed_data.get('total_experience', [])
        if isinstance(total_exp, list) and total_exp:
            experience_parts.append(f"Total Experience: {total_exp[0]}")
        elif total_exp:
            experience_parts.append(f"Total Experience: {total_exp}")
        
        # Companies worked
        companies = parsed_data.get('companies_worked', [])
        if isinstance(companies, list) and companies:
            experience_parts.append(f"Companies: {', '.join([str(c) for c in companies])}")
        elif companies:
            experience_parts.append(f"Companies: {companies}")
        
        # Designations/Positions
        designations = parsed_data.get('designation', [])
        if isinstance(designations, list) and designations:
            experience_parts.append(f"Roles: {', '.join([str(d) for d in designations])}")
        elif designations:
            experience_parts.append(f"Roles: {designations}")
        
        experience = " | ".join(experience_parts) if experience_parts else ""
        
        # Extract education (list)
        education_list = parsed_data.get('education', [])
        education = ""
        if isinstance(education_list, list) and education_list:
            education = ", ".join([str(e) for e in education_list if e])
        elif education_list:
            education = str(education_list)
        
        # Build full_text from available fields
        full_text_parts = []
        if name:
            full_text_parts.append(f"Name: {name}")
        if email:
            full_text_parts.append(f"Email: {email}")
        if phone:
            full_text_parts.append(f"Phone: {phone}")
        if skills:
            full_text_parts.append(f"Skills: {', '.join(skills)}")
        if experience:
            full_text_parts.append(f"Experience: {experience}")
        if education:
            full_text_parts.append(f"Education: {education}")
        
        # Add projects if available
        projects = parsed_data.get('projects_worked', [])
        if isinstance(projects, list) and projects:
            full_text_parts.append(f"Projects: {', '.join([str(p) for p in projects])}")
        elif projects:
            full_text_parts.append(f"Projects: {projects}")
        
        full_text = "\n".join(full_text_parts) if full_text_parts else ""
        
        resume_data = {
            "name": name,
            "email": email,
            "phone": phone,
            "skills": skills,
            "experience": experience,
            "education": education,
            "full_text": full_text
        }
        
        return resume_data
    except Exception as e:
        # Log the error for debugging
        print(f"ERROR parsing resume: {e}")
        import traceback
        traceback.print_exc()
        # Return minimal structure on parsing failure
        return {
            "name": "",
            "email": "",
            "phone": "",
            "skills": [],
            "experience": "",
            "education": "",
            "full_text": ""
        }

