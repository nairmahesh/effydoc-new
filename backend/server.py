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

# ==================== EMAIL INTEGRATION ENDPOINTS ====================

@api_router.post("/users/me/email-connections")
async def add_email_connection(
    connection_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user)
):
    """Add email connection to user profile"""
    users_collection = await get_collection('users')
    
    # Create new email connection
    email_connection = EmailConnection(
        provider=connection_data["provider"],
        email_address=connection_data["email_address"],
        display_name=connection_data.get("display_name", connection_data["email_address"]),
        is_primary=connection_data.get("is_primary", False)
    )
    
    # If this is set as primary, make others non-primary
    if email_connection.is_primary:
        await users_collection.update_one(
            {"id": current_user.id},
            {"$set": {"email_connections.$[].is_primary": False}}
        )
    
    # Add connection to user
    await users_collection.update_one(
        {"id": current_user.id},
        {"$push": {"email_connections": email_connection.dict()}}
    )
    
    return email_connection

@api_router.get("/users/me/email-connections")
async def get_email_connections(current_user: User = Depends(get_current_active_user)):
    """Get user's email connections"""
    users_collection = await get_collection('users')
    user_data = await users_collection.find_one({"id": current_user.id})
    
    return user_data.get("email_connections", [])

@api_router.delete("/users/me/email-connections/{connection_id}")
async def remove_email_connection(
    connection_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Remove email connection"""
    users_collection = await get_collection('users')
    
    # Remove the connection
    await users_collection.update_one(
        {"id": current_user.id},
        {"$pull": {"email_connections": {"id": connection_id}}}
    )
    
    return {"message": "Email connection removed successfully"}

@api_router.put("/users/me/email-connections/{connection_id}/primary")
async def set_primary_email_connection(
    connection_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Set email connection as primary"""
    users_collection = await get_collection('users')
    
    # First, make all connections non-primary
    await users_collection.update_one(
        {"id": current_user.id},
        {"$set": {"email_connections.$[].is_primary": False}}
    )
    
    # Then set the specified connection as primary
    await users_collection.update_one(
        {"id": current_user.id, "email_connections.id": connection_id},
        {"$set": {"email_connections.$.is_primary": True}}
    )
    
    return {"message": "Primary email connection updated"}

@api_router.put("/users/me/notification-settings")
async def update_notification_settings(
    settings: Dict[str, bool],
    current_user: User = Depends(get_current_active_user)
):
    """Update user notification settings"""
    users_collection = await get_collection('users')
    
    await users_collection.update_one(
        {"id": current_user.id},
        {"$set": {"notification_settings": settings}}
    )
    
    return {"message": "Notification settings updated successfully"}

@api_router.put("/users/me/email-signature")
async def update_email_signature(
    signature_data: Dict[str, str],
    current_user: User = Depends(get_current_active_user)
):
    """Update user email signature"""
    users_collection = await get_collection('users')
    
    await users_collection.update_one(
        {"id": current_user.id},
        {"$set": {"email_signature": signature_data["signature"]}}
    )
    
    return {"message": "Email signature updated successfully"}

# ==================== EMAIL SENDING ENDPOINTS ====================

@api_router.post("/documents/{document_id}/send-email")
async def send_document_via_email(
    document_id: str,
    email_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user)
):
    """Send document via email"""
    document_data = await check_document_access(document_id, current_user, "view")
    
    # Here you would integrate with email service (SMTP, SendGrid, etc.)
    # For now, we'll log the action and return success
    
    # Log the email send activity
    await log_activity(
        current_user.id, 
        current_user.full_name, 
        document_id, 
        ActionType.CREATE,  # Using CREATE for email send action
        {
            "action": "email_sent",
            "recipients": email_data.get("recipients", []),
            "subject": email_data.get("subject", ""),
            "message": email_data.get("message", "")
        }
    )
    
    return {
        "message": "Email sent successfully",
        "recipients": email_data.get("recipients", []),
        "document_title": document_data["title"]
    }

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

