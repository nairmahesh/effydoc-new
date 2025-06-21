from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt
from enum import Enum
from bson import ObjectId
from fastapi.encoders import jsonable_encoder

# Custom JSON encoder to handle ObjectId
class CustomJSONEncoder:
    @staticmethod
    def default(obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="EffyLoyalty API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

# Enums
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    COMPANY_ADMIN = "company_admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"

class BadgeType(str, Enum):
    POINTS_BASED = "points_based"
    SPECIAL_EVENT = "special_event"
    TASK_COMPLETION = "task_completion"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: UserRole
    company_id: Optional[str] = None
    manager_id: Optional[str] = None
    department: Optional[str] = None
    point_balance: int = 0
    point_cap: int = 500
    point_cap_renewal_type: str = "request"  # "request" or "automatic"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    role: UserRole
    company_id: Optional[str] = None
    manager_id: Optional[str] = None
    department: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Company(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    point_name: str = "effyPoints"
    logo_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class CompanyCreate(BaseModel):
    name: str
    point_name: str = "effyPoints"
    admin_email: str
    admin_name: str
    admin_password: str

class PointTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_user_id: str
    to_user_id: str
    amount: int
    reason: str
    company_id: str
    transaction_type: str = "manager_award"  # manager_award, task_completion, bonus
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PointTransactionCreate(BaseModel):
    to_user_id: str
    amount: int
    reason: str

class Badge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    icon: str
    badge_type: BadgeType
    company_id: Optional[str] = None
    points_required: Optional[int] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserBadge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    badge_id: str
    earned_at: datetime = Field(default_factory=datetime.utcnow)
    awarded_by: Optional[str] = None

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    points_reward: int
    company_id: str
    created_by: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TaskCreate(BaseModel):
    title: str
    description: str
    points_reward: int

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str, role: str, company_id: str = None) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'company_id': company_id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_data = await db.users.find_one({"id": user_id})
        if not user_data:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user_data)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Default badges
DEFAULT_BADGES = [
    {"name": "Bronze Star", "description": "Earned 50 points", "icon": "🥉", "badge_type": "points_based", "points_required": 50},
    {"name": "Silver Star", "description": "Earned 150 points", "icon": "🥈", "badge_type": "points_based", "points_required": 150},
    {"name": "Gold Star", "description": "Earned 300 points", "icon": "🥇", "badge_type": "points_based", "points_required": 300},
    {"name": "Platinum Star", "description": "Earned 500 points", "icon": "💎", "badge_type": "points_based", "points_required": 500},
    {"name": "Rising Star", "description": "First 10 points earned", "icon": "⭐", "badge_type": "points_based", "points_required": 10},
]

async def create_default_badges(company_id: str):
    """Create default badges for a company"""
    badges = []
    for badge_data in DEFAULT_BADGES:
        badge = Badge(
            **badge_data,
            company_id=company_id
        )
        badges.append(badge.dict())
    
    if badges:
        await db.badges.insert_many(badges)

async def check_and_award_badges(user_id: str, company_id: str):
    """Check if user qualifies for any new badges and award them"""
    # Get user's current points
    user = await db.users.find_one({"id": user_id})
    if not user:
        return
    
    current_points = user.get("point_balance", 0)
    
    # Get all point-based badges for the company
    badges = await db.badges.find({
        "company_id": company_id,
        "badge_type": "points_based",
        "is_active": True
    }).to_list(100)
    
    # Get badges already earned by user
    earned_badges = await db.user_badges.find({"user_id": user_id}).to_list(100)
    earned_badge_ids = [badge["badge_id"] for badge in earned_badges]
    
    # Check which badges user qualifies for
    badges_awarded = False
    for badge in badges:
        if (badge["id"] not in earned_badge_ids and 
            badge.get("points_required", 0) <= current_points):
            
            # Award the badge
            user_badge = UserBadge(
                user_id=user_id,
                badge_id=badge["id"]
            )
            await db.user_badges.insert_one(user_badge.dict())
            badges_awarded = True
            
    return badges_awarded

# Authentication routes
@api_router.post("/auth/register")
async def register_user(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        company_id=user_data.company_id,
        manager_id=user_data.manager_id,
        department=user_data.department
    )
    
    user_dict = user.dict()
    user_dict["password"] = hashed_password
    
    await db.users.insert_one(user_dict)
    
    # Create JWT token
    token = create_jwt_token(user.id, user.email, user.role.value, user.company_id)
    
    return {"token": token, "user": user}

