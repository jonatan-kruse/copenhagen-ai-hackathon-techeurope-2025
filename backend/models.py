"""
Shared data models for consultant data.
"""
from pydantic import BaseModel
from typing import List


class ConsultantData(BaseModel):
    """Shared consultant data structure used by parser and API."""
    name: str
    email: str
    phone: str
    skills: List[str]
    experience: str
    education: str
    availability: str = "available"

