import requests
import json
import time
from typing import Dict, Any, List, Optional

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://04412e36-5d36-4cbc-a0ad-d80236a0eaaf.preview.emergentagent.com/api"

# Test results
test_results = {
    "passed": 0,
    "failed": 0,
    "tests": []
}

def log_test(name: str, passed: bool, details: str = ""):
    """Log test results"""
    result = "PASS" if passed else "FAIL"
    print(f"{result}: {name}")
    if details:
        print(f"  Details: {details}")
    
    test_results["tests"].append({
        "name": name,
        "passed": passed,
        "details": details
    })
    
    if passed:
        test_results["passed"] += 1
    else:
        test_results["failed"] += 1

def print_summary():
    """Print test summary"""
    total = test_results["passed"] + test_results["failed"]
    print("\n===== TEST SUMMARY =====")
    print(f"Total tests: {total}")
    print(f"Passed: {test_results['passed']}")
    print(f"Failed: {test_results['failed']}")
    print(f"Success rate: {(test_results['passed'] / total) * 100:.2f}%")
    
    if test_results["failed"] > 0:
        print("\nFailed tests:")
        for test in test_results["tests"]:
            if not test["passed"]:
                print(f"- {test['name']}: {test['details']}")

class APIClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.token = None
        self.user = None
    
    def register(self, email: str, name: str, password: str, role: str, 
                company_id: Optional[str] = None, manager_id: Optional[str] = None) -> Dict[str, Any]:
        """Register a new user"""
        data = {
            "email": email,
            "name": name,
            "password": password,
            "role": role
        }
        
        if company_id:
            data["company_id"] = company_id
        
        if manager_id:
            data["manager_id"] = manager_id
        
        response = requests.post(f"{self.base_url}/auth/register", json=data)
        return response.json() if response.status_code == 200 else {"error": response.text, "status_code": response.status_code}
    
    def login(self, email: str, password: str) -> Dict[str, Any]:
        """Login a user"""
        data = {
            "email": email,
            "password": password
        }
        
        response = requests.post(f"{self.base_url}/auth/login", json=data)
        if response.status_code == 200:
            result = response.json()
            self.token = result.get("token")
            self.user = result.get("user")
            return result
        return {"error": response.text, "status_code": response.status_code}
    
    def get_current_user(self) -> Dict[str, Any]:
        """Get current user info"""
        if not self.token:
            return {"error": "Not logged in"}
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{self.base_url}/auth/me", headers=headers)
        return response.json() if response.status_code == 200 else {"error": response.text, "status_code": response.status_code}
    
    def create_company(self, name: str, point_name: str, admin_email: str, admin_name: str, admin_password: str) -> Dict[str, Any]:
        """Create a new company"""
        data = {
            "name": name,
            "point_name": point_name,
            "admin_email": admin_email,
            "admin_name": admin_name,
            "admin_password": admin_password
        }
        
        response = requests.post(f"{self.base_url}/companies", json=data)
        return response.json() if response.status_code == 200 else {"error": response.text, "status_code": response.status_code}
    
    def get_company(self, company_id: str) -> Dict[str, Any]:
        """Get company details"""
        if not self.token:
            return {"error": "Not logged in"}
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{self.base_url}/companies/{company_id}", headers=headers)
        return response.json() if response.status_code == 200 else {"error": response.text, "status_code": response.status_code}
    
    def give_points(self, to_user_id: str, amount: int, reason: str) -> Dict[str, Any]:
        """Give points to a user"""
        if not self.token:
            return {"error": "Not logged in"}
        
        data = {
            "to_user_id": to_user_id,
            "amount": amount,
            "reason": reason
        }
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.post(f"{self.base_url}/points/give", json=data, headers=headers)
        return response.json() if response.status_code == 200 else {"error": response.text, "status_code": response.status_code}
    
    def get_transactions(self) -> Dict[str, Any]:
        """Get point transactions"""
        if not self.token:
            return {"error": "Not logged in"}
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{self.base_url}/points/transactions", headers=headers)
        return response.json() if response.status_code == 200 else {"error": response.text, "status_code": response.status_code}
    
    def get_team_members(self) -> Dict[str, Any]:
        """Get team members"""
        if not self.token:
            return {"error": "Not logged in"}
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{self.base_url}/users/team", headers=headers)
        return response.json() if response.status_code == 200 else {"error": response.text, "status_code": response.status_code}
    
    def get_user_badges(self) -> Dict[str, Any]:
        """Get user badges"""
        if not self.token:
            return {"error": "Not logged in"}
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{self.base_url}/users/badges", headers=headers)
        return response.json() if response.status_code == 200 else {"error": response.text, "status_code": response.status_code}
    
    def get_dashboard_stats(self) -> Dict[str, Any]:
        """Get dashboard statistics"""
        if not self.token:
            return {"error": "Not logged in"}
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{self.base_url}/dashboard/stats", headers=headers)
        return response.json() if response.status_code == 200 else {"error": response.text, "status_code": response.status_code}

