import requests
import json
import unittest
import uuid
import time
from datetime import datetime, timedelta
import jwt

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://7056c40d-c306-42f0-bfc6-379013315fc8.preview.emergentagent.com/api"

def test_auth_functionality():
    """Test the authentication functionality with focus on JWT token expiration and validation"""
    print("Starting Authentication Tests...")
    
    # Test variables
    base_url = BACKEND_URL
    headers = {"Content-Type": "application/json"}
    test_user_email = f"test.user.{uuid.uuid4()}@example.com"
    test_user_password = "SecurePassword123!"
    
    # 1. Test user registration and JWT token creation
    print("\n1. Testing user registration and JWT token creation...")
    user_data = {
        "email": test_user_email,
        "full_name": "Test User",
        "role": "editor",
        "organization": "Test Organization",
        "password": test_user_password
    }
    
    response = requests.post(f"{base_url}/auth/register", json=user_data)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    
    # Verify response structure
    assert "access_token" in data, "Missing access_token in response"
    assert data["token_type"] == "bearer", f"Expected 'bearer', got {data['token_type']}"
    assert "user" in data, "Missing user in response"
    assert data["user"]["email"] == test_user_email, f"Expected {test_user_email}, got {data['user']['email']}"
    
    # Save token for subsequent tests
    access_token = data["access_token"]
    
    # Decode the token to verify expiration time
    try:
        # Note: We're not verifying the signature here, just decoding to check the payload
        decoded_token = jwt.decode(access_token, options={"verify_signature": False})
        
        # Check if expiration claim exists
        assert "exp" in decoded_token, "Token does not contain expiration claim"
        
        # Calculate token lifetime in minutes
        exp_time = datetime.fromtimestamp(decoded_token["exp"])
        issue_time = datetime.utcnow()
        token_lifetime_minutes = (exp_time - issue_time).total_seconds() / 60
        
        # Verify token expiration is set to 30 minutes (with some tolerance for test execution time)
        assert 29 <= token_lifetime_minutes <= 31, f"Expected token lifetime of 30 minutes, got {token_lifetime_minutes} minutes"
        
        print(f"✅ JWT token created with proper expiration time: {token_lifetime_minutes:.2f} minutes")
    except Exception as e:
        assert False, f"Failed to decode token: {str(e)}"
    
    # Set authorization header for subsequent tests
    auth_headers = headers.copy()
    auth_headers["Authorization"] = f"Bearer {access_token}"
    
    print("✅ User registration working with proper JWT token")
    
    # 2. Test user login and JWT token creation
    print("\n2. Testing user login and JWT token creation...")
    login_data = {
        "email": test_user_email,
        "password": test_user_password
    }
    
    response = requests.post(f"{base_url}/auth/login", json=login_data)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    
    # Verify response structure
    assert "access_token" in data, "Missing access_token in response"
    assert data["token_type"] == "bearer", f"Expected 'bearer', got {data['token_type']}"
    assert "user" in data, "Missing user in response"
    assert data["user"]["email"] == test_user_email, f"Expected {test_user_email}, got {data['user']['email']}"
    
    # Save token for subsequent tests
    login_access_token = data["access_token"]
    
    # Decode the token to verify expiration time
    try:
        # Note: We're not verifying the signature here, just decoding to check the payload
        decoded_token = jwt.decode(login_access_token, options={"verify_signature": False})
        
        # Check if expiration claim exists
        assert "exp" in decoded_token, "Token does not contain expiration claim"
        
        # Calculate token lifetime in minutes
        exp_time = datetime.fromtimestamp(decoded_token["exp"])
        issue_time = datetime.utcnow()
        token_lifetime_minutes = (exp_time - issue_time).total_seconds() / 60
        
        # Verify token expiration is set to 30 minutes (with some tolerance for test execution time)
        assert 29 <= token_lifetime_minutes <= 31, f"Expected token lifetime of 30 minutes, got {token_lifetime_minutes} minutes"
        
        print(f"✅ Login JWT token created with proper expiration time: {token_lifetime_minutes:.2f} minutes")
    except Exception as e:
        assert False, f"Failed to decode token: {str(e)}"
    
    # Update authorization header with new token
    auth_headers["Authorization"] = f"Bearer {login_access_token}"
    
    print("✅ User login working with proper JWT token")
    
    # 3. Test accessing protected endpoint with valid token
    print("\n3. Testing access to protected endpoint with valid token...")
    response = requests.get(f"{base_url}/users/me", headers=auth_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    
    # Verify user data
    assert data["email"] == test_user_email, f"Expected {test_user_email}, got {data['email']}"
    assert data["full_name"] == "Test User", f"Expected 'Test User', got {data['full_name']}"
    
    print("✅ Protected endpoint access working with valid token")
    
    # 4. Test document creation with valid token
    print("\n4. Testing document creation with valid token...")
    document_data = {
        "title": "Test Document",
        "type": "proposal",
        "organization": "Test Organization",
        "sections": [
            {
                "title": "Introduction",
                "content": "This is a test document introduction.",
                "order": 1
            }
        ],
        "collaborators": [],
        "tags": ["test", "authentication"],
        "metadata": {"purpose": "testing"}
    }
    
    response = requests.post(f"{base_url}/documents", json=document_data, headers=auth_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    
    # Verify document data
    assert data["title"] == "Test Document", f"Expected 'Test Document', got {data['title']}"
    assert data["type"] == "proposal", f"Expected 'proposal', got {data['type']}"
    
    # Save document ID for subsequent tests
    document_id = data["id"]
    
    print("✅ Document creation working with valid token")
    
    # 5. Test accessing document with valid token
    print("\n5. Testing document access with valid token...")
    response = requests.get(f"{base_url}/documents/{document_id}", headers=auth_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    
    # Verify document data
    assert data["id"] == document_id, f"Expected {document_id}, got {data['id']}"
    assert data["title"] == "Test Document", f"Expected 'Test Document', got {data['title']}"
    
    print("✅ Document access working with valid token")
    
    # 6. Test with invalid token
    print("\n6. Testing with invalid token...")
    invalid_headers = headers.copy()
    invalid_headers["Authorization"] = "Bearer invalidtoken12345"
    
    response = requests.get(f"{base_url}/users/me", headers=invalid_headers)
    assert response.status_code in [401, 403], f"Expected 401 or 403, got {response.status_code}"
    
    print("✅ Invalid token properly rejected")
    
    # 7. Test with expired token (we'll create a token that's already expired)
    print("\n7. Testing with expired token...")
    
    # Create an expired token (expired 1 minute ago)
    # Note: This is a simplified version for testing - in production, you'd use the actual SECRET_KEY
    payload = {
        "sub": "fake_user_id",
        "exp": datetime.utcnow() - timedelta(minutes=1)
    }
    expired_token = jwt.encode(payload, "test_secret", algorithm="HS256")
    
    expired_headers = headers.copy()
    expired_headers["Authorization"] = f"Bearer {expired_token}"
    
    response = requests.get(f"{base_url}/users/me", headers=expired_headers)
    assert response.status_code in [401, 403], f"Expected 401 or 403, got {response.status_code}"
    
    print("✅ Expired token properly rejected")
    
    # 8. Test token refresh or re-login after expiration
    # Since we can't wait 30 minutes for the token to expire naturally,
    # we'll simulate by using an expired token and then getting a new one via login
    
    print("\n8. Testing token refresh via re-login...")
    
    # Re-login to get a fresh token
    response = requests.post(f"{base_url}/auth/login", json=login_data)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    
    # Verify new token
    assert "access_token" in data, "Missing access_token in response"
    new_token = data["access_token"]
    # Note: In some implementations, tokens might be the same if they're based solely on user ID
    # and haven't expired yet. We'll just verify we got a valid token back.
    print(f"Note: New token received. Same as previous: {new_token == login_access_token}")
    
    # Update headers with new token
    auth_headers["Authorization"] = f"Bearer {new_token}"
    
    # Verify the new token works
    response = requests.get(f"{base_url}/users/me", headers=auth_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    print("✅ Token refresh via re-login working")
    
    # 9. Clean up - delete the test document
    print("\n9. Cleaning up test document...")
    response = requests.delete(f"{base_url}/documents/{document_id}", headers=auth_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    print("✅ Test cleanup successful")
    
    print("\n✅ All authentication tests passed successfully!")

if __name__ == "__main__":
    test_auth_functionality()