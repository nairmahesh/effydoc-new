from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

# Enums
class DocumentType(str, Enum):
    RFP = "rfp"
    PROPOSAL = "proposal"
    CONTRACT = "contract"
    PRESENTATION = "presentation"
    OTHER = "other"

class DocumentStatus(str, Enum):
    DRAFT = "draft"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    SENT = "sent"
    VIEWED = "viewed"
    SIGNED = "signed"

class UserRole(str, Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    REVIEWER = "reviewer"
    VIEWER = "viewer"

class ActionType(str, Enum):
    CREATE = "create"
    EDIT = "edit"
    VIEW = "view"
    COMMENT = "comment"
    APPROVE = "approve"
    REJECT = "reject"
    SIGN = "sign"
    DOWNLOAD = "download"

# Base Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    full_name: str
    role: UserRole = UserRole.EDITOR
    organization: str
    avatar_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_active: bool = True

class UserCreate(BaseModel):
    email: str
    full_name: str
    role: UserRole = UserRole.EDITOR
    organization: str
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    organization: Optional[str] = None
    avatar_url: Optional[str] = None

# Document Models
class MultimediaElement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # "video", "audio", "image"
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[int] = None  # in seconds for video/audio

class InteractiveElement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # "button", "signature_field", "input_field"
    label: str
    action: Optional[str] = None
    required: bool = False
    position: Dict[str, float]  # {"x": 0.5, "y": 0.3, "page": 1}

class DocumentSection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    order: int
    multimedia_elements: List[MultimediaElement] = []
    interactive_elements: List[InteractiveElement] = []
    version: int = 1

class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    content: str
    section_id: Optional[str] = None  # null for document-level comments
    position: Optional[Dict[str, float]] = None  # for inline comments
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    resolved: bool = False
    replies: List['Comment'] = []

class DocumentVersion(BaseModel):
    version: int
    created_by: str
    created_at: datetime
    changes_summary: str
    content_snapshot: List[DocumentSection]

class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    type: DocumentType
    status: DocumentStatus = DocumentStatus.DRAFT
    owner_id: str
    organization: str
    sections: List[DocumentSection] = []
    collaborators: List[Dict[str, str]] = []  # [{"user_id": "...", "role": "editor"}]
    comments: List[Comment] = []
    versions: List[DocumentVersion] = []
    current_version: int = 1
    tags: List[str] = []
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    shared_link: Optional[str] = None
    shared_settings: Dict[str, Any] = {}

class DocumentCreate(BaseModel):
    title: str
    type: DocumentType
    organization: str
    sections: List[DocumentSection] = []
    collaborators: List[Dict[str, str]] = []
    tags: List[str] = []
    metadata: Dict[str, Any] = {}

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[DocumentStatus] = None
    sections: Optional[List[DocumentSection]] = None
    collaborators: Optional[List[Dict[str, str]]] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None

# RFP Generation Models
class RFPGenerationRequest(BaseModel):
    project_type: str
    industry: str
    budget_range: str
    timeline: str
    requirements: str
    company_info: str
    specific_deliverables: List[str]
    evaluation_criteria: List[str]
    additional_context: Optional[str] = None

class RFPGenerationResponse(BaseModel):
    generated_content: List[DocumentSection]
    suggestions: List[str]
    estimated_completion_time: str

# Tracking Models
class ViewerInfo(BaseModel):
    ip_address: str
    user_agent: str
    location: Optional[str] = None
    user_id: Optional[str] = None
    user_name: Optional[str] = None

class PageView(BaseModel):
    page_number: int
    time_spent: int  # seconds
    scroll_depth: float  # percentage
    interactions: List[str] = []  # button clicks, etc.

class DocumentView(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    document_id: str
    viewer_info: ViewerInfo
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    total_time_spent: int = 0
    pages_viewed: List[PageView] = []
    completed_viewing: bool = False
    downloaded: bool = False
    signed: bool = False

class DocumentAnalytics(BaseModel):
    document_id: str
    total_views: int
    unique_viewers: int
    average_time_spent: float
    completion_rate: float
    download_count: int
    sign_rate: float
    popular_sections: List[Dict[str, Any]]
    viewer_engagement: Dict[str, Any]
    generated_at: datetime = Field(default_factory=datetime.utcnow)

# Activity Log Models
class ActivityLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    document_id: str
    action: ActionType
    details: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    ip_address: Optional[str] = None

# AI Sales Agent Models
class ProposalPerformance(BaseModel):
    document_id: str
    win_rate: float
    average_response_time: int  # days
    engagement_score: float
    pricing_effectiveness: float
    content_effectiveness: Dict[str, float]  # section-wise scores

class BestPractice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: str  # "pricing", "content", "structure", "timing"
    success_rate: float
    usage_count: int
    organization: str
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AIRecommendation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    document_id: str
    type: str  # "content", "pricing", "structure", "timing"
    title: str
    description: str
    confidence_score: float
    expected_impact: str
    based_on_data: List[str]  # references to similar successful documents
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Update Comment model to handle recursive structure
Comment.model_rebuild()