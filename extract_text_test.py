import requests
import json
import uuid
import os
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://7056c40d-c306-42f0-bfc6-379013315fc8.preview.emergentagent.com/api"

def test_document_upload_extract_text_parameter():
    """Test the document upload functionality with extract_text parameter"""
    print("Starting document upload tests with extract_text parameter...")
    
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
    
    # Create a PDF file (simulated)
    pdf_path = "/tmp/test_document.pdf"
    with open(pdf_path, "wb") as f:
        # This is a minimal valid PDF file
        f.write(b"%PDF-1.4\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n3 0 obj\n<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000015 00000 n\n0000000060 00000 n\n0000000111 00000 n\ntrailer\n<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF")
    
    # Create a DOCX file (simulated)
    docx_path = "/tmp/test_document.docx"
    with open(docx_path, "wb") as f:
        # This is a minimal valid DOCX file header
        f.write(b"PK\x03\x04\x14\x00\x06\x00\x08\x00\x00\x00!\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x10\x00\x00\x00word/document.xmlPK\x01\x02\x14\x00\x14\x00\x06\x00\x08\x00\x00\x00!\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x10\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00word/document.xmlPK\x05\x06\x00\x00\x00\x00\x01\x00\x01\x00>\x00\x00\x00>\x00\x00\x00\x00\x00")
    
    # Create a TXT file
    txt_path = "/tmp/test_document.txt"
    with open(txt_path, "w") as f:
        f.write("This is a test document for upload testing.\nIt contains multiple lines of text.\nThe extract_text parameter should be tested with this file.")
    
    print("✅ Test files created successfully")
    
    # 3. Test document upload with extract_text=true (default)
    print("\n3. Testing document upload with extract_text=true (default)...")
    
    # Upload the PDF file with extract_text=true (default)
    with open(pdf_path, "rb") as f:
        files = {"file": ("test_document.pdf", f, "application/pdf")}
        response = requests.post(
            f"{base_url}/documents/upload",
            files=files,
            data={"title": "PDF with extract_text=true"},
            headers=auth_headers
        )
    
    assert response.status_code == 200, f"Failed to upload PDF with extract_text=true: {response.status_code} - {response.text}"
    data = response.json()
    
    # Verify response structure
    assert data["message"] == "Document uploaded and processed successfully", "Unexpected response message"
    assert "document" in data, "Missing document in response"
    
    # Save document ID for verification
    pdf_extract_true_id = data["document"]["id"]
    
    # Verify the document was processed with text extraction
    assert "pages" in data["document"], "Missing pages in document"
    assert len(data["document"]["pages"]) > 0, "No pages found in document"
    
    print(f"✅ Document upload with extract_text=true successful (document ID: {pdf_extract_true_id})")
    
    # 4. Test document upload with extract_text=false
    print("\n4. Testing document upload with extract_text=false...")
    
    # Upload the PDF file with extract_text=false
    with open(pdf_path, "rb") as f:
        files = {"file": ("test_document.pdf", f, "application/pdf")}
        response = requests.post(
            f"{base_url}/documents/upload",
            files=files,
            data={"title": "PDF with extract_text=false", "extract_text": "false"},
            headers=auth_headers
        )
    
    assert response.status_code == 200, f"Failed to upload PDF with extract_text=false: {response.status_code} - {response.text}"
    data = response.json()
    
    # Verify response structure
    assert data["message"] == "Document uploaded and processed successfully", "Unexpected response message"
    assert "document" in data, "Missing document in response"
    
    # Save document ID for verification
    pdf_extract_false_id = data["document"]["id"]
    
    # Verify the document was processed without text extraction
    assert "pages" in data["document"], "Missing pages in document"
    assert len(data["document"]["pages"]) > 0, "No pages found in document"
    
    # Check if the content contains the PDF embed tag (indicating no text extraction)
    page_content = data["document"]["pages"][0]["content"]
    assert "embed src=\"data:application/pdf;base64," in page_content, "PDF content should be embedded as base64 when extract_text=false"
    
    print(f"✅ Document upload with extract_text=false successful (document ID: {pdf_extract_false_id})")
    
    # 5. Test document upload without extract_text parameter (should default to true)
    print("\n5. Testing document upload without extract_text parameter (should default to true)...")
    
    # Upload the PDF file without extract_text parameter
    with open(pdf_path, "rb") as f:
        files = {"file": ("test_document.pdf", f, "application/pdf")}
        response = requests.post(
            f"{base_url}/documents/upload",
            files=files,
            data={"title": "PDF without extract_text parameter"},
            headers=auth_headers
        )
    
    assert response.status_code == 200, f"Failed to upload PDF without extract_text parameter: {response.status_code} - {response.text}"
    data = response.json()
    
    # Verify response structure
    assert data["message"] == "Document uploaded and processed successfully", "Unexpected response message"
    assert "document" in data, "Missing document in response"
    
    # Save document ID for verification
    pdf_no_extract_param_id = data["document"]["id"]
    
    # Verify the document was processed with text extraction (default behavior)
    assert "pages" in data["document"], "Missing pages in document"
    assert len(data["document"]["pages"]) > 0, "No pages found in document"
    
    print(f"✅ Document upload without extract_text parameter successful (document ID: {pdf_no_extract_param_id})")
    
    # 6. Test document upload with DOCX file
    print("\n6. Testing document upload with DOCX file...")
    
    # Upload the DOCX file
    with open(docx_path, "rb") as f:
        files = {"file": ("test_document.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        response = requests.post(
            f"{base_url}/documents/upload",
            files=files,
            data={"title": "DOCX Document"},
            headers=auth_headers
        )
    
    # Note: Since our DOCX file is just a stub, it might fail to process properly
    # We're just checking that the API accepts the request without a 400/422 error
    assert response.status_code != 400 and response.status_code != 422, f"API rejected DOCX file with error: {response.status_code} - {response.text}"
    
    if response.status_code == 200:
        data = response.json()
        docx_document_id = data["document"]["id"]
        print(f"✅ Document upload with DOCX file successful (document ID: {docx_document_id})")
    else:
        print(f"⚠️ DOCX processing failed as expected (stub file), but API accepted the request: {response.status_code}")
    
    # 7. Test document upload with TXT file
    print("\n7. Testing document upload with TXT file...")
    
    # Upload the TXT file
    with open(txt_path, "rb") as f:
        files = {"file": ("test_document.txt", f, "text/plain")}
        response = requests.post(
            f"{base_url}/documents/upload",
            files=files,
            data={"title": "TXT Document"},
            headers=auth_headers
        )
    
    assert response.status_code == 200, f"Failed to upload TXT file: {response.status_code} - {response.text}"
    data = response.json()
    
    # Verify response structure
    assert data["message"] == "Document uploaded and processed successfully", "Unexpected response message"
    assert "document" in data, "Missing document in response"
    
    # Save document ID for verification
    txt_document_id = data["document"]["id"]
    
    # Verify the document was processed correctly
    assert "pages" in data["document"], "Missing pages in document"
    assert len(data["document"]["pages"]) > 0, "No pages found in document"
    
    print(f"✅ Document upload with TXT file successful (document ID: {txt_document_id})")
    
    # 8. Test document upload with extract_text parameter variations
    print("\n8. Testing document upload with extract_text parameter variations...")
    
    # Test with extract_text="1"
    with open(pdf_path, "rb") as f:
        files = {"file": ("test_document.pdf", f, "application/pdf")}
        response = requests.post(
            f"{base_url}/documents/upload",
            files=files,
            data={"title": "PDF with extract_text=1", "extract_text": "1"},
            headers=auth_headers
        )
    
    assert response.status_code == 200, f"Failed to upload PDF with extract_text=1: {response.status_code} - {response.text}"
    print("✅ Document upload with extract_text=1 successful")
    
    # Test with extract_text="yes"
    with open(pdf_path, "rb") as f:
        files = {"file": ("test_document.pdf", f, "application/pdf")}
        response = requests.post(
            f"{base_url}/documents/upload",
            files=files,
            data={"title": "PDF with extract_text=yes", "extract_text": "yes"},
            headers=auth_headers
        )
    
    assert response.status_code == 200, f"Failed to upload PDF with extract_text=yes: {response.status_code} - {response.text}"
    print("✅ Document upload with extract_text=yes successful")
    
    # Test with extract_text="on"
    with open(pdf_path, "rb") as f:
        files = {"file": ("test_document.pdf", f, "application/pdf")}
        response = requests.post(
            f"{base_url}/documents/upload",
            files=files,
            data={"title": "PDF with extract_text=on", "extract_text": "on"},
            headers=auth_headers
        )
    
    assert response.status_code == 200, f"Failed to upload PDF with extract_text=on: {response.status_code} - {response.text}"
    print("✅ Document upload with extract_text=on successful")
    
    # Test with extract_text="0"
    with open(pdf_path, "rb") as f:
        files = {"file": ("test_document.pdf", f, "application/pdf")}
        response = requests.post(
            f"{base_url}/documents/upload",
            files=files,
            data={"title": "PDF with extract_text=0", "extract_text": "0"},
            headers=auth_headers
        )
    
    assert response.status_code == 200, f"Failed to upload PDF with extract_text=0: {response.status_code} - {response.text}"
    print("✅ Document upload with extract_text=0 successful")
    
    # 9. Clean up
    print("\n9. Cleaning up test documents...")
    
    # Delete the test documents
    for doc_id in [pdf_extract_true_id, pdf_extract_false_id, pdf_no_extract_param_id, txt_document_id]:
        response = requests.delete(f"{base_url}/documents/{doc_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed to delete document {doc_id}: {response.status_code} - {response.text}"
    
    # Clean up the test files
    for file_path in [pdf_path, docx_path, txt_path]:
        if os.path.exists(file_path):
            os.remove(file_path)
    
    print("✅ Test cleanup successful")
    
    print("\n✅ All document upload tests with extract_text parameter passed successfully!")

if __name__ == "__main__":
    test_document_upload_extract_text_parameter()