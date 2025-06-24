import requests
import json
import unittest
import uuid
import os
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://7056c40d-c306-42f0-bfc6-379013315fc8.preview.emergentagent.com/api"

def test_ai_rfp_generation():
    """Test the AI RFP generation endpoint"""
    print("Starting AI RFP Generation Test...")
    
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
        "organization": "TechCorp",
        "password": test_user_password
    }
    
    response = requests.post(f"{base_url}/auth/register", json=user_data)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # Save token for subsequent tests
    access_token = data["access_token"]
    headers["Authorization"] = f"Bearer {access_token}"
    print(f"✅ User registered successfully: {test_user_email}")
    
    # 2. Test AI RFP generation
    print("\n2. Testing AI RFP generation...")
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
    
    # Print detailed response for debugging
    print(f"Response status code: {response.status_code}")
    
    if response.status_code != 200:
        print(f"Error response: {response.text}")
        
    # Check if the response is successful
    if response.status_code == 200:
        data = response.json()
        
        # Verify RFP generation response structure
        assert "sections" in data, "Missing sections in response"
        assert "message" in data, "Missing message in response"
        assert data["message"] == "RFP content generated successfully", f"Expected 'RFP content generated successfully', got {data['message']}"
        
        # Verify sections content
        sections = data["sections"]
        assert len(sections) >= 1, f"Expected at least 1 section, got {len(sections)}"
        
        # Print section titles to verify content
        print("\nGenerated RFP Sections:")
        for section in sections:
            print(f"- {section['title']}")
            
        print("\n✅ AI RFP generation working correctly")
        return True
    else:
        print("\n❌ AI RFP generation failed")
        return False

if __name__ == "__main__":
    test_ai_rfp_generation()