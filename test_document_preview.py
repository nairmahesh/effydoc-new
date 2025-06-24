import requests
import json
import uuid
import os
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://7056c40d-c306-42f0-bfc6-379013315fc8.preview.emergentagent.com/api"

def test_document_preview():
    """Test the document preview functionality"""
    print("Starting document preview tests...")
    
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
    headers["Authorization"] = f"Bearer {access_token}"
    print("✅ User registration successful")
    
    # 2. Create a test document
    print("\n2. Creating test document...")
    document_data = {
        "title": "Test Document for Preview",
        "type": "proposal",
        "organization": "Test Organization",
        "sections": [
            {
                "title": "Introduction",
                "content": "<div style='font-family: Arial;'><h1>Introduction</h1><p>This is a <b>formatted</b> test document with <i>HTML content</i> for preview testing.</p><ul><li>Item 1</li><li>Item 2</li></ul></div>",
                "order": 1
            },
            {
                "title": "Details",
                "content": "<div style='font-family: Arial;'><h2>Details Section</h2><p>This section contains more formatted content.</p><table border='1'><tr><th>Header 1</th><th>Header 2</th></tr><tr><td>Cell 1</td><td>Cell 2</td></tr></table></div>",
                "order": 2
            }
        ],
        "collaborators": [],
        "tags": ["test", "preview"],
        "metadata": {"purpose": "testing"}
    }
    
    response = requests.post(f"{base_url}/documents", json=document_data, headers=headers)
    assert response.status_code == 200, f"Failed to create document: {response.text}"
    data = response.json()
    
    # Save document ID for subsequent tests
    document_id = data["id"]
    print(f"✅ Document created successfully with ID: {document_id}")
    
    # 3. Retrieve the document to verify it exists
    print("\n3. Retrieving document...")
    response = requests.get(f"{base_url}/documents/{document_id}", headers=headers)
    assert response.status_code == 200, f"Failed to retrieve document: {response.text}"
    data = response.json()
    
    # Verify document data
    assert data["id"] == document_id, "Document ID mismatch"
    assert data["title"] == "Test Document for Preview", "Document title mismatch"
    assert len(data["sections"]) == 2, f"Expected 2 sections, got {len(data['sections'])}"
    
    # Check if the document has pages
    has_pages = "pages" in data and data["pages"] and len(data["pages"]) > 0
    print(f"Document has pages: {has_pages}")
    if has_pages:
        print(f"Number of pages: {len(data['pages'])}")
    else:
        print("Document does not have pages array or it's empty")
    
    # 4. Check if HTML content is preserved
    print("\n4. Checking HTML content preservation...")
    
    # Check sections for HTML content
    section_content = data["sections"][0]["content"]
    html_in_section = "<div" in section_content or "<h1" in section_content or "<p" in section_content
    print(f"HTML content in sections: {html_in_section}")
    
    # Check pages for HTML content if they exist
    if has_pages:
        page_content = data["pages"][0]["content"]
        html_in_page = "<div" in page_content or "<h1" in page_content or "<p" in page_content
        print(f"HTML content in pages: {html_in_page}")
    
    # 5. Test document upload with HTML content
    print("\n5. Testing document upload with HTML content...")
    
    # Create a test HTML file
    test_file_path = "/tmp/test_formatted_document.txt"
    with open(test_file_path, "w") as f:
        f.write("<div style='font-family: Arial;'><h1>Uploaded HTML Document</h1><p>This is an <b>uploaded</b> document with <i>HTML formatting</i>.</p><ul><li>Upload Item 1</li><li>Upload Item 2</li></ul></div>")
    
    # Upload the file
    with open(test_file_path, "rb") as f:
        files = {"file": ("test_formatted_document.txt", f, "text/plain")}
        response = requests.post(
            f"{base_url}/documents/upload",
            files=files,
            data={"title": "Uploaded HTML Document"},
            headers={"Authorization": headers["Authorization"]}
        )
    
    assert response.status_code == 200, f"Failed to upload document: {response.text}"
    data = response.json()
    
    # Save uploaded document ID
    uploaded_document_id = data["document"]["id"]
    print(f"✅ Document uploaded successfully with ID: {uploaded_document_id}")
    
    # 6. Retrieve the uploaded document
    print("\n6. Retrieving uploaded document...")
    response = requests.get(f"{base_url}/documents/{uploaded_document_id}", headers=headers)
    assert response.status_code == 200, f"Failed to retrieve uploaded document: {response.text}"
    data = response.json()
    
    # Verify document data
    assert data["id"] == uploaded_document_id, "Document ID mismatch"
    assert data["title"] == "Uploaded HTML Document", "Document title mismatch"
    
    # Check if the document has pages
    has_pages = "pages" in data and data["pages"] and len(data["pages"]) > 0
    print(f"Uploaded document has pages: {has_pages}")
    if has_pages:
        print(f"Number of pages: {len(data['pages'])}")
        
        # Check if HTML content is preserved in pages
        page_content = data["pages"][0]["content"]
        html_in_page = "<div" in page_content or "<h1" in page_content or "<p" in page_content
        print(f"HTML content in uploaded document pages: {html_in_page}")
        print(f"First 100 characters of page content: {page_content[:100]}")
    
    # 7. Clean up
    print("\n7. Cleaning up...")
    
    # Delete the test documents
    response = requests.delete(f"{base_url}/documents/{document_id}", headers=headers)
    assert response.status_code == 200, f"Failed to delete document: {response.text}"
    
    response = requests.delete(f"{base_url}/documents/{uploaded_document_id}", headers=headers)
    assert response.status_code == 200, f"Failed to delete uploaded document: {response.text}"
    
    # Clean up the test file
    if os.path.exists(test_file_path):
        os.remove(test_file_path)
    
    print("✅ Test cleanup successful")
    print("\n✅ All document preview tests completed!")

if __name__ == "__main__":
    test_document_preview()