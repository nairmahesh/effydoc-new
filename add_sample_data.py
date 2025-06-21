#!/usr/bin/env python3
import requests
import json

API_BASE = "https://04412e36-5d36-4cbc-a0ad-d80236a0eaaf.preview.emergentagent.com/api"

def add_sample_recognition():
    """Add sample recognition data to test 360-degree view"""
    
    # Login as manager
    login_response = requests.post(f"{API_BASE}/auth/login", json={
        "email": "manager@company.com",
        "password": "password"
    })
    
    if login_response.status_code == 200:
        auth_data = login_response.json()
        token = auth_data["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        print("✅ Manager login successful")
        
        # Get team members
        team_response = requests.get(f"{API_BASE}/users/team", headers=headers)
        if team_response.status_code == 200:
            team_members = team_response.json()
            
            # Sample recognition data
            recognitions = [
                {"reason": "Excellent work on the quarterly report", "points": 25},
                {"reason": "Great teamwork during the product launch", "points": 30},
                {"reason": "Outstanding customer service", "points": 20},
                {"reason": "Innovation in process improvement", "points": 35},
                {"reason": "Mentoring new team members", "points": 15},
                {"reason": "Meeting project deadline ahead of schedule", "points": 40},
                {"reason": "Creative problem solving", "points": 25},
                {"reason": "Going above and beyond expectations", "points": 30}
            ]
            
            # Give points to each employee
            for member in team_members:
                print(f"\nGiving recognition to {member['name']}:")
                
                # Give multiple recognitions to create history
                for i, recognition in enumerate(recognitions):
                    if i < 3:  # Give 3 recognitions per employee
                        points_data = {
                            "to_user_id": member["id"],
                            "amount": recognition["points"],
                            "reason": recognition["reason"]
                        }
                        
                        points_response = requests.post(f"{API_BASE}/points/give", 
                                                      json=points_data, headers=headers)
                        
                        if points_response.status_code == 200:
                            print(f"  ✅ {recognition['points']} points - {recognition['reason']}")
                        else:
                            print(f"  ❌ Failed to give points: {points_response.text}")
            
            print("\n🎉 Sample recognition data added!")
            print("You can now click on employee names to see their 360-degree profiles!")
            
        else:
            print(f"❌ Failed to get team members: {team_response.text}")
    else:
        print(f"❌ Failed to login as manager: {login_response.text}")

if __name__ == "__main__":
    add_sample_recognition()