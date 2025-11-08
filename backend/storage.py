"""
Storage abstraction for PDF files.
Easy to swap implementations (local file system, S3, etc.)
"""
import os
from abc import ABC, abstractmethod
from pathlib import Path


class StorageInterface(ABC):
    """Abstract base class for storage implementations."""
    
    @abstractmethod
    def save_pdf(self, pdf_bytes: bytes, resume_id: str) -> str:
        """Save PDF and return file path."""
        pass
    
    @abstractmethod
    def get_pdf(self, resume_id: str) -> bytes:
        """Retrieve PDF by resume_id."""
        pass
    
    @abstractmethod
    def get_path(self, resume_id: str) -> str:
        """Get file path for resume_id."""
        pass


class LocalFileStorage(StorageInterface):
    """Local file system storage implementation."""
    
    def __init__(self, base_dir: str = "uploads/resumes"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
    
    def save_pdf(self, pdf_bytes: bytes, resume_id: str) -> str:
        """Save PDF to local file system."""
        file_path = self.base_dir / f"{resume_id}.pdf"
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)
        return str(file_path)
    
    def get_pdf(self, resume_id: str) -> bytes:
        """Retrieve PDF from local file system."""
        file_path = self.base_dir / f"{resume_id}.pdf"
        if not file_path.exists():
            raise FileNotFoundError(f"PDF not found for resume_id: {resume_id}")
        with open(file_path, "rb") as f:
            return f.read()
    
    def get_path(self, resume_id: str) -> str:
        """Get file path for resume_id."""
        file_path = self.base_dir / f"{resume_id}.pdf"
        return str(file_path)