def test_authentication():
    """Test authentication system"""
    print("\n===== Testing Authentication System =====")
    
    client = APIClient(BACKEND_URL)
    
    # Test login with valid credentials (admin)
    admin_login = client.login("admin@company.com", "password")
    admin_login_success = "token" in admin_login and "user" in admin_login
    log_test("Admin login", admin_login_success, 
             f"Error: {admin_login.get('error', '')}" if not admin_login_success else "")
    
    if admin_login_success:
        # Test current user endpoint
        current_user = client.get_current_user()
        current_user_success = "id" in current_user and "email" in current_user
        log_test("Get current user", current_user_success, 
                f"Error: {current_user.get('error', '')}" if not current_user_success else "")
    
    # Test login with valid credentials (manager)
    manager_client = APIClient(BACKEND_URL)
    manager_login = manager_client.login("manager@company.com", "password")
    manager_login_success = "token" in manager_login and "user" in manager_login
    log_test("Manager login", manager_login_success, 
             f"Error: {manager_login.get('error', '')}" if not manager_login_success else "")
    
    # Test login with valid credentials (employee)
    employee_client = APIClient(BACKEND_URL)
    employee_login = employee_client.login("john@company.com", "password")
    employee_login_success = "token" in employee_login and "user" in employee_login
    log_test("Employee login", employee_login_success, 
             f"Error: {employee_login.get('error', '')}" if not employee_login_success else "")
    
    # Test login with invalid credentials
    invalid_login = client.login("nonexistent@example.com", "wrongpassword")
    invalid_login_success = "error" in invalid_login and invalid_login.get("status_code") in [401, 400]
    log_test("Invalid login rejection", invalid_login_success, 
             f"Expected error but got: {invalid_login}" if not invalid_login_success else "")
    
    # Test user registration (create a new test company and users)
    company_name = f"Test Company {int(time.time())}"
    company_result = client.create_company(
        name=company_name,
        point_name="TestPoints",
        admin_email=f"admin_{int(time.time())}@testcompany.com",
        admin_name="Test Admin",
        admin_password="password123"
    )
    
    company_created = "id" in company_result and "name" in company_result
    log_test("Company creation", company_created, 
             f"Error: {company_result.get('error', '')}" if not company_created else "")
    
    if company_created:
        company_id = company_result["id"]
        
        # Login as the new company admin
        new_admin_client = APIClient(BACKEND_URL)
        admin_login = new_admin_client.login(f"admin_{int(time.time())}@testcompany.com", "password123")
        
        # Register a manager
        manager_email = f"manager_{int(time.time())}@testcompany.com"
        manager_result = new_admin_client.register(
            email=manager_email,
            name="Test Manager",
            password="password123",
            role="manager",
            company_id=company_id
        )
        
        manager_created = "token" in manager_result and "user" in manager_result
        log_test("Manager registration", manager_created, 
                f"Error: {manager_result.get('error', '')}" if not manager_created else "")
        
        if manager_created:
            manager_id = manager_result["user"]["id"]
            
            # Register an employee
            employee_email = f"employee_{int(time.time())}@testcompany.com"
            employee_result = new_admin_client.register(
                email=employee_email,
                name="Test Employee",
                password="password123",
                role="employee",
                company_id=company_id,
                manager_id=manager_id
            )
            
            employee_created = "token" in employee_result and "user" in employee_result
            log_test("Employee registration", employee_created, 
                    f"Error: {employee_result.get('error', '')}" if not employee_created else "")

