import requests
import json
import unittest
import uuid
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://17ed463c-9548-4e22-8aff-b664035c3bd4.preview.emergentagent.com/api"

def test_backend_api():
    """Test the backend API endpoints"""
    print("Starting API tests...")
    
    # Test variables
    base_url = BACKEND_URL
    headers = {"Content-Type": "application/json"}
    test_user_email = f"test.user.{uuid.uuid4()}@example.com"
    test_user_password = "SecurePassword123!"
    test_document_id = None
    
    # 1. Test health check endpoint
    print("\n1. Testing health check endpoint...")
    response = requests.get(f"{base_url}/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data["status"] == "healthy", f"Expected 'healthy', got {data['status']}"
    print("✅ Health check endpoint working")
    
    # 2. Test root endpoint
    print("\n2. Testing root endpoint...")
    response = requests.get(f"{base_url}/")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data["message"] == "Document Platform API", f"Expected 'Document Platform API', got {data['message']}"
    print("✅ Root endpoint working")
    
    # 3. Test user registration
    print("\n3. Testing user registration...")
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
    
    # Verify response structure
    assert "access_token" in data, "Missing access_token in response"
    assert data["token_type"] == "bearer", f"Expected 'bearer', got {data['token_type']}"
    assert "user" in data, "Missing user in response"
    assert data["user"]["email"] == test_user_email, f"Expected {test_user_email}, got {data['user']['email']}"
    
    # Save token for subsequent tests
    access_token = data["access_token"]
    headers["Authorization"] = f"Bearer {access_token}"
    print("✅ User registration working")
    
    # 4. Test user login
    print("\n4. Testing user login...")
    response = requests.post(
        f"{base_url}/auth/login",
        params={"email": test_user_email, "password": test_user_password}
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify response structure
    assert "access_token" in data, "Missing access_token in response"
    assert data["token_type"] == "bearer", f"Expected 'bearer', got {data['token_type']}"
    assert "user" in data, "Missing user in response"
    assert data["user"]["email"] == test_user_email, f"Expected {test_user_email}, got {data['user']['email']}"
    
    # Update token for subsequent tests
    access_token = data["access_token"]
    headers["Authorization"] = f"Bearer {access_token}"
    print("✅ User login working")
    
    # 5. Test getting current user profile
    print("\n5. Testing get current user profile...")
    response = requests.get(f"{base_url}/users/me", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify user data
    assert data["email"] == test_user_email, f"Expected {test_user_email}, got {data['email']}"
    assert data["full_name"] == "Test User", f"Expected 'Test User', got {data['full_name']}"
    
    # Verify email integration fields
    assert "email_connections" in data, "Missing email_connections in user profile"
    assert "notification_settings" in data, "Missing notification_settings in user profile"
    assert "email_signature" in data, "Missing email_signature in user profile"
    print("✅ Get current user profile working with email fields")
    
    # 6. Test adding email connection
    print("\n6. Testing add email connection...")
    email_connection_data = {
        "provider": "gmail",
        "email_address": "test.gmail@example.com",
        "display_name": "Test Gmail",
        "is_primary": True
    }
    
    response = requests.post(f"{base_url}/users/me/email-connections", json=email_connection_data, headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify email connection data
    assert data["provider"] == "gmail", f"Expected 'gmail', got {data['provider']}"
    assert data["email_address"] == "test.gmail@example.com", f"Expected 'test.gmail@example.com', got {data['email_address']}"
    assert data["is_primary"] == True, f"Expected True, got {data['is_primary']}"
    
    # Save connection ID for subsequent tests
    gmail_connection_id = data["id"]
    print("✅ Add email connection working")
    
    # 7. Test adding second email connection
    print("\n7. Testing add second email connection...")
    email_connection_data = {
        "provider": "outlook",
        "email_address": "test.outlook@example.com",
        "display_name": "Test Outlook",
        "is_primary": False
    }
    
    response = requests.post(f"{base_url}/users/me/email-connections", json=email_connection_data, headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify email connection data
    assert data["provider"] == "outlook", f"Expected 'outlook', got {data['provider']}"
    assert data["email_address"] == "test.outlook@example.com", f"Expected 'test.outlook@example.com', got {data['email_address']}"
    assert data["is_primary"] == False, f"Expected False, got {data['is_primary']}"
    
    # Save connection ID for subsequent tests
    outlook_connection_id = data["id"]
    print("✅ Add second email connection working")
    
    # 8. Test getting email connections
    print("\n8. Testing get email connections...")
    response = requests.get(f"{base_url}/users/me/email-connections", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify email connections list
    assert isinstance(data, list), f"Expected list, got {type(data)}"
    assert len(data) == 2, f"Expected 2 email connections, got {len(data)}"
    
    # Check if our test connections are in the list
    gmail_found = False
    outlook_found = False
    for connection in data:
        if connection["provider"] == "gmail":
            gmail_found = True
            assert connection["is_primary"] == True, "Gmail connection should be primary"
        elif connection["provider"] == "outlook":
            outlook_found = True
            assert connection["is_primary"] == False, "Outlook connection should not be primary"
    
    assert gmail_found, "Gmail connection not found in connections list"
    assert outlook_found, "Outlook connection not found in connections list"
    print("✅ Get email connections working")
    
    # 9. Test setting primary email connection
    print("\n9. Testing set primary email connection...")
    response = requests.put(f"{base_url}/users/me/email-connections/{outlook_connection_id}/primary", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify response
    assert data["message"] == "Primary email connection updated", f"Expected 'Primary email connection updated', got {data['message']}"
    
    # Verify the change by getting connections again
    response = requests.get(f"{base_url}/users/me/email-connections", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    for connection in data:
        if connection["id"] == outlook_connection_id:
            assert connection["is_primary"] == True, "Outlook connection should now be primary"
        elif connection["id"] == gmail_connection_id:
            assert connection["is_primary"] == False, "Gmail connection should no longer be primary"
    
    print("✅ Set primary email connection working")
    
    # 10. Test updating notification settings
    print("\n10. Testing update notification settings...")
    notification_settings = {
        "email_notifications": True,
        "document_shared": True,
        "document_viewed": False,
        "comment_added": True,
        "mention_in_comment": True
    }
    
    response = requests.put(f"{base_url}/users/me/notification-settings", json=notification_settings, headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify response
    assert data["message"] == "Notification settings updated successfully", f"Expected 'Notification settings updated successfully', got {data['message']}"
    
    # Verify the change by getting user profile
    response = requests.get(f"{base_url}/users/me", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    assert data["notification_settings"]["document_viewed"] == False, "document_viewed setting should be False"
    assert data["notification_settings"]["comment_added"] == True, "comment_added setting should be True"
    print("✅ Update notification settings working")
    
    # 11. Test updating email signature
    print("\n11. Testing update email signature...")
    signature_data = {
        "signature": "Best regards,\nTest User\nTechCorp"
    }
    
    response = requests.put(f"{base_url}/users/me/email-signature", json=signature_data, headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify response
    assert data["message"] == "Email signature updated successfully", f"Expected 'Email signature updated successfully', got {data['message']}"
    
    # Verify the change by getting user profile
    response = requests.get(f"{base_url}/users/me", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    assert data["email_signature"] == "Best regards,\nTest User\nTechCorp", f"Email signature not updated correctly"
    print("✅ Update email signature working")
    
    # 12. Test removing email connection
    print("\n12. Testing remove email connection...")
    response = requests.delete(f"{base_url}/users/me/email-connections/{gmail_connection_id}", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify response
    assert data["message"] == "Email connection removed successfully", f"Expected 'Email connection removed successfully', got {data['message']}"
    
    # Verify the change by getting connections again
    response = requests.get(f"{base_url}/users/me/email-connections", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    assert len(data) == 1, f"Expected 1 email connection, got {len(data)}"
    assert data[0]["id"] == outlook_connection_id, "Wrong email connection was removed"
    print("✅ Remove email connection working")
    
    # 13. Test document creation
    print("\n13. Testing document creation...")
    document_data = {
        "title": "Test Document",
        "type": "rfp",
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
        "tags": ["test", "api"],
        "metadata": {"purpose": "testing"}
    }
    
    response = requests.post(f"{base_url}/documents", json=document_data, headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify document data
    assert data["title"] == "Test Document", f"Expected 'Test Document', got {data['title']}"
    assert data["type"] == "rfp", f"Expected 'rfp', got {data['type']}"
    assert len(data["sections"]) == 2, f"Expected 2 sections, got {len(data['sections'])}"
    
    # Save document ID for subsequent tests
    test_document_id = data["id"]
    print("✅ Document creation working")
    
    # 14. Test sending document via email
    print("\n14. Testing send document via email...")
    email_data = {
        "recipients": ["recipient@example.com"],
        "subject": "Test Document",
        "message": "Please review this document."
    }
    
    response = requests.post(f"{base_url}/documents/{test_document_id}/send-email", json=email_data, headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify response
    assert data["message"] == "Email sent successfully", f"Expected 'Email sent successfully', got {data['message']}"
    assert data["recipients"] == ["recipient@example.com"], f"Expected ['recipient@example.com'], got {data['recipients']}"
    assert data["document_title"] == "Test Document", f"Expected 'Test Document', got {data['document_title']}"
    print("✅ Send document via email working")
    
    # 15. Test getting user documents
    print("\n15. Testing get documents...")
    response = requests.get(f"{base_url}/documents", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
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
    print("✅ Get documents working")
    
    # 16. Test getting a specific document
    print("\n16. Testing get specific document...")
    response = requests.get(f"{base_url}/documents/{test_document_id}", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify document data
    assert data["id"] == test_document_id, f"Expected {test_document_id}, got {data['id']}"
    assert data["title"] == "Test Document", f"Expected 'Test Document', got {data['title']}"
    print("✅ Get specific document working")
    
    # 17. Test updating a document
    print("\n17. Testing update document...")
    update_data = {
        "title": "Updated Test Document",
        "tags": ["test", "api", "updated"]
    }
    
    response = requests.put(f"{base_url}/documents/{test_document_id}", json=update_data, headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify updated document data
    assert data["id"] == test_document_id, f"Expected {test_document_id}, got {data['id']}"
    assert data["title"] == "Updated Test Document", f"Expected 'Updated Test Document', got {data['title']}"
    assert data["tags"] == ["test", "api", "updated"], f"Expected ['test', 'api', 'updated'], got {data['tags']}"
    print("✅ Update document working")
    
    # 18. Test adding a comment to a document
    print("\n18. Testing add comment...")
    comment_data = {
        "content": "This is a test comment."
    }
    
    response = requests.post(f"{base_url}/documents/{test_document_id}/comments", json=comment_data, headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify comment data
    assert data["content"] == "This is a test comment.", f"Expected 'This is a test comment.', got {data['content']}"
    assert "id" in data, "Missing id in response"
    print("✅ Add comment working")
    
    # 19. Test getting comments for a document
    print("\n19. Testing get comments...")
    response = requests.get(f"{base_url}/documents/{test_document_id}/comments", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify comments list
    assert isinstance(data, list), f"Expected list, got {type(data)}"
    assert len(data) >= 1, f"Expected at least 1 comment, got {len(data)}"
    
    # Check if our test comment is in the list
    comment_found = False
    for comment in data:
        if comment["content"] == "This is a test comment.":
            comment_found = True
            break
    
    assert comment_found, "Test comment not found in comments list"
    print("✅ Get comments working")
    
    # 20. Test tracking a document view
    print("\n20. Testing track document view...")
    view_data = {
        "document_id": test_document_id,
        "viewer_info": {
            "ip_address": "192.168.1.1",
            "user_agent": "Test User Agent"
        },
        "pages_viewed": [],
        "total_time_spent": 60,
        "completed_viewing": True
    }
    
    response = requests.post(f"{base_url}/tracking/view", json=view_data)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify response
    assert data["message"] == "View tracked successfully", f"Expected 'View tracked successfully', got {data['message']}"
    print("✅ Track document view working")
    
    # 21. Test getting document analytics
    print("\n21. Testing get document analytics...")
    response = requests.get(f"{base_url}/documents/{test_document_id}/analytics", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify analytics data structure
    assert "views" in data, "Missing views in response"
    assert "unique_viewers" in data, "Missing unique_viewers in response"
    assert "avg_time" in data, "Missing avg_time in response"
    print("✅ Get document analytics working")
    
    # 22. Test AI-powered RFP generation
    print("\n22. Testing AI RFP generation...")
    rfp_data = {
        "project_type": "Website Development",
        "industry": "technology",
        "budget_range": "50k-100k",
        "timeline": "6 months",
        "requirements": "Build a modern e-commerce website with user authentication, product catalog, shopping cart, and payment processing",
        "company_info": "TechCorp is a growing startup in the technology sector",
        "specific_deliverables": ["Frontend website", "Backend API", "Admin dashboard", "Mobile responsive design"],
        "evaluation_criteria": ["Technical expertise", "Portfolio quality", "Timeline adherence", "Cost effectiveness"],
        "additional_context": "This is a high-priority project for our company's growth strategy"
    }
    
    response = requests.post(f"{base_url}/ai/generate-rfp", json=rfp_data, headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify RFP generation response
    assert "sections" in data, "Missing sections in response"
    assert "message" in data, "Missing message in response"
    assert data["message"] == "RFP content generated successfully", f"Expected 'RFP content generated successfully', got {data['message']}"
    assert len(data["sections"]) >= 1, f"Expected at least 1 section, got {len(data['sections'])}"
    
    # Print section titles to verify content
    print("\nGenerated RFP Sections:")
    for section in data["sections"]:
        print(f"- {section['title']}")
    
    print("✅ AI RFP generation working")
    
    # 23. Test document performance analysis
    print("\n23. Testing document performance analysis...")
    response = requests.post(f"{base_url}/ai/analyze-document/{test_document_id}", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify analysis response
    assert "recommendations" in data, "Missing recommendations in response"
    assert "performance_data" in data, "Missing performance_data in response"
    print("✅ Document performance analysis working")
    
    # 24. Test document deletion
    print("\n24. Testing document deletion...")
    response = requests.delete(f"{base_url}/documents/{test_document_id}", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Verify deletion response
    assert data["message"] == "Document deleted successfully", f"Expected 'Document deleted successfully', got {data['message']}"
    
    # Verify document is actually deleted
    response = requests.get(f"{base_url}/documents/{test_document_id}", headers=headers)
    assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    print("✅ Document deletion working")
    
    print("\n✅ All tests passed successfully!")

if __name__ == "__main__":
    test_backend_api()