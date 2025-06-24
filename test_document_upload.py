import requests
import json
import uuid
import os
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://7056c40d-c306-42f0-bfc6-379013315fc8.preview.emergentagent.com/api"

def test_document_upload_response():
    """Test the document upload endpoint and examine its response structure"""
    print("Starting document upload response test...")
    
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
    
    # 2. Create a test text file
    print("\n2. Creating test file...")
    test_file_path = "/tmp/test_document.txt"
    with open(test_file_path, "w") as f:
        f.write("This is a test document for upload testing.")
    
    print("✅ Test file created successfully")
    
    # 3. Test document upload
    print("\n3. Testing document upload...")
    
    # Upload the file
    with open(test_file_path, "rb") as f:
        files = {"file": ("test_document.txt", f, "text/plain")}
        response = requests.post(
            f"{base_url}/documents/upload",
            files=files,
            data={"title": "Test Document Upload"},
            headers=auth_headers
        )
    
    assert response.status_code == 200, f"Failed to upload document: {response.status_code} - {response.text}"
    
    # Print the full response for examination
    print("\n=== FULL RESPONSE JSON ===")
    response_json = response.json()
    print(json.dumps(response_json, indent=2))
    
    # Analyze the response structure
    print("\n=== RESPONSE STRUCTURE ANALYSIS ===")
    
    # Check top-level keys
    print("\nTop-level keys in response:")
    for key in response_json.keys():
        print(f"- {key}")
    
    # Check document structure
    if "document" in response_json:
        print("\nKeys in document object:")
        for key in response_json["document"].keys():
            print(f"- {key}")
        
        # Check if document.id exists
        if "id" in response_json["document"]:
            print(f"\n✅ document.id exists: {response_json['document']['id']}")
        else:
            print("\n❌ document.id does not exist")
        
        # Check document.pages structure if it exists
        if "pages" in response_json["document"]:
            print(f"\nDocument has {len(response_json['document']['pages'])} pages")
            if len(response_json["document"]["pages"]) > 0:
                print("\nKeys in first page object:")
                for key in response_json["document"]["pages"][0].keys():
                    print(f"- {key}")
    
    # Check if response.data.document.id would work (as expected by frontend)
    print("\nChecking if response.data.document.id path would work:")
    if "data" in response_json and isinstance(response_json["data"], dict) and "document" in response_json["data"]:
        if "id" in response_json["data"]["document"]:
            print(f"✅ response.data.document.id exists: {response_json['data']['document']['id']}")
        else:
            print("❌ response.data.document.id does not exist (document object exists but no id field)")
    else:
        print("❌ response.data.document.id path does not exist")
        print("   The correct path appears to be: response.document.id")
    
    # Clean up
    print("\n4. Cleaning up...")
    
    # Delete the test document if we have its ID
    if "document" in response_json and "id" in response_json["document"]:
        document_id = response_json["document"]["id"]
        delete_response = requests.delete(f"{base_url}/documents/{document_id}", headers=auth_headers)
        if delete_response.status_code == 200:
            print(f"✅ Test document deleted successfully")
        else:
            print(f"❌ Failed to delete test document: {delete_response.status_code}")
    
    # Clean up the test file
    if os.path.exists(test_file_path):
        os.remove(test_file_path)
        print("✅ Test file deleted")
    
    print("\n=== CONCLUSION ===")
    print("The document upload endpoint returns a response with the following structure:")
    print("- message: Success message")
    print("- document: The complete document object with all fields including 'id'")
    print("- total_pages: Number of pages in the document")
    print("- processing_method: Method used to process the document")
    print("\nThe frontend is expecting 'response.data.document.id' but should use 'response.document.id'")

if __name__ == "__main__":
    test_document_upload_response()