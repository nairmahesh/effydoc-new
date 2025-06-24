import requests
import json
import uuid
import os
import time
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://7056c40d-c306-42f0-bfc6-379013315fc8.preview.emergentagent.com/api"

def test_document_preview_with_auth():
    """Test the document preview functionality with authentication"""
    print("Starting document preview tests with authentication...")
    
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
    
    try:
        response = requests.post(f"{base_url}/auth/register", json=user_data)
        print(f"Registration status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            access_token = data["access_token"]
            headers["Authorization"] = f"Bearer {access_token}"
            print("✅ User registration successful")
        else:
            print(f"❌ User registration failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Error during user registration: {str(e)}")
        return
    
    # 2. Create a test document with HTML content
    print("\n2. Creating test document with HTML content...")
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
    
    try:
        response = requests.post(f"{base_url}/documents", json=document_data, headers=headers)
        print(f"Document creation status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            document_id = data["id"]
            print(f"✅ Document created successfully with ID: {document_id}")
        else:
            print(f"❌ Document creation failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Error creating document: {str(e)}")
        return
    
    # 3. Retrieve the document to verify it exists
    print("\n3. Retrieving document...")
    try:
        response = requests.get(f"{base_url}/documents/{document_id}", headers=headers)
        print(f"Document retrieval status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Document retrieved successfully")
            
            # Verify document data
            if data["id"] == document_id:
                print(f"✅ Document ID matches: {document_id}")
            else:
                print(f"❌ Document ID mismatch: expected {document_id}, got {data['id']}")
            
            if data["title"] == "Test Document for Preview":
                print(f"✅ Document title matches")
            else:
                print(f"❌ Document title mismatch: expected 'Test Document for Preview', got '{data['title']}'")
            
            # Check if the document has sections
            if "sections" in data and len(data["sections"]) == 2:
                print(f"✅ Document has expected number of sections: {len(data['sections'])}")
            else:
                print(f"❌ Document sections mismatch: expected 2, got {len(data.get('sections', []))}")
            
            # Check if the document has pages
            has_pages = "pages" in data and data["pages"] and len(data["pages"]) > 0
            print(f"Document has pages: {has_pages}")
            if has_pages:
                print(f"Number of pages: {len(data['pages'])}")
            else:
                print("Document does not have pages array or it's empty")
            
            # Check if HTML content is preserved
            if "sections" in data and data["sections"]:
                section_content = data["sections"][0]["content"]
                html_in_section = "<div" in section_content or "<h1" in section_content or "<p" in section_content
                print(f"HTML content in sections: {html_in_section}")
                if html_in_section:
                    print(f"✅ HTML content is preserved in sections")
                else:
                    print(f"❌ HTML content is not preserved in sections")
            
            # Check pages for HTML content if they exist
            if has_pages:
                page_content = data["pages"][0]["content"]
                html_in_page = "<div" in page_content or "<h1" in page_content or "<p" in page_content
                print(f"HTML content in pages: {html_in_page}")
                if html_in_page:
                    print(f"✅ HTML content is preserved in pages")
                else:
                    print(f"❌ HTML content is not preserved in pages")
        else:
            print(f"❌ Document retrieval failed: {response.text}")
    except Exception as e:
        print(f"❌ Error retrieving document: {str(e)}")
    
    # 4. Test document upload with HTML content
    print("\n4. Testing document upload with HTML content...")
    try:
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
        
        print(f"Document upload status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            uploaded_document_id = data["document"]["id"]
            print(f"✅ Document uploaded successfully with ID: {uploaded_document_id}")
            
            # Retrieve the uploaded document
            print("\n5. Retrieving uploaded document...")
            response = requests.get(f"{base_url}/documents/{uploaded_document_id}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Uploaded document retrieved successfully")
                
                # Verify document data
                if data["id"] == uploaded_document_id:
                    print(f"✅ Uploaded document ID matches: {uploaded_document_id}")
                else:
                    print(f"❌ Uploaded document ID mismatch: expected {uploaded_document_id}, got {data['id']}")
                
                if data["title"] == "Uploaded HTML Document":
                    print(f"✅ Uploaded document title matches")
                else:
                    print(f"❌ Uploaded document title mismatch: expected 'Uploaded HTML Document', got '{data['title']}'")
                
                # Check if the document has pages
                has_pages = "pages" in data and data["pages"] and len(data["pages"]) > 0
                print(f"Uploaded document has pages: {has_pages}")
                if has_pages:
                    print(f"Number of pages: {len(data['pages'])}")
                    
                    # Check if HTML content is preserved in pages
                    page_content = data["pages"][0]["content"]
                    html_in_page = "<div" in page_content or "<h1" in page_content or "<p" in page_content
                    print(f"HTML content in uploaded document pages: {html_in_page}")
                    if html_in_page:
                        print(f"✅ HTML content is preserved in uploaded document pages")
                    else:
                        print(f"❌ HTML content is not preserved in uploaded document pages")
                    print(f"First 100 characters of page content: {page_content[:100]}")
            else:
                print(f"❌ Uploaded document retrieval failed: {response.text}")
        else:
            print(f"❌ Document upload failed: {response.text}")
    except Exception as e:
        print(f"❌ Error during document upload test: {str(e)}")
    
    # 6. Clean up
    print("\n6. Cleaning up...")
    try:
        # Delete the test documents
        response = requests.delete(f"{base_url}/documents/{document_id}", headers=headers)
        if response.status_code == 200:
            print(f"✅ First test document deleted successfully")
        else:
            print(f"❌ Failed to delete first test document: {response.text}")
        
        if 'uploaded_document_id' in locals():
            response = requests.delete(f"{base_url}/documents/{uploaded_document_id}", headers=headers)
            if response.status_code == 200:
                print(f"✅ Uploaded test document deleted successfully")
            else:
                print(f"❌ Failed to delete uploaded test document: {response.text}")
        
        # Clean up the test file
        if os.path.exists(test_file_path):
            os.remove(test_file_path)
            print(f"✅ Test file cleaned up")
    except Exception as e:
        print(f"❌ Error during cleanup: {str(e)}")
    
    print("\n✅ Document preview functionality test with authentication completed!")

if __name__ == "__main__":
    test_document_preview_with_auth()