def test_company_management():
    """Test company management system"""
    print("\n===== Testing Company Management =====")
    
    client = APIClient(BACKEND_URL)
    
    # Login as admin
    admin_login = client.login("admin@company.com", "password")
    if "token" not in admin_login:
        log_test("Admin login for company test", False, f"Error: {admin_login.get('error', '')}")
        return
    
    # Get company details
    company_id = admin_login["user"]["company_id"]
    company_details = client.get_company(company_id)
    
    company_details_success = "id" in company_details and "name" in company_details
    log_test("Get company details", company_details_success, 
             f"Error: {company_details.get('error', '')}" if not company_details_success else "")
    
    # Create a new test company
    company_name = f"Test Company {int(time.time())}"
    company_result = client.create_company(
        name=company_name,
        point_name="TestPoints",
        admin_email=f"admin_{int(time.time())}@testcompany.com",
        admin_name="Test Admin",
        admin_password="password123"
    )
    
    company_created = "id" in company_result and "name" in company_result
    log_test("Company creation with custom point name", company_created, 
             f"Error: {company_result.get('error', '')}" if not company_created else "")
    
    if company_created:
        # Verify point name was set correctly
        point_name_correct = company_result["point_name"] == "TestPoints"
        log_test("Custom point name", point_name_correct, 
                f"Expected 'TestPoints' but got '{company_result.get('point_name')}'")

def test_point_distribution():
    """Test point distribution system"""
    print("\n===== Testing Point Distribution System =====")
    
    # Login as manager
    manager_client = APIClient(BACKEND_URL)
    manager_login = manager_client.login("manager@company.com", "password")
    
    if "token" not in manager_login:
        log_test("Manager login for point test", False, f"Error: {manager_login.get('error', '')}")
        return
    
    # Get team members
    team_members = manager_client.get_team_members()
    
    if not isinstance(team_members, list):
        log_test("Get team members", False, f"Error: {team_members.get('error', '')}")
        return
    
    if not team_members:
        log_test("Manager has team members", False, "Manager has no team members")
        return
    
    # Get manager's initial point cap
    manager_stats = manager_client.get_dashboard_stats()
    if "point_cap" not in manager_stats:
        log_test("Get manager stats", False, f"Error: {manager_stats.get('error', '')}")
        return
    
    initial_point_cap = manager_stats["point_cap"]
    
    # Give points to a team member
    employee = team_members[0]
    employee_id = employee["id"]
    points_to_give = 10
    
    give_points_result = manager_client.give_points(
        to_user_id=employee_id,
        amount=points_to_give,
        reason="Great work on the project!"
    )
    
    points_given = "message" in give_points_result and "transaction" in give_points_result
    log_test("Give points to direct report", points_given, 
             f"Error: {give_points_result.get('error', '')}" if not points_given else "")
    
    if points_given:
        # Check if manager's point cap was reduced
        updated_stats = manager_client.get_dashboard_stats()
        if "point_cap" not in updated_stats:
            log_test("Get updated manager stats", False, f"Error: {updated_stats.get('error', '')}")
        else:
            cap_reduced = updated_stats["point_cap"] == initial_point_cap - points_to_give
            log_test("Manager point cap reduction", cap_reduced, 
                    f"Expected {initial_point_cap - points_to_give} but got {updated_stats['point_cap']}")
        
        # Login as the employee to check point balance
        employee_client = APIClient(BACKEND_URL)
        
        # Try with the demo employees
        for email in ["john@company.com", "jane@company.com", "bob@company.com"]:
            employee_login = employee_client.login(email, "password")
            if "token" in employee_login and employee_login["user"]["id"] == employee_id:
                employee_stats = employee_client.get_dashboard_stats()
                if "point_balance" in employee_stats:
                    # We can't assert the exact balance since we don't know the initial value
                    # But we can check that it's at least the points we gave
                    has_points = employee_stats["point_balance"] >= points_to_give
                    log_test("Employee received points", has_points, 
                            f"Expected at least {points_to_give} but got {employee_stats['point_balance']}")
                break
    
    # Test point cap enforcement
    # Try to give more points than the manager's cap
    if "point_cap" in manager_stats:
        excessive_points = manager_stats["point_cap"] + 100
        excessive_result = manager_client.give_points(
            to_user_id=employee_id,
            amount=excessive_points,
            reason="This should fail due to cap"
        )
        
        cap_enforced = "error" in excessive_result
        log_test("Point cap enforcement", cap_enforced, 
                f"Expected error but got: {excessive_result}" if not cap_enforced else "")
    
    # Login as admin
    admin_client = APIClient(BACKEND_URL)
    admin_login = admin_client.login("admin@company.com", "password")
    
    if "token" not in admin_login:
        log_test("Admin login for cross-company test", False, f"Error: {admin_login.get('error', '')}")
        return
    
    # Try to give points to an employee from a different company/manager
    # This should fail with an authorization error
    if "token" in manager_login:
        cross_company_result = admin_client.give_points(
            to_user_id=employee_id,  # Employee from manager's team
            amount=10,
            reason="This should fail due to not being direct report"
        )
        
        cross_company_restricted = "error" in cross_company_result
        log_test("Cross-company point restriction", cross_company_restricted, 
                f"Expected error but got: {cross_company_result}" if not cross_company_restricted else "")

