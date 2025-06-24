import requests
import json
import unittest
import uuid
import os
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://7056c40d-c306-42f0-bfc6-379013315fc8.preview.emergentagent.com/api"

def test_document_loading():
    """Test the document loading functionality"""
    print("Starting document loading tests...")
    
    # Test variables
    base_url = BACKEND_URL
    headers = {"Content-Type": "application/json"}
    test_user_email = f"test.user.{uuid.uuid4()}@example.com"
    test_user_password = "SecurePassword123!"
    test_document_id = None
    
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
        "title": "Test Document for Loading",
        "type": "proposal",
        "organization": "Test Organization",
        "sections": [
            {
                "title": "Introduction",
                "content": "This is a test document introduction.",
                "order": 1
            },
            {
                "title": "Requirements",
                "content": "These are the test requirements.",
                "order": 2
            }
        ],
        "collaborators": [],
        "tags": ["test", "api", "loading"],
        "metadata": {"purpose": "testing document loading"}
    }
    
    response = requests.post(f"{base_url}/documents", json=document_data, headers=headers)
    assert response.status_code == 200, f"Failed to create document: {response.text}"
    data = response.json()
    
    # Save document ID for subsequent tests
    test_document_id = data["id"]
    print(f"✅ Document created with ID: {test_document_id}")
    
    # 3. Test getting all documents
    print("\n3. Testing get all documents...")
    response = requests.get(f"{base_url}/documents", headers=headers)
    print(f"Status code: {response.status_code}")
    print(f"Response headers: {response.headers}")
    
    if response.status_code != 200:
        print(f"Error response: {response.text}")
        
    assert response.status_code == 200, f"Failed to get documents: {response.text}"
    data = response.json()
    
    # Verify documents list
    assert isinstance(data, list), f"Expected list, got {type(data)}"
    assert len(data) >= 1, f"Expected at least 1 document, got {len(data)}"
    
    # Check if our test document is in the list
    document_found = False
    for doc in data:
        if doc["id"] == test_document_id:
            document_found = True
            break
    
    assert document_found, "Test document not found in documents list"
    print("✅ Get all documents working")
    
    # 4. Test getting a specific document
    print("\n4. Testing get specific document...")
    response = requests.get(f"{base_url}/documents/{test_document_id}", headers=headers)
    print(f"Status code: {response.status_code}")
    print(f"Response headers: {response.headers}")
    
    if response.status_code != 200:
        print(f"Error response: {response.text}")
        
    assert response.status_code == 200, f"Failed to get specific document: {response.text}"
    data = response.json()
    
    # Verify document data
    assert data["id"] == test_document_id, f"Expected {test_document_id}, got {data['id']}"
    assert data["title"] == "Test Document for Loading", f"Expected 'Test Document for Loading', got {data['title']}"
    print("✅ Get specific document working")
    
    # 5. Test document upload with text file
    print("\n5. Testing document upload with text file...")
    
    # Create a test text file
    test_file_path = "/tmp/test_document_loading.txt"
    with open(test_file_path, "w") as f:
        f.write("This is a test document for loading. It contains multiple paragraphs to test the document loading functionality.")
    
    # Upload the file
    with open(test_file_path, "rb") as f:
        files = {"file": ("test_document_loading.txt", f, "text/plain")}
        response = requests.post(
            f"{base_url}/documents/upload",
            files=files,
            data={"title": "Test Document Upload for Loading"},
            headers={"Authorization": headers["Authorization"]}
        )
    
    print(f"Status code: {response.status_code}")
    print(f"Response headers: {response.headers}")
    
    if response.status_code != 200:
        print(f"Error response: {response.text}")
        
    assert response.status_code == 200, f"Failed to upload document: {response.text}"
    data = response.json()
    
    # Verify upload response
    assert data["message"] == "Document uploaded and processed successfully", f"Expected 'Document uploaded and processed successfully', got {data['message']}"
    assert "document" in data, "Missing document in response"
    assert data["document"]["title"] == "Test Document Upload for Loading", f"Expected 'Test Document Upload for Loading', got {data['document']['title']}"
    
    # Save uploaded document ID for subsequent tests
    uploaded_document_id = data["document"]["id"]
    print(f"✅ Document uploaded with ID: {uploaded_document_id}")
    
    # 6. Test getting the uploaded document
    print("\n6. Testing get uploaded document...")
    response = requests.get(f"{base_url}/documents/{uploaded_document_id}", headers=headers)
    print(f"Status code: {response.status_code}")
    print(f"Response headers: {response.headers}")
    
    if response.status_code != 200:
        print(f"Error response: {response.text}")
        
    assert response.status_code == 200, f"Failed to get uploaded document: {response.text}"
    data = response.json()
    
    # Verify document data
    assert data["id"] == uploaded_document_id, f"Expected {uploaded_document_id}, got {data['id']}"
    assert data["title"] == "Test Document Upload for Loading", f"Expected 'Test Document Upload for Loading', got {data['title']}"
    print("✅ Get uploaded document working")
    
    # 7. Clean up
    print("\n7. Cleaning up test documents...")
    
    # Delete the test documents
    response = requests.delete(f"{base_url}/documents/{test_document_id}", headers=headers)
    assert response.status_code == 200, f"Failed to delete test document: {response.text}"
    
    response = requests.delete(f"{base_url}/documents/{uploaded_document_id}", headers=headers)
    assert response.status_code == 200, f"Failed to delete uploaded document: {response.text}"
    
    # Clean up the test file
    if os.path.exists(test_file_path):
        os.remove(test_file_path)
    
    print("✅ Test cleanup successful")
    print("\n✅ All document loading tests passed successfully!")

if __name__ == "__main__":
    test_document_loading()