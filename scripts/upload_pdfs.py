#!/usr/bin/env python3
"""
Script to upload all PDF files from the data folder to the backend API.
Run this script manually to bulk upload resumes.
"""

import os
import sys
from pathlib import Path
from typing import List, Tuple

try:
    import requests
except ImportError:
    print("Error: 'requests' library is not installed.")
    print("Please install it with: pip install requests")
    sys.exit(1)

# Default API base URL - can be overridden with environment variable
API_BASE_URL = os.getenv("API_BASE_URL", "https://projmatch.vibeoholic.com/api")

def find_pdf_files(data_dir: str) -> List[Path]:
    """Find all PDF files in the data directory."""
    data_path = Path(data_dir)
    if not data_path.exists():
        print(f"Error: Data directory '{data_dir}' does not exist")
        sys.exit(1)
    
    pdf_files = list(data_path.glob("*.pdf"))
    pdf_files.sort()  # Sort for consistent ordering
    return pdf_files

def upload_pdf(pdf_path: Path, api_base_url: str) -> Tuple[bool, str]:
    """
    Upload a single PDF file to the API.
    Returns (success, message)
    """
    url = f"{api_base_url}/resumes/upload"
    
    try:
        with open(pdf_path, 'rb') as f:
            files = {'file': (pdf_path.name, f, 'application/pdf')}
            response = requests.post(url, files=files, timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            consultant_id = data.get('id', 'unknown')
            name = data.get('name', 'Unknown')
            return True, f"✓ Uploaded: {pdf_path.name} -> {name} (ID: {consultant_id})"
        else:
            error_msg = "Unknown error"
            try:
                error_data = response.json()
                error_msg = error_data.get('detail', str(response.status_code))
            except:
                error_msg = response.text or f"HTTP {response.status_code}"
            return False, f"✗ Failed: {pdf_path.name} - {error_msg}"
    
    except requests.exceptions.ConnectionError:
        return False, f"✗ Failed: {pdf_path.name} - Could not connect to API at {api_base_url}"
    except requests.exceptions.Timeout:
        return False, f"✗ Failed: {pdf_path.name} - Request timeout"
    except Exception as e:
        return False, f"✗ Failed: {pdf_path.name} - {str(e)}"

def main():
    """Main function to upload all PDFs."""
    # Get data directory (default to ./data relative to script location)
    script_dir = Path(__file__).parent.parent
    data_dir = os.getenv("DATA_DIR", str(script_dir / "data"))
    
    print(f"📁 Data directory: {data_dir}")
    print(f"🌐 API base URL: {API_BASE_URL}")
    print()
    
    # Find all PDF files
    pdf_files = find_pdf_files(data_dir)
    
    if not pdf_files:
        print(f"No PDF files found in '{data_dir}'")
        sys.exit(0)
    
    print(f"Found {len(pdf_files)} PDF file(s) to upload")
    print()
    
    # Upload each PDF sequentially (one at a time)
    # This ensures we don't overload the backend - each upload waits for
    # the previous one to complete before starting the next
    success_count = 0
    failure_count = 0
    results = []
    
    for i, pdf_path in enumerate(pdf_files, 1):
        print(f"[{i}/{len(pdf_files)}] Uploading {pdf_path.name}...", end=" ", flush=True)
        # upload_pdf() is synchronous and blocking - it waits for the API response
        # before returning, ensuring sequential processing
        success, message = upload_pdf(pdf_path, API_BASE_URL)
        print(message)
        results.append((success, message))
        
        if success:
            success_count += 1
        else:
            failure_count += 1
    
    # Summary
    print()
    print("=" * 60)
    print("📊 Upload Summary")
    print("=" * 60)
    print(f"Total files: {len(pdf_files)}")
    print(f"✓ Successful: {success_count}")
    print(f"✗ Failed: {failure_count}")
    print()
    
    if failure_count > 0:
        print("Failed uploads:")
        for success, message in results:
            if not success:
                print(f"  {message}")
        sys.exit(1)
    else:
        print("All uploads completed successfully! 🎉")
        sys.exit(0)

if __name__ == "__main__":
    main()