@api_router.post("/auth/login")
async def login_user(login_data: UserLogin):
    # Find user
    user_data = await db.users.find_one({"email": login_data.email})
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(login_data.password, user_data["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**{k: v for k, v in user_data.items() if k != "password"})
    
    # Create JWT token
    token = create_jwt_token(user.id, user.email, user.role.value, user.company_id)
    
    return {"token": token, "user": user}

@api_router.get("/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# Company routes
@api_router.post("/companies", response_model=Company)
async def create_company(company_data: CompanyCreate):
    # Check if company exists
    existing_company = await db.companies.find_one({"name": company_data.name})
    if existing_company:
        raise HTTPException(status_code=400, detail="Company already exists")
    
    # Create company
    company = Company(
        name=company_data.name,
        point_name=company_data.point_name
    )
    
    await db.companies.insert_one(company.dict())
    
    # Create company admin
    admin_user = UserCreate(
        email=company_data.admin_email,
        name=company_data.admin_name,
        password=company_data.admin_password,
        role=UserRole.COMPANY_ADMIN,
        company_id=company.id
    )
    
    # Hash password and create admin
    hashed_password = hash_password(admin_user.password)
    admin = User(
        email=admin_user.email,
        name=admin_user.name,
        role=admin_user.role,
        company_id=admin_user.company_id
    )
    
    admin_dict = admin.dict()
    admin_dict["password"] = hashed_password
    
    await db.users.insert_one(admin_dict)
    
    # Create default badges for the company
    await create_default_badges(company.id)
    
    return company

@api_router.get("/companies/{company_id}")
async def get_company(company_id: str, current_user: User = Depends(get_current_user)):
    company_data = await db.companies.find_one({"id": company_id})
    if not company_data:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return Company(**company_data)

# Point transaction routes
@api_router.post("/points/give")
async def give_points(
    transaction_data: PointTransactionCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if current user is a manager
    if current_user.role not in [UserRole.MANAGER, UserRole.COMPANY_ADMIN]:
        raise HTTPException(status_code=403, detail="Only managers can give points")
    
    # Get recipient user
    recipient = await db.users.find_one({"id": transaction_data.to_user_id})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    # Check if recipient is in same company
    if recipient.get("company_id") != current_user.company_id:
        raise HTTPException(status_code=403, detail="Can only give points to users in same company")
    
    # Check if recipient is direct report (for managers)
    if current_user.role == UserRole.MANAGER:
        if recipient.get("manager_id") != current_user.id:
            raise HTTPException(status_code=403, detail="Can only give points to direct reports")
    
    # Company admins can only give points to managers, not to regular employees
    if current_user.role == UserRole.COMPANY_ADMIN:
        if recipient.get("role") not in [UserRole.MANAGER.value]:
            raise HTTPException(status_code=403, detail="Company admins can only give points to managers")
    
    # Check if manager has enough points in cap
    if current_user.point_cap < transaction_data.amount:
        raise HTTPException(status_code=400, detail="Insufficient point cap")
    
    # Create transaction
    transaction = PointTransaction(
        from_user_id=current_user.id,
        to_user_id=transaction_data.to_user_id,
        amount=transaction_data.amount,
        reason=transaction_data.reason,
        company_id=current_user.company_id
    )
    
    await db.point_transactions.insert_one(transaction.dict())
    
    # Update recipient's points
    await db.users.update_one(
        {"id": transaction_data.to_user_id},
        {"$inc": {"point_balance": transaction_data.amount}}
    )
    
    # Update manager's point cap
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"point_cap": -transaction_data.amount}}
    )
    
    # Check and award badges
    await check_and_award_badges(transaction_data.to_user_id, current_user.company_id)
    
    return {"message": "Points awarded successfully", "transaction": transaction}

@api_router.get("/points/transactions")
async def get_transactions(current_user: User = Depends(get_current_user)):
    # Get transactions for current user (given or received)
    transactions = await db.point_transactions.find({
        "$or": [
            {"from_user_id": current_user.id},
            {"to_user_id": current_user.id}
        ]
    }).sort("created_at", -1).to_list(100)
    
    # Populate user names and handle ObjectId
    result = []
    for transaction in transactions:
        # Convert _id to string if it exists
        if "_id" in transaction and isinstance(transaction["_id"], ObjectId):
            transaction["_id"] = str(transaction["_id"])
            
        from_user = await db.users.find_one({"id": transaction["from_user_id"]})
        to_user = await db.users.find_one({"id": transaction["to_user_id"]})
        transaction["from_user_name"] = from_user.get("name", "Unknown") if from_user else "Unknown"
        transaction["to_user_name"] = to_user.get("name", "Unknown") if to_user else "Unknown"
        result.append(transaction)
    
    return result

# User routes
@api_router.get("/users/team")
async def get_team_members(current_user: User = Depends(get_current_user)):
    """Get direct reports for managers"""
    if current_user.role not in [UserRole.MANAGER, UserRole.COMPANY_ADMIN]:
        raise HTTPException(status_code=403, detail="Only managers can view team members")
    
    if current_user.role == UserRole.MANAGER:
        # Get direct reports
        team_members = await db.users.find({
            "manager_id": current_user.id,
            "company_id": current_user.company_id,
            "is_active": True
        }).to_list(100)
    else:
        # Company admin can see all employees
        team_members = await db.users.find({
            "company_id": current_user.company_id,
            "is_active": True,
            "role": {"$ne": "company_admin"}
        }).to_list(100)
    
    # Remove password field and convert ObjectId to string
    result = []
    for member in team_members:
        member.pop("password", None)
        # Convert _id to string if it exists
        if "_id" in member and isinstance(member["_id"], ObjectId):
            member["_id"] = str(member["_id"])
        result.append(member)
    
    return result

@api_router.get("/users/badges")
async def get_user_badges(current_user: User = Depends(get_current_user)):
    """Get badges earned by current user"""
    # Get user badges
    user_badges = await db.user_badges.find({"user_id": current_user.id}).to_list(100)
    
    # Populate badge details
    badges_with_details = []
    for user_badge in user_badges:
        # Convert _id to string if it exists
        if "_id" in user_badge and isinstance(user_badge["_id"], ObjectId):
            user_badge["_id"] = str(user_badge["_id"])
            
        badge = await db.badges.find_one({"id": user_badge["badge_id"]})
        if badge:
            # Convert badge _id to string if it exists
            if "_id" in badge and isinstance(badge["_id"], ObjectId):
                badge["_id"] = str(badge["_id"])
                
            badges_with_details.append({
                "earned_at": user_badge["earned_at"],
                "badge": badge
            })
    
    return badges_with_details

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    """Get dashboard statistics"""
    stats = {
        "point_balance": current_user.point_balance,
        "point_cap": current_user.point_cap,
        "badges_count": 0,
        "team_size": 0,
        "recent_transactions": []
    }
    
    # Get badges count
    badges_count = await db.user_badges.count_documents({"user_id": current_user.id})
    stats["badges_count"] = badges_count
    
    # Get team size for managers
    if current_user.role in [UserRole.MANAGER, UserRole.COMPANY_ADMIN]:
        if current_user.role == UserRole.MANAGER:
            team_size = await db.users.count_documents({
                "manager_id": current_user.id,
                "is_active": True
            })
        else:
            team_size = await db.users.count_documents({
                "company_id": current_user.company_id,
                "is_active": True,
                "role": {"$ne": "company_admin"}
            })
        stats["team_size"] = team_size
    
    # Get recent transactions
    recent_transactions = await db.point_transactions.find({
        "$or": [
            {"from_user_id": current_user.id},
            {"to_user_id": current_user.id}
        ]
    }).sort("created_at", -1).limit(5).to_list(5)
    
    # Populate user names and handle ObjectId
    processed_transactions = []
    for transaction in recent_transactions:
        # Convert _id to string if it exists
        if "_id" in transaction and isinstance(transaction["_id"], ObjectId):
            transaction["_id"] = str(transaction["_id"])
            
        from_user = await db.users.find_one({"id": transaction["from_user_id"]})
        to_user = await db.users.find_one({"id": transaction["to_user_id"]})
        transaction["from_user_name"] = from_user.get("name", "Unknown") if from_user else "Unknown"
        transaction["to_user_name"] = to_user.get("name", "Unknown") if to_user else "Unknown"
        processed_transactions.append(transaction)
    
    stats["recent_transactions"] = processed_transactions
    
    return stats

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()