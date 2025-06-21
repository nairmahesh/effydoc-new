import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json

# Import our custom modules
from models import *
from database import Database, get_collection, create_indexes
from auth import get_current_active_user, require_role, check_document_access, create_access_token, verify_password, get_password_hash
from openai_service import openai_service

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI(
    title="Document Platform API",
    description="AI-powered document creation and collaboration platform",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

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

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register_user(user_data: UserCreate):
    """Register a new user"""
    users_collection = await get_collection('users')
    
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        organization=user_data.organization
    )
    
    # Save user (password stored separately for security)
    user_dict = user.dict()
    user_dict['hashed_password'] = hashed_password
    
    await users_collection.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@api_router.post("/auth/login")
async def login_user(email: str, password: str):
    """Authenticate user and return access token"""
    users_collection = await get_collection('users')
    
    user_data = await users_collection.find_one({"email": email})
    if not user_data or not verify_password(password, user_data['hashed_password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update last login
    await users_collection.update_one(
        {"email": email},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    user = User(**{k: v for k, v in user_data.items() if k != 'hashed_password'})
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

# ==================== USER ENDPOINTS ====================

@api_router.get("/users/me", response_model=User)
async def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """Get current user profile"""
    return current_user

@api_router.put("/users/me", response_model=User)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update current user profile"""
    users_collection = await get_collection('users')
    
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    if update_data:
        await users_collection.update_one(
            {"id": current_user.id},
            {"$set": update_data}
        )
    
    # Return updated user
    updated_user_data = await users_collection.find_one({"id": current_user.id})
    return User(**{k: v for k, v in updated_user_data.items() if k != 'hashed_password'})

# ==================== DOCUMENT ENDPOINTS ====================

@api_router.post("/documents", response_model=Document)
async def create_document(
    document_data: DocumentCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new document"""
    documents_collection = await get_collection('documents')
    
    document = Document(
        title=document_data.title,
        type=document_data.type,
        owner_id=current_user.id,
        organization=current_user.organization,
        sections=document_data.sections,
        collaborators=document_data.collaborators,
        tags=document_data.tags,
        metadata=document_data.metadata
    )
    
    await documents_collection.insert_one(document.dict())
    
    # Log activity
    await log_activity(current_user.id, current_user.full_name, document.id, ActionType.CREATE, {"title": document.title})
    
    return document

@api_router.get("/documents", response_model=List[Document])
async def get_documents(
    type: Optional[DocumentType] = None,
    status: Optional[DocumentStatus] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Get user's documents with optional filtering"""
    documents_collection = await get_collection('documents')
    
    # Build query
    query = {
        "$or": [
            {"owner_id": current_user.id},
            {"collaborators.user_id": current_user.id}
        ]
    }
    
    if type:
        query["type"] = type
    if status:
        query["status"] = status
    
    documents = await documents_collection.find(query).to_list(1000)
    return [Document(**doc) for doc in documents]

@api_router.get("/documents/{document_id}", response_model=Document)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific document"""
    document_data = await check_document_access(document_id, current_user, "view")
    
    # Log view activity
    await log_activity(current_user.id, current_user.full_name, document_id, ActionType.VIEW, {})
    
    return Document(**document_data)

@api_router.put("/documents/{document_id}", response_model=Document)
async def update_document(
    document_id: str,
    document_update: DocumentUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update a document"""
    await check_document_access(document_id, current_user, "edit")
    documents_collection = await get_collection('documents')
    
    update_data = {k: v for k, v in document_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await documents_collection.update_one(
        {"id": document_id},
        {"$set": update_data}
    )
    
    # Log activity
    await log_activity(current_user.id, current_user.full_name, document_id, ActionType.EDIT, update_data)
    
    # Return updated document
    updated_doc = await documents_collection.find_one({"id": document_id})
    return Document(**updated_doc)

@api_router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a document"""
    await check_document_access(document_id, current_user, "admin")
    documents_collection = await get_collection('documents')
    
    result = await documents_collection.delete_one({"id": document_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"message": "Document deleted successfully"}

# ==================== AI/RFP GENERATION ENDPOINTS ====================

@api_router.post("/ai/generate-rfp")
async def generate_rfp(
    request: RFPGenerationRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Generate RFP content using AI"""
    try:
        sections = await openai_service.generate_rfp_content(request)
        
        return {
            "sections": [section.dict() for section in sections],
            "message": "RFP content generated successfully"
        }
    except Exception as e:
        logger.error(f"Error generating RFP: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/analyze-document/{document_id}")
async def analyze_document_performance(
    document_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Analyze document performance and get AI recommendations"""
    document_data = await check_document_access(document_id, current_user, "view")
    
    # Get performance data
    performance_data = await get_document_performance_data(document_id)
    
    # Generate AI recommendations
    recommendations = await openai_service.analyze_document_performance(document_data, performance_data)
    
    # Save recommendations
    if recommendations:
        recommendations_collection = await get_collection('ai_recommendations')
        for rec in recommendations:
            await recommendations_collection.insert_one(rec.dict())
    
    return {
        "recommendations": [rec.dict() for rec in recommendations],
        "performance_data": performance_data
    }

# ==================== COLLABORATION ENDPOINTS ====================

@api_router.post("/documents/{document_id}/comments")
async def add_comment(
    document_id: str,
    comment_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user)
):
    """Add a comment to a document"""
    await check_document_access(document_id, current_user, "comment")
    documents_collection = await get_collection('documents')
    
    comment = Comment(
        user_id=current_user.id,
        user_name=current_user.full_name,
        content=comment_data["content"],
        section_id=comment_data.get("section_id"),
        position=comment_data.get("position")
    )
    
    await documents_collection.update_one(
        {"id": document_id},
        {"$push": {"comments": comment.dict()}}
    )
    
    # Log activity
    await log_activity(current_user.id, current_user.full_name, document_id, ActionType.COMMENT, {"content": comment.content})
    
    return comment

@api_router.get("/documents/{document_id}/comments")
async def get_comments(
    document_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get all comments for a document"""
    document_data = await check_document_access(document_id, current_user, "view")
    return document_data.get("comments", [])

# ==================== TRACKING ENDPOINTS ====================

@api_router.post("/tracking/view")
async def track_document_view(view_data: Dict[str, Any]):
    """Track document view (public endpoint for shared documents)"""
    views_collection = await get_collection('document_views')
    
    document_view = DocumentView(
        document_id=view_data["document_id"],
        viewer_info=ViewerInfo(**view_data["viewer_info"]),
        pages_viewed=view_data.get("pages_viewed", []),
        total_time_spent=view_data.get("total_time_spent", 0),
        completed_viewing=view_data.get("completed_viewing", False),
        downloaded=view_data.get("downloaded", False),
        signed=view_data.get("signed", False)
    )
    
    await views_collection.insert_one(document_view.dict())
    return {"message": "View tracked successfully"}

@api_router.get("/documents/{document_id}/analytics")
async def get_document_analytics(
    document_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get analytics for a document"""
    await check_document_access(document_id, current_user, "view")
    
    performance_data = await get_document_performance_data(document_id)
    return performance_data

# ==================== HELPER FUNCTIONS ====================

async def log_activity(user_id: str, user_name: str, document_id: str, action: ActionType, details: Dict[str, Any]):
    """Log user activity"""
    activity_logs_collection = await get_collection('activity_logs')
    
    activity = ActivityLog(
        user_id=user_id,
        user_name=user_name,
        document_id=document_id,
        action=action,
        details=details
    )
    
    await activity_logs_collection.insert_one(activity.dict())

async def get_document_performance_data(document_id: str) -> Dict[str, Any]:
    """Get performance analytics for a document"""
    views_collection = await get_collection('document_views')
    
    # Get all views for this document
    views = await views_collection.find({"document_id": document_id}).to_list(1000)
    
    if not views:
        return {
            "views": 0,
            "unique_viewers": 0,
            "avg_time": 0,
            "completion_rate": 0,
            "download_rate": 0,
            "sign_rate": 0,
            "engagement": {}
        }
    
    total_views = len(views)
    unique_viewers = len(set(view.get("viewer_info", {}).get("ip_address") for view in views))
    avg_time = sum(view.get("total_time_spent", 0) for view in views) / total_views
    completion_rate = (sum(1 for view in views if view.get("completed_viewing")) / total_views) * 100
    download_rate = (sum(1 for view in views if view.get("downloaded")) / total_views) * 100
    sign_rate = (sum(1 for view in views if view.get("signed")) / total_views) * 100
    
    return {
        "views": total_views,
        "unique_viewers": unique_viewers,
        "avg_time": avg_time,
        "completion_rate": completion_rate,
        "download_rate": download_rate,
        "sign_rate": sign_rate,
        "engagement": {
            "total_page_views": sum(len(view.get("pages_viewed", [])) for view in views),
            "avg_pages_per_session": sum(len(view.get("pages_viewed", [])) for view in views) / total_views if total_views > 0 else 0
        }
    }

# ==================== BASIC ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "Document Platform API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Include the router in the main app
app.include_router(api_router)

# ==================== STARTUP/SHUTDOWN EVENTS ====================

@app.on_event("startup")
async def startup_event():
    """Initialize database and create indexes"""
    logger.info("Starting up Document Platform API")
    await create_indexes()
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup database connections"""
    logger.info("Shutting down Document Platform API")
    await Database.close_connection()