def test_badge_awarding():
    """Test automatic badge awarding system"""
    print("\n===== Testing Badge Awarding System =====")
    
    # Login as manager
    manager_client = APIClient(BACKEND_URL)
    manager_login = manager_client.login("manager@company.com", "password")
    
    if "token" not in manager_login:
        log_test("Manager login for badge test", False, f"Error: {manager_login.get('error', '')}")
        return
    
    # Get team members
    team_members = manager_client.get_team_members()
    
    if not isinstance(team_members, list) or not team_members:
        log_test("Get team members for badge test", False, 
                f"Error: {team_members.get('error', '') if not isinstance(team_members, list) else 'No team members'}")
        return
    
    # Get manager's point cap
    manager_stats = manager_client.get_dashboard_stats()
    if "point_cap" not in manager_stats:
        log_test("Get manager stats for badge test", False, f"Error: {manager_stats.get('error', '')}")
        return
    
    # Select an employee to award points to
    employee = team_members[0]
    employee_id = employee["id"]
    
    # Login as the employee to check initial badges
    employee_client = APIClient(BACKEND_URL)
    
    # Try with the demo employees
    employee_email = None
    for email in ["john@company.com", "jane@company.com", "bob@company.com"]:
        employee_login = employee_client.login(email, "password")
        if "token" in employee_login and employee_login["user"]["id"] == employee_id:
            employee_email = email
            initial_badges = employee_client.get_user_badges()
            initial_badge_count = len(initial_badges) if isinstance(initial_badges, list) else 0
            break
    
    if not employee_email:
        log_test("Find employee email", False, "Could not find matching employee email")
        return
    
    # Award enough points to trigger a badge
    # Rising Star badge requires 10 points
    points_to_give = 15  # Enough for Rising Star
    
    if manager_stats["point_cap"] >= points_to_give:
        give_points_result = manager_client.give_points(
            to_user_id=employee_id,
            amount=points_to_give,
            reason="Great work to earn a badge!"
        )
        
        points_given = "message" in give_points_result and "transaction" in give_points_result
        log_test("Give points for badge", points_given, 
                f"Error: {give_points_result.get('error', '')}" if not points_given else "")
        
        if points_given:
            # Wait a moment for badge processing
            time.sleep(1)
            
            # Login as employee again to check badges
            employee_login = employee_client.login(employee_email, "password")
            if "token" in employee_login:
                updated_badges = employee_client.get_user_badges()
                
                if isinstance(updated_badges, list):
                    badge_awarded = len(updated_badges) > initial_badge_count
                    log_test("Badge awarded after points", badge_awarded, 
                            f"Expected more than {initial_badge_count} badges but got {len(updated_badges)}")
                    
                    # Check for Rising Star badge
                    rising_star_found = False
                    for badge_entry in updated_badges:
                        if "badge" in badge_entry and badge_entry["badge"].get("name") == "Rising Star":
                            rising_star_found = True
                            break
                    
                    log_test("Rising Star badge awarded", rising_star_found, 
                            "Rising Star badge not found in user badges")
                else:
                    log_test("Get updated badges", False, f"Error: {updated_badges.get('error', '')}")
    else:
        log_test("Manager has enough points for badge test", False, 
                f"Manager only has {manager_stats['point_cap']} points, needed {points_to_give}")

