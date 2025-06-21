import requests
import json
import unittest
import uuid
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://17ed463c-9548-4e22-8aff-b664035c3bd4.preview.emergentagent.com/api"

class DocumentPlatformAPITest(unittest.TestCase):
    def setUp(self):
        self.base_url = BACKEND_URL
        self.headers = {"Content-Type": "application/json"}
        self.access_token = None
        self.test_user_email = f"test.user.{uuid.uuid4()}@example.com"
        self.test_user_password = "SecurePassword123!"
        self.test_document_id = None
        
    def test_01_health_check(self):
        """Test the health check endpoint"""
        response = requests.get(f"{self.base_url}/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("timestamp", data)
        
    def test_02_root_endpoint(self):
        """Test the root endpoint"""
        response = requests.get(f"{self.base_url}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["message"], "Document Platform API")
        self.assertEqual(data["version"], "1.0.0")
        
    def test_03_user_registration(self):
        """Test user registration"""
        user_data = {
            "email": self.test_user_email,
            "full_name": "Test User",
            "role": "editor",
            "organization": "Test Organization",
            "password": self.test_user_password
        }
        
        response = requests.post(f"{self.base_url}/auth/register", json=user_data)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify response structure
        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")
        self.assertIn("user", data)
        self.assertEqual(data["user"]["email"], self.test_user_email)
        self.assertEqual(data["user"]["full_name"], "Test User")
        
        # Save token for subsequent tests
        self.access_token = data["access_token"]
        self.headers["Authorization"] = f"Bearer {self.access_token}"
        
    def test_04_user_login(self):
        """Test user login"""
        login_data = {
            "email": self.test_user_email,
            "password": self.test_user_password
        }
        
        response = requests.post(f"{self.base_url}/auth/login", params=login_data)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify response structure
        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")
        self.assertIn("user", data)
        self.assertEqual(data["user"]["email"], self.test_user_email)
        
        # Update token for subsequent tests
        self.access_token = data["access_token"]
        self.headers["Authorization"] = f"Bearer {self.access_token}"
        
    def test_05_get_current_user(self):
        """Test getting current user profile"""
        response = requests.get(f"{self.base_url}/users/me", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify user data
        self.assertEqual(data["email"], self.test_user_email)
        self.assertEqual(data["full_name"], "Test User")
        self.assertEqual(data["organization"], "Test Organization")
        
    def test_06_create_document(self):
        """Test document creation"""
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
        
        response = requests.post(f"{self.base_url}/documents", json=document_data, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify document data
        self.assertEqual(data["title"], "Test Document")
        self.assertEqual(data["type"], "rfp")
        self.assertEqual(len(data["sections"]), 2)
        self.assertEqual(data["tags"], ["test", "api"])
        
        # Save document ID for subsequent tests
        self.test_document_id = data["id"]
        
    def test_07_get_documents(self):
        """Test getting user documents"""
        response = requests.get(f"{self.base_url}/documents", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify documents list
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)
        
        # Check if our test document is in the list
        document_found = False
        for doc in data:
            if doc["id"] == self.test_document_id:
                document_found = True
                break
                
        self.assertTrue(document_found, "Test document not found in documents list")
        
    def test_08_get_specific_document(self):
        """Test getting a specific document"""
        response = requests.get(f"{self.base_url}/documents/{self.test_document_id}", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify document data
        self.assertEqual(data["id"], self.test_document_id)
        self.assertEqual(data["title"], "Test Document")
        self.assertEqual(data["type"], "rfp")
        
    def test_09_update_document(self):
        """Test updating a document"""
        update_data = {
            "title": "Updated Test Document",
            "tags": ["test", "api", "updated"]
        }
        
        response = requests.put(f"{self.base_url}/documents/{self.test_document_id}", json=update_data, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify updated document data
        self.assertEqual(data["id"], self.test_document_id)
        self.assertEqual(data["title"], "Updated Test Document")
        self.assertEqual(data["tags"], ["test", "api", "updated"])
        
    def test_10_add_comment(self):
        """Test adding a comment to a document"""
        comment_data = {
            "content": "This is a test comment."
        }
        
        response = requests.post(f"{self.base_url}/documents/{self.test_document_id}/comments", json=comment_data, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify comment data
        self.assertEqual(data["content"], "This is a test comment.")
        self.assertIn("id", data)
        self.assertIn("timestamp", data)
        
    def test_11_get_comments(self):
        """Test getting comments for a document"""
        response = requests.get(f"{self.base_url}/documents/{self.test_document_id}/comments", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify comments list
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)
        
        # Check if our test comment is in the list
        comment_found = False
        for comment in data:
            if comment["content"] == "This is a test comment.":
                comment_found = True
                break
                
        self.assertTrue(comment_found, "Test comment not found in comments list")
        
    def test_12_track_document_view(self):
        """Test tracking a document view"""
        view_data = {
            "document_id": self.test_document_id,
            "viewer_info": {
                "ip_address": "192.168.1.1",
                "user_agent": "Test User Agent",
                "user_id": "test_user_id",
                "user_name": "Test User"
            },
            "pages_viewed": [
                {
                    "page_number": 1,
                    "time_spent": 60,
                    "scroll_depth": 100.0
                }
            ],
            "total_time_spent": 60,
            "completed_viewing": True
        }
        
        response = requests.post(f"{self.base_url}/tracking/view", json=view_data)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify response
        self.assertEqual(data["message"], "View tracked successfully")
        
    def test_13_get_document_analytics(self):
        """Test getting document analytics"""
        response = requests.get(f"{self.base_url}/documents/{self.test_document_id}/analytics", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify analytics data structure
        self.assertIn("views", data)
        self.assertIn("unique_viewers", data)
        self.assertIn("avg_time", data)
        self.assertIn("completion_rate", data)
        self.assertIn("download_rate", data)
        self.assertIn("sign_rate", data)
        self.assertIn("engagement", data)
        
    def test_14_generate_rfp(self):
        """Test AI-powered RFP generation"""
        rfp_data = {
            "project_type": "Software Development",
            "industry": "Healthcare",
            "budget_range": "$100,000 - $200,000",
            "timeline": "6 months",
            "requirements": "We need a secure patient portal with appointment scheduling and telemedicine capabilities.",
            "company_info": "HealthTech Inc. is a leading healthcare technology provider.",
            "specific_deliverables": [
                "Patient portal",
                "Appointment scheduling system",
                "Telemedicine integration"
            ],
            "evaluation_criteria": [
                "Technical expertise",
                "Previous healthcare experience",
                "Cost effectiveness"
            ],
            "additional_context": "This project is part of our digital transformation initiative."
        }
        
        response = requests.post(f"{self.base_url}/ai/generate-rfp", json=rfp_data, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify RFP generation response
        self.assertIn("sections", data)
        self.assertIn("message", data)
        self.assertEqual(data["message"], "RFP content generated successfully")
        self.assertGreaterEqual(len(data["sections"]), 1)
        
    def test_15_analyze_document(self):
        """Test document performance analysis"""
        response = requests.post(f"{self.base_url}/ai/analyze-document/{self.test_document_id}", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify analysis response
        self.assertIn("recommendations", data)
        self.assertIn("performance_data", data)
        
    def test_16_delete_document(self):
        """Test document deletion"""
        response = requests.delete(f"{self.base_url}/documents/{self.test_document_id}", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify deletion response
        self.assertEqual(data["message"], "Document deleted successfully")
        
        # Verify document is actually deleted
        response = requests.get(f"{self.base_url}/documents/{self.test_document_id}", headers=self.headers)
        self.assertEqual(response.status_code, 404)

if __name__ == "__main__":
    # Run tests in order
    unittest.main(argv=['first-arg-is-ignored'], exit=False)