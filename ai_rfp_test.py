import requests
import json
import unittest
import uuid
import os
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://4aa54517-8e64-4037-8338-35ac94bb76b8.preview.emergentagent.com/api"

class TestAIRFPGeneration(unittest.TestCase):
    """Test the AI RFP generation endpoint"""
    
    def setUp(self):
        """Set up test environment"""
        self.base_url = BACKEND_URL
        self.headers = {"Content-Type": "application/json"}
        
        # Create a test user for authentication
        self.test_user_email = f"test.user.{uuid.uuid4()}@example.com"
        self.test_user_password = "SecurePassword123!"
        
        # Register test user
        user_data = {
            "email": self.test_user_email,
            "full_name": "Test User",
            "role": "editor",
            "organization": "Test Organization",
            "password": self.test_user_password
        }
        
        response = requests.post(f"{self.base_url}/auth/register", json=user_data)
        self.assertEqual(response.status_code, 200, f"User registration failed: {response.text}")
        data = response.json()
        
        # Save token for authentication
        self.access_token = data["access_token"]
        self.headers["Authorization"] = f"Bearer {self.access_token}"
    
    def test_1_rfp_generation_with_valid_data(self):
        """Test RFP generation with valid data"""
        print("\nTesting AI RFP generation with valid data...")
        
        # Test data from the review request
        rfp_data = {
            "project_type": "Website Development",
            "industry": "technology",
            "budget_range": "50k-100k",
            "timeline": "3 months",
            "requirements": "Need to build a modern e-commerce website with payment integration, user authentication, and admin dashboard",
            "company_info": "TechCorp is a growing technology company specializing in software solutions",
            "specific_deliverables": ["Responsive website", "Payment integration", "Admin dashboard"],
            "evaluation_criteria": ["Technical expertise", "Portfolio quality", "Timeline adherence"],
            "additional_context": "Looking for a long-term development partner"
        }
        
        response = requests.post(f"{self.base_url}/ai/generate-rfp", json=rfp_data, headers=self.headers)
        
        # Print response for debugging
        print(f"Response status code: {response.status_code}")
        if response.status_code != 200:
            print(f"Error response: {response.text}")
        
        # Assert response status code
        self.assertEqual(response.status_code, 200, f"RFP generation failed: {response.text}")
        
        # Parse response data
        data = response.json()
        
        # Verify response structure
        self.assertIn("sections", data, "Missing 'sections' in response")
        self.assertIn("message", data, "Missing 'message' in response")
        self.assertEqual(data["message"], "RFP content generated successfully", "Unexpected message in response")
        
        # Verify sections content
        sections = data["sections"]
        self.assertGreater(len(sections), 0, "No sections generated")
        
        # Print section titles for verification
        print("\nGenerated RFP Sections:")
        for section in sections:
            print(f"- {section['title']}")
            self.assertIn("title", section, "Section missing title")
            self.assertIn("content", section, "Section missing content")
            self.assertIn("order", section, "Section missing order")
            self.assertGreater(len(section["content"]), 0, "Section content is empty")
        
        # Verify content relevance
        all_content = " ".join([section["content"] for section in sections]).lower()
        
        # Check for key terms from the request
        key_terms = [
            "website", 
            "e-commerce", 
            "payment", 
            "authentication", 
            "dashboard",
            "responsive"
        ]
        
        found_terms = []
        missing_terms = []
        for term in key_terms:
            if term.lower() in all_content:
                found_terms.append(term)
            else:
                missing_terms.append(term)
        
        print(f"Found terms: {found_terms}")
        if missing_terms:
            print(f"Missing terms: {missing_terms}")
        
        # We should find at least 4 out of 6 key terms
        self.assertGreaterEqual(len(found_terms), 4, f"Generated content missing too many key terms: {missing_terms}")
        
        print("✅ AI RFP generation with valid data working correctly")
    
    def test_2_rfp_generation_without_authentication(self):
        """Test RFP generation without authentication"""
        print("\nTesting AI RFP generation without authentication...")
        
        # Test data
        rfp_data = {
            "project_type": "Website Development",
            "industry": "technology",
            "budget_range": "50k-100k",
            "timeline": "3 months",
            "requirements": "Need to build a modern e-commerce website",
            "company_info": "TechCorp is a growing technology company",
            "specific_deliverables": ["Responsive website"],
            "evaluation_criteria": ["Technical expertise"]
        }
        
        # Send request without authentication header
        response = requests.post(
            f"{self.base_url}/ai/generate-rfp", 
            json=rfp_data, 
            headers={"Content-Type": "application/json"}
        )
        
        # Assert response status code
        self.assertIn(response.status_code, [401, 403], f"Expected 401 or 403 Unauthorized/Forbidden, got {response.status_code}")
        print("✅ Authentication check working correctly")
    
    def test_3_rfp_generation_with_missing_fields(self):
        """Test RFP generation with missing required fields"""
        print("\nTesting AI RFP generation with missing fields...")
        
        # Test data with missing required fields
        rfp_data = {
            "project_type": "Website Development",
            # Missing industry
            "budget_range": "50k-100k",
            "timeline": "3 months",
            # Missing requirements
            "company_info": "TechCorp is a growing technology company",
            "specific_deliverables": ["Responsive website"],
            "evaluation_criteria": ["Technical expertise"]
        }
        
        response = requests.post(f"{self.base_url}/ai/generate-rfp", json=rfp_data, headers=self.headers)
        
        # Assert response status code
        self.assertNotEqual(response.status_code, 200, f"Expected validation error, got {response.status_code}")
        print(f"Response status code: {response.status_code}")
        print(f"Response: {response.text}")
        print("✅ Validation check working correctly")
    
    def test_4_rfp_generation_with_invalid_data_types(self):
        """Test RFP generation with invalid data types"""
        print("\nTesting AI RFP generation with invalid data types...")
        
        # Test data with invalid data types
        rfp_data = {
            "project_type": "Website Development",
            "industry": "technology",
            "budget_range": "50k-100k",
            "timeline": "3 months",
            "requirements": "Need to build a modern e-commerce website",
            "company_info": "TechCorp is a growing technology company",
            "specific_deliverables": "This should be a list, not a string",  # Invalid type
            "evaluation_criteria": ["Technical expertise"]
        }
        
        response = requests.post(f"{self.base_url}/ai/generate-rfp", json=rfp_data, headers=self.headers)
        
        # Assert response status code
        self.assertNotEqual(response.status_code, 200, f"Expected validation error, got {response.status_code}")
        print(f"Response status code: {response.status_code}")
        print(f"Response: {response.text}")
        print("✅ Data type validation check working correctly")

if __name__ == "__main__":
    unittest.main()