def test_team_management():
    """Test team member management"""
    print("\n===== Testing Team Management =====")
    
    # Login as manager
    manager_client = APIClient(BACKEND_URL)
    manager_login = manager_client.login("manager@company.com", "password")
    
    if "token" not in manager_login:
        log_test("Manager login for team test", False, f"Error: {manager_login.get('error', '')}")
        return
    
    # Get team members as manager
    manager_team = manager_client.get_team_members()
    
    manager_team_success = isinstance(manager_team, list)
    log_test("Manager can view team members", manager_team_success, 
             f"Error: {manager_team.get('error', '')}" if not manager_team_success else "")
    
    # Login as admin
    admin_client = APIClient(BACKEND_URL)
    admin_login = admin_client.login("admin@company.com", "password")
    
    if "token" not in admin_login:
        log_test("Admin login for team test", False, f"Error: {admin_login.get('error', '')}")
        return
    
    # Get team members as admin
    admin_team = admin_client.get_team_members()
    
    admin_team_success = isinstance(admin_team, list)
    log_test("Admin can view all employees", admin_team_success, 
             f"Error: {admin_team.get('error', '')}" if not admin_team_success else "")
    
    if manager_team_success and admin_team_success:
        # Admin should see more employees than a single manager
        admin_sees_more = len(admin_team) >= len(manager_team)
        log_test("Admin sees more employees than manager", admin_sees_more, 
                f"Admin sees {len(admin_team)} employees, manager sees {len(manager_team)}")
    
    # Login as employee
    employee_client = APIClient(BACKEND_URL)
    employee_login = employee_client.login("john@company.com", "password")
    
    if "token" not in employee_login:
        log_test("Employee login for team test", False, f"Error: {employee_login.get('error', '')}")
        return
    
    # Try to access team members as employee (should fail)
    employee_team = employee_client.get_team_members()
    
    employee_restricted = "error" in employee_team
    log_test("Employee restricted from team view", employee_restricted, 
             f"Expected error but got: {employee_team}" if not employee_restricted else "")

def test_dashboard_statistics():
    """Test dashboard statistics"""
    print("\n===== Testing Dashboard Statistics =====")
    
    # Test for each role
    for role, email in [
        ("Admin", "admin@company.com"),
        ("Manager", "manager@company.com"),
        ("Employee", "john@company.com")
    ]:
        client = APIClient(BACKEND_URL)
        login_result = client.login(email, "password")
        
        if "token" not in login_result:
            log_test(f"{role} login for dashboard test", False, f"Error: {login_result.get('error', '')}")
            continue
        
        # Get dashboard stats
        stats = client.get_dashboard_stats()
        
        stats_success = isinstance(stats, dict) and "point_balance" in stats
        log_test(f"{role} dashboard statistics", stats_success, 
                f"Error: {stats.get('error', '')}" if not stats_success else "")
        
        if stats_success:
            # Check required fields
            required_fields = ["point_balance", "point_cap", "badges_count", "recent_transactions"]
            missing_fields = [field for field in required_fields if field not in stats]
            
            fields_present = len(missing_fields) == 0
            log_test(f"{role} dashboard has required fields", fields_present, 
                    f"Missing fields: {missing_fields}" if not fields_present else "")
            
            # For managers and admins, check team_size
            if role in ["Admin", "Manager"]:
                team_size_present = "team_size" in stats
                log_test(f"{role} dashboard has team_size", team_size_present, 
                        "team_size field missing" if not team_size_present else "")

def run_all_tests():
    """Run all tests"""
    print("Starting backend API tests...")
    
    test_authentication()
    test_company_management()
    test_point_distribution()
    test_badge_awarding()
    test_team_management()
    test_dashboard_statistics()
    
    print_summary()

if __name__ == "__main__":
    run_all_tests()