@api_router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = None,
    current_user: User = Depends(get_current_active_user)
):
    """Upload a document file and convert it to editable format"""
    import os
    import PyPDF2
    import docx
    from io import BytesIO
    
    # Validate file type
    allowed_types = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF, DOCX, or TXT files.")
    
    try:
        # Read file content
        content = await file.read()
        
        # Extract text based on file type
        extracted_text = ""
        if file.content_type == "application/pdf":
            # Extract text from PDF
            pdf_reader = PyPDF2.PdfReader(BytesIO(content))
            for page in pdf_reader.pages:
                extracted_text += page.extract_text() + "\n\n"
        
        elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            # Extract text from DOCX
            doc = docx.Document(BytesIO(content))
            for paragraph in doc.paragraphs:
                extracted_text += paragraph.text + "\n"
        
        elif file.content_type == "text/plain":
            # Plain text file
            extracted_text = content.decode('utf-8')
        
        # Create document sections from extracted content
        sections = []
        paragraphs = [p.strip() for p in extracted_text.split('\n\n') if p.strip()]
        
        for i, paragraph in enumerate(paragraphs[:10]):  # Limit to first 10 paragraphs
            if len(paragraph) > 20:  # Only include substantial paragraphs
                sections.append(DocumentSection(
                    title=f"Section {i+1}",
                    content=paragraph,
                    order=i+1
                ))
        
        # If no substantial content found, create a single section
        if not sections:
            sections.append(DocumentSection(
                title="Uploaded Content",
                content=extracted_text[:1000] + "..." if len(extracted_text) > 1000 else extracted_text,
                order=1
            ))
        
        # Create document
        documents_collection = await get_collection('documents')
        
        document = Document(
            title=title or file.filename.rsplit('.', 1)[0],
            type=DocumentType.PROPOSAL,
            owner_id=current_user.id,
            organization=current_user.organization,
            sections=sections,
            collaborators=[],
            tags=["uploaded", "imported"],
            metadata={
                "original_filename": file.filename,
                "file_type": file.content_type,
                "upload_method": "file_upload",
                "extracted_sections": len(sections)
            }
        )
        
        await documents_collection.insert_one(document.dict())
        
        # Log activity
        await log_activity(
            current_user.id, 
            current_user.full_name, 
            document.id, 
            ActionType.CREATE, 
            {
                "title": document.title,
                "upload_method": "file_upload",
                "original_filename": file.filename
            }
        )
        
        return {
            "message": "Document uploaded and processed successfully",
            "document": document,
            "sections_extracted": len(sections)
        }
        
    except Exception as e:
        logger.error(f"Error processing uploaded file: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

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

@api_router.put("/documents/{document_id}/sections/{section_id}")
async def update_document_section(
    document_id: str,
    section_id: str,
    section_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user)
):
    """Update a specific section of a document"""
    await check_document_access(document_id, current_user, "edit")
    documents_collection = await get_collection('documents')
    
    # Update the specific section
    await documents_collection.update_one(
        {"id": document_id, "sections.id": section_id},
        {"$set": {
            "sections.$.title": section_data.get("title"),
            "sections.$.content": section_data.get("content"),
            "sections.$.multimedia_elements": section_data.get("multimedia_elements", []),
            "sections.$.interactive_elements": section_data.get("interactive_elements", []),
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Log activity
    await log_activity(
        current_user.id, 
        current_user.full_name, 
        document_id, 
        ActionType.EDIT, 
        {
            "section_id": section_id,
            "section_title": section_data.get("title"),
            "action": "section_updated"
        }
    )
    
    return {"message": "Section updated successfully"}

@api_router.post("/documents/{document_id}/sections/{section_id}/multimedia")
async def add_multimedia_element(
    document_id: str,
    section_id: str,
    multimedia_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user)
):
    """Add multimedia element to a document section"""
    await check_document_access(document_id, current_user, "edit")
    documents_collection = await get_collection('documents')
    
    multimedia_element = MultimediaElement(
        type=multimedia_data["type"],
        url=multimedia_data["url"],
        title=multimedia_data.get("title"),
        description=multimedia_data.get("description"),
        duration=multimedia_data.get("duration")
    )
    
    # Add multimedia element to the section
    await documents_collection.update_one(
        {"id": document_id, "sections.id": section_id},
        {"$push": {"sections.$.multimedia_elements": multimedia_element.dict()}}
    )
    
    # Log activity
    await log_activity(
        current_user.id, 
        current_user.full_name, 
        document_id, 
        ActionType.EDIT, 
        {
            "section_id": section_id,
            "action": "multimedia_added",
            "multimedia_type": multimedia_data["type"]
        }
    )
    
    return {"message": "Multimedia element added successfully", "element": multimedia_element}

@api_router.post("/documents/{document_id}/sections/{section_id}/interactive")
async def add_interactive_element(
    document_id: str,
    section_id: str,
    interactive_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user)
):
    """Add interactive element (button, e-signature field) to a document section"""
    await check_document_access(document_id, current_user, "edit")
    documents_collection = await get_collection('documents')
    
    interactive_element = InteractiveElement(
        type=interactive_data["type"],
        label=interactive_data["label"],
        action=interactive_data.get("action"),
        required=interactive_data.get("required", False),
        position=interactive_data.get("position", {"x": 0.5, "y": 0.3, "page": 1})
    )
    
    # Add interactive element to the section
    await documents_collection.update_one(
        {"id": document_id, "sections.id": section_id},
        {"$push": {"sections.$.interactive_elements": interactive_element.dict()}}
    )
    
    # Log activity
    await log_activity(
        current_user.id, 
        current_user.full_name, 
        document_id, 
        ActionType.EDIT, 
        {
            "section_id": section_id,
            "action": "interactive_added",
            "interactive_type": interactive_data["type"]
        }
    )
    
    return {"message": "Interactive element added successfully", "element": interactive_element}

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
