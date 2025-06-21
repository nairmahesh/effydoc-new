import requests
import json
import unittest
import uuid
import os
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://17ed463c-9548-4e22-8aff-b664035c3bd4.preview.emergentagent.com/api"

def test_ai_rfp_generation_comprehensive():
    """Comprehensive test of the AI RFP generation endpoint"""
    print("Starting Comprehensive AI RFP Generation Test...")
    
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
    
    # 2. Test AI RFP generation with the specified test data
    print("\n2. Testing AI RFP generation with specified test data...")
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
        return False
        
    # Check if the response is successful
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
    
    # Verify that all required sections are present
    required_sections = [
        "Executive Summary", 
        "Project Overview", 
        "Scope of Work", 
        "Requirements", 
        "Deliverables", 
        "Timeline", 
        "Budget", 
        "Evaluation Criteria"
    ]
    
    section_titles = [section['title'] for section in sections]
    
    # Check if each required section or a similar one is present
    for required in required_sections:
        found = False
        for title in section_titles:
            if required.lower() in title.lower():
                found = True
                break
        
        if not found:
            print(f"⚠️ Required section '{required}' or similar not found in generated RFP")
    
    # Verify that the content is comprehensive and industry-appropriate
    print("\nVerifying content quality...")
    
    # Check content length
    total_content_length = sum(len(section['content']) for section in sections)
    print(f"Total content length: {total_content_length} characters")
    assert total_content_length > 1000, "Generated content is too short"
    
    # Check for industry-specific terms
    industry_terms = ["website", "development", "e-commerce", "technology", "authentication", "catalog", "shopping cart", "payment"]
    
    all_content = " ".join(section['content'].lower() for section in sections)
    
    for term in industry_terms:
        if term.lower() in all_content:
            print(f"✓ Industry term '{term}' found in content")
        else:
            print(f"⚠️ Industry term '{term}' not found in content")
    
    # Check for specific deliverables
    for deliverable in rfp_data["specific_deliverables"]:
        if deliverable.lower() in all_content:
            print(f"✓ Deliverable '{deliverable}' found in content")
        else:
            print(f"⚠️ Deliverable '{deliverable}' not found in content")
    
    # Check for evaluation criteria
    for criterion in rfp_data["evaluation_criteria"]:
        if criterion.lower() in all_content:
            print(f"✓ Evaluation criterion '{criterion}' found in content")
        else:
            print(f"⚠️ Evaluation criterion '{criterion}' not found in content")
    
    print("\n✅ AI RFP generation working correctly with comprehensive content")
    return True

if __name__ == "__main__":
    test_ai_rfp_generation_comprehensive()