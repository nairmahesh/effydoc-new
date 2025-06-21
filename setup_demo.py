#!/usr/bin/env python3
import asyncio
import requests
import json

API_BASE = "https://04412e36-5d36-4cbc-a0ad-d80236a0eaaf.preview.emergentagent.com/api"

async def setup_demo_data():
    """Setup demo data for testing"""
    
    # Create a demo company with admin
    company_data = {
        "name": "Demo Company Inc",
        "point_name": "DemoPoints",
        "admin_email": "admin@company.com",
        "admin_name": "Admin User",
        "admin_password": "password"
    }
    
    print("Creating demo company...")
    response = requests.post(f"{API_BASE}/companies", json=company_data)
    if response.status_code == 200:
        company = response.json()
        print(f"✅ Created company: {company['name']}")
        
        # Login as admin to get token
        login_response = requests.post(f"{API_BASE}/auth/login", json={
            "email": "admin@company.com",
            "password": "password"
        })
        
        if login_response.status_code == 200:
            auth_data = login_response.json()
            token = auth_data["token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            print("✅ Admin login successful")
            
            # Create a manager
            manager_data = {
                "email": "manager@company.com",
                "name": "Manager Smith",
                "password": "password",
                "role": "manager",
                "company_id": company["id"],
                "department": "Engineering"
            }
            
            manager_response = requests.post(f"{API_BASE}/auth/register", json=manager_data)
            if manager_response.status_code == 200:
                manager = manager_response.json()["user"]
                print(f"✅ Created manager: {manager['name']}")
                
                # Create employees under the manager
                employees = [
                    {"name": "John Doe", "email": "john@company.com", "department": "Engineering"},
                    {"name": "Jane Smith", "email": "jane@company.com", "department": "Marketing"},
                    {"name": "Bob Johnson", "email": "bob@company.com", "department": "Sales"}
                ]
                
                for emp in employees:
                    emp_data = {
                        "email": emp["email"],
                        "name": emp["name"],
                        "password": "password",
                        "role": "employee",
                        "company_id": company["id"],
                        "manager_id": manager["id"],
                        "department": emp["department"]
                    }
                    
                    emp_response = requests.post(f"{API_BASE}/auth/register", json=emp_data)
                    if emp_response.status_code == 200:
                        print(f"✅ Created employee: {emp['name']}")
            
            print("\n🎉 Demo setup complete!")
            print("\nLogin credentials:")
            print("👤 Admin: admin@company.com / password")
            print("👤 Manager: manager@company.com / password") 
            print("👤 Employee: john@company.com / password")
            print("👤 Employee: jane@company.com / password")
            print("👤 Employee: bob@company.com / password")
            
        else:
            print(f"❌ Failed to login as admin: {login_response.text}")
            
    else:
        print(f"❌ Failed to create company: {response.text}")

if __name__ == "__main__":
    asyncio.run(setup_demo_data())