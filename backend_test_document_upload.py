import requests
import json
import unittest
import uuid
import os
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://4aa54517-8e64-4037-8338-35ac94bb76b8.preview.emergentagent.com/api"

def test_document_upload_and_page_viewing():
    """Test the document upload functionality and page-wise viewing"""
    print("Starting document upload and page-wise viewing tests...")
    
    # Test variables
    base_url = BACKEND_URL
    headers = {"Content-Type": "application/json"}
    test_user_email = f"test.user.{uuid.uuid4()}@example.com"
    test_user_password = "SecurePassword123!"
    
    # 1. Register a test user
    print("\n1. Registering a test user...")
    user_data = {
        "email": test_user_email,
        "full_name": "Test User",
        "role": "editor",
        "organization": "Test Organization",
        "password": test_user_password
    }
    
    response = requests.post(f"{base_url}/auth/register", json=user_data)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Save token for subsequent tests
    access_token = data["access_token"]
    headers["Authorization"] = f"Bearer {access_token}"
    print("✅ User registration successful")
    
    # 2. Create a test text file with multiple pages
    print("\n2. Creating a test text file with multiple pages...")
    test_file_path = "/tmp/test_document_pages.txt"
    with open(test_file_path, "w") as f:
        f.write("Page 1 Content\nThis is the content for page 1.\nIt has multiple lines.\n\n")
        f.write("Page 2 Content\nThis is the content for page 2.\nIt also has multiple lines.\n\n")
        f.write("Page 3 Content\nThis is the content for page 3.\nIt has even more lines of text.\n\n")
        f.write("Page 4 Content\nThis is the content for page 4.\nThe final page of our test document.\n\n")
    print("✅ Test file created successfully")
    
    # 3. Test document upload with text file
    print("\n3. Testing document upload with text file...")
    with open(test_file_path, "rb") as f:
        files = {"file": ("test_document_pages.txt", f, "text/plain")}
        response = requests.post(
            f"{base_url}/documents/upload",
            files=files,
            data={"title": "Test Document Pages"},
            headers={"Authorization": headers["Authorization"]}
        )
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify upload response
    assert data["message"] == "Document uploaded and processed successfully", f"Expected 'Document uploaded and processed successfully', got {data['message']}"
    assert "document" in data, "Missing document in response"
    assert data["document"]["title"] == "Test Document Pages", f"Expected 'Test Document Pages', got {data['document']['title']}"
    
    # Verify page-wise structure
    assert "total_pages" in data, "Missing total_pages in response"
    assert data["total_pages"] > 0, "Document should have at least one page"
    assert "processing_method" in data, "Missing processing_method in response"
    assert data["processing_method"] == "page_wise_extraction", "Incorrect processing method"
    
    # Save document ID for subsequent tests
    document_id = data["document"]["id"]
    total_pages = data["total_pages"]
    
    print(f"✅ Document upload successful with {total_pages} pages")
    
    # 4. Test document retrieval with page-wise structure
    print("\n4. Testing document retrieval with page-wise structure...")
    response = requests.get(f"{base_url}/documents/{document_id}", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify document structure
    assert "id" in data, "Missing id in response"
    assert data["id"] == document_id, f"Expected {document_id}, got {data['id']}"
    assert "title" in data, "Missing title in response"
    assert data["title"] == "Test Document Pages", f"Expected 'Test Document Pages', got {data['title']}"
    
    # Verify sections array (legacy support)
    assert "sections" in data, "Missing sections in response"
    assert isinstance(data["sections"], list), "Sections should be a list"
    assert len(data["sections"]) > 0, "Document should have at least one section"
    
    # Verify pages array (new page-wise structure)
    assert "pages" in data, "Missing pages in response"
    assert isinstance(data["pages"], list), "Pages should be a list"
    assert len(data["pages"]) > 0, "Document should have at least one page"
    assert len(data["pages"]) == total_pages, f"Expected {total_pages} pages, got {len(data['pages'])}"
    
    # Verify total_pages field
    assert "total_pages" in data, "Missing total_pages in response"
    assert data["total_pages"] == total_pages, f"Expected {total_pages} total_pages, got {data['total_pages']}"
    
    # Verify page structure
    for page in data["pages"]:
        assert "id" in page, "Missing id in page"
        assert "page_number" in page, "Missing page_number in page"
        assert "title" in page, "Missing title in page"
        assert "content" in page, "Missing content in page"
        assert isinstance(page["page_number"], int), "page_number should be an integer"
        assert page["page_number"] > 0, "page_number should be positive"
        assert page["title"], "Page title should not be empty"
        assert page["content"], "Page content should not be empty"
    
    print("✅ Document retrieval with page-wise structure successful")
    
    # 5. Test updating a specific page
    print("\n5. Testing update of a specific page...")
    page_number = 1  # Update the first page
    page_update_data = {
        "title": "Updated Page 1",
        "content": "This is the updated content for page 1."
    }
    
    response = requests.put(
        f"{base_url}/documents/{document_id}/pages/{page_number}",
        json=page_update_data,
        headers=headers
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify page update response
    assert data["message"] == "Page updated successfully", f"Expected 'Page updated successfully', got {data['message']}"
    
    # Verify the update by getting the document
    response = requests.get(f"{base_url}/documents/{document_id}", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Find the updated page
    updated_page = None
    for page in data["pages"]:
        if page["page_number"] == page_number:
            updated_page = page
            break
    
    assert updated_page is not None, f"Page {page_number} not found in document"
    assert updated_page["title"] == "Updated Page 1", f"Expected 'Updated Page 1', got {updated_page['title']}"
    assert updated_page["content"] == "This is the updated content for page 1.", f"Content not updated correctly"
    
    print("✅ Page update successful")
    
    # 6. Test adding multimedia element to a page
    print("\n6. Testing add multimedia element to a page...")
    multimedia_data = {
        "type": "image",
        "url": "https://example.com/image.jpg",
        "title": "Test Image",
        "description": "A test image for the document"
    }
    
    response = requests.post(
        f"{base_url}/documents/{document_id}/pages/{page_number}/multimedia",
        json=multimedia_data,
        headers=headers
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify multimedia element response
    assert "message" in data, "Missing message in response"
    assert data["message"] == "Multimedia element added to page successfully", f"Expected 'Multimedia element added to page successfully', got {data['message']}"
    assert "element" in data, "Missing element in response"
    assert data["element"]["type"] == "image", f"Expected 'image', got {data['element']['type']}"
    assert data["element"]["url"] == "https://example.com/image.jpg", f"URL not set correctly"
    
    print("✅ Adding multimedia element to page successful")
    
    # 7. Test adding interactive element to a page
    print("\n7. Testing add interactive element to a page...")
    interactive_data = {
        "type": "button",
        "label": "Click Me",
        "action": "https://example.com/action"
    }
    
    response = requests.post(
        f"{base_url}/documents/{document_id}/pages/{page_number}/interactive",
        json=interactive_data,
        headers=headers
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify interactive element response
    assert "message" in data, "Missing message in response"
    assert data["message"] == "Interactive element added to page successfully", f"Expected 'Interactive element added to page successfully', got {data['message']}"
    assert "element" in data, "Missing element in response"
    assert data["element"]["type"] == "button", f"Expected 'button', got {data['element']['type']}"
    assert data["element"]["label"] == "Click Me", f"Label not set correctly"
    
    print("✅ Adding interactive element to page successful")
    
    # 8. Test page-wise analytics
    print("\n8. Testing page-wise analytics...")
    response = requests.get(f"{base_url}/documents/{document_id}/page-analytics", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify analytics structure
    assert "document_id" in data, "Missing document_id in response"
    assert data["document_id"] == document_id, f"Expected {document_id}, got {data['document_id']}"
    assert "total_pages" in data, "Missing total_pages in response"
    assert data["total_pages"] == total_pages, f"Expected {total_pages} total_pages, got {data['total_pages']}"
    assert "page_analytics" in data, "Missing page_analytics in response"
    assert isinstance(data["page_analytics"], list), "page_analytics should be a list"
    assert len(data["page_analytics"]) == total_pages, f"Expected {total_pages} page analytics, got {len(data['page_analytics'])}"
    
    print("✅ Page-wise analytics successful")
    
    # 9. Test tracking page view
    print("\n9. Testing track page view...")
    view_data = {
        "document_id": document_id,
        "page_number": 1,
        "viewer_info": {
            "ip_address": "192.168.1.1",
            "user_agent": "Test User Agent"
        },
        "time_spent": 30,
        "scroll_depth": 0.8
    }
    
    response = requests.post(f"{base_url}/tracking/page-view", json=view_data)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify response
    assert "message" in data, "Missing message in response"
    assert data["message"] == "Page view tracked successfully", f"Expected 'Page view tracked successfully', got {data['message']}"
    assert "session_id" in data, "Missing session_id in response"
    
    print("✅ Track page view successful")
    
    # 10. Clean up - delete the test document
    print("\n10. Cleaning up - deleting test document...")
    response = requests.delete(f"{base_url}/documents/{document_id}", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    # Clean up the test file
    if os.path.exists(test_file_path):
        os.remove(test_file_path)
    
    print("✅ Cleanup successful")
    print("\n✅ All document upload and page-wise viewing tests passed successfully!")

if __name__ == "__main__":
    test_document_upload_and_page_viewing()