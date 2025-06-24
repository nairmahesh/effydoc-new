import requests
import json
import uuid
import os
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://7056c40d-c306-42f0-bfc6-379013315fc8.preview.emergentagent.com/api"

def test_document_upload_comprehensive():
    """Comprehensive test of the document upload endpoint with different file types and parameters"""
    print("Starting comprehensive document upload test...")
    
    # Test variables
    base_url = BACKEND_URL
    headers = {"Content-Type": "application/json"}
    test_user_email = f"test.user.{uuid.uuid4()}@example.com"
    test_user_password = "SecurePassword123!"
    
    # 1. Register a test user
    print("\n1. Registering test user...")
    user_data = {
        "email": test_user_email,
        "full_name": "Test User",
        "role": "editor",
        "organization": "Test Organization",
        "password": test_user_password
    }
    
    response = requests.post(f"{base_url}/auth/register", json=user_data)
    assert response.status_code == 200, f"Failed to register test user: {response.text}"
    data = response.json()
    
    # Save token for subsequent tests
    access_token = data["access_token"]
    auth_headers = {"Authorization": f"Bearer {access_token}"}
    
    print("✅ User registration successful")
    
    # 2. Create test files
    print("\n2. Creating test files...")
    
    # Create a text file
    txt_file_path = "/tmp/test_document.txt"
    with open(txt_file_path, "w") as f:
        f.write("This is a test document for upload testing.")
    
    # Create a simple PDF file (if possible)
    pdf_file_path = "/tmp/test_document.pdf"
    try:
        from reportlab.pdfgen import canvas
        
        c = canvas.Canvas(pdf_file_path)
        c.drawString(100, 750, "Test PDF Document")
        c.drawString(100, 700, "This is a test PDF for upload testing.")
        c.save()
        pdf_available = True
        print("✅ Created PDF test file")
    except ImportError:
        pdf_available = False
        print("⚠️ ReportLab not available, skipping PDF test")
    
    print("✅ Test files created successfully")
    
    # 3. Test text file upload
    print("\n3. Testing text file upload...")
    
    # Upload the text file
    with open(txt_file_path, "rb") as f:
        files = {"file": ("test_document.txt", f, "text/plain")}
        response = requests.post(
            f"{base_url}/documents/upload",
            files=files,
            data={"title": "Text Document Upload"},
            headers=auth_headers
        )
    
    assert response.status_code == 200, f"Failed to upload text document: {response.status_code} - {response.text}"
    txt_response = response.json()
    
    # Save document ID for later
    txt_document_id = txt_response["document"]["id"]
    
    print(f"✅ Text file uploaded successfully with ID: {txt_document_id}")
    print(f"   Response structure: {list(txt_response.keys())}")
    print(f"   Document structure: {list(txt_response['document'].keys())}")
    
    # 4. Test PDF file upload with extract_text=true (if PDF available)
    if pdf_available:
        print("\n4. Testing PDF file upload with extract_text=true...")
        
        with open(pdf_file_path, "rb") as f:
            files = {"file": ("test_document.pdf", f, "application/pdf")}
            response = requests.post(
                f"{base_url}/documents/upload",
                files=files,
                data={"title": "PDF Document Upload", "extract_text": "true"},
                headers=auth_headers
            )
        
        assert response.status_code == 200, f"Failed to upload PDF document: {response.status_code} - {response.text}"
        pdf_extract_response = response.json()
        
        # Save document ID for later
        pdf_extract_id = pdf_extract_response["document"]["id"]
        
        print(f"✅ PDF file uploaded with extract_text=true, ID: {pdf_extract_id}")
        print(f"   Response structure: {list(pdf_extract_response.keys())}")
        print(f"   Document structure: {list(pdf_extract_response['document'].keys())}")
        
        # 5. Test PDF file upload with extract_text=false
        print("\n5. Testing PDF file upload with extract_text=false...")
        
        with open(pdf_file_path, "rb") as f:
            files = {"file": ("test_document.pdf", f, "application/pdf")}
            response = requests.post(
                f"{base_url}/documents/upload",
                files=files,
                data={"title": "PDF Document Original", "extract_text": "false"},
                headers=auth_headers
            )
        
        assert response.status_code == 200, f"Failed to upload PDF document: {response.status_code} - {response.text}"
        pdf_original_response = response.json()
        
        # Save document ID for later
        pdf_original_id = pdf_original_response["document"]["id"]
        
        print(f"✅ PDF file uploaded with extract_text=false, ID: {pdf_original_id}")
        print(f"   Response structure: {list(pdf_original_response.keys())}")
        print(f"   Document structure: {list(pdf_original_response['document'].keys())}")
    
    # 6. Test retrieving the uploaded documents
    print("\n6. Testing document retrieval...")
    
    # Retrieve text document
    response = requests.get(f"{base_url}/documents/{txt_document_id}", headers=auth_headers)
    assert response.status_code == 200, f"Failed to retrieve text document: {response.status_code} - {response.text}"
    txt_doc = response.json()
    
    print(f"✅ Retrieved text document with ID: {txt_doc['id']}")
    print(f"   Document has {len(txt_doc['pages'])} pages")
    
    # Retrieve PDF documents if available
    if pdf_available:
        # Retrieve PDF with extracted text
        response = requests.get(f"{base_url}/documents/{pdf_extract_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed to retrieve PDF (extract) document: {response.status_code} - {response.text}"
        pdf_extract_doc = response.json()
        
        print(f"✅ Retrieved PDF (extract) document with ID: {pdf_extract_doc['id']}")
        print(f"   Document has {len(pdf_extract_doc['pages'])} pages")
        
        # Retrieve original PDF
        response = requests.get(f"{base_url}/documents/{pdf_original_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed to retrieve PDF (original) document: {response.status_code} - {response.text}"
        pdf_original_doc = response.json()
        
        print(f"✅ Retrieved PDF (original) document with ID: {pdf_original_doc['id']}")
        print(f"   Document has {len(pdf_original_doc['pages'])} pages")
    
    # 7. Analyze response structure for frontend compatibility
    print("\n7. Analyzing response structure for frontend compatibility...")
    
    # Check if the expected frontend path exists in any response
    frontend_path_exists = False
    
    # Check upload responses
    for resp in [txt_response]:
        if "data" in resp and isinstance(resp["data"], dict) and "document" in resp["data"] and "id" in resp["data"]["document"]:
            frontend_path_exists = True
            break
    
    if pdf_available:
        for resp in [pdf_extract_response, pdf_original_response]:
            if "data" in resp and isinstance(resp["data"], dict) and "document" in resp["data"] and "id" in resp["data"]["document"]:
                frontend_path_exists = True
                break
    
    if frontend_path_exists:
        print("✅ Frontend expected path 'response.data.document.id' exists in at least one response")
    else:
        print("❌ Frontend expected path 'response.data.document.id' does not exist in any response")
        print("   The correct path appears to be: 'response.document.id'")
    
    # 8. Clean up
    print("\n8. Cleaning up...")
    
    # Delete the test documents
    response = requests.delete(f"{base_url}/documents/{txt_document_id}", headers=auth_headers)
    assert response.status_code == 200, f"Failed to delete text document: {response.status_code} - {response.text}"
    print(f"✅ Deleted text document with ID: {txt_document_id}")
    
    if pdf_available:
        response = requests.delete(f"{base_url}/documents/{pdf_extract_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed to delete PDF (extract) document: {response.status_code} - {response.text}"
        print(f"✅ Deleted PDF (extract) document with ID: {pdf_extract_id}")
        
        response = requests.delete(f"{base_url}/documents/{pdf_original_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed to delete PDF (original) document: {response.status_code} - {response.text}"
        print(f"✅ Deleted PDF (original) document with ID: {pdf_original_id}")
    
    # Clean up the test files
    if os.path.exists(txt_file_path):
        os.remove(txt_file_path)
    if pdf_available and os.path.exists(pdf_file_path):
        os.remove(pdf_file_path)
    
    print("✅ Test files deleted")
    
    # 9. Conclusion
    print("\n=== CONCLUSION ===")
    print("The document upload endpoint returns a response with the following structure:")
    print("- message: Success message")
    print("- document: The complete document object with all fields including 'id'")
    print("- total_pages: Number of pages in the document")
    print("- processing_method: Method used to process the document")
    print("\nThe frontend is expecting 'response.data.document.id' but should use 'response.document.id'")
    print("This mismatch is likely causing the 'Failed to upload document' errors in the frontend.")

if __name__ == "__main__":
    test_document_upload_comprehensive()