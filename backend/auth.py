from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import os
from models import User, UserRole

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    from database import get_collection
    users_collection = await get_collection('users')
    user_data = await users_collection.find_one({"id": user_id})
    
    if user_data is None:
        raise credentials_exception
    
    return User(**user_data)

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Role-based access control
def require_role(required_role: UserRole):
    def role_checker(current_user: User = Depends(get_current_active_user)):
        # Admin can access everything
        if current_user.role == UserRole.ADMIN:
            return current_user
        
        # Check specific role requirements
        role_hierarchy = {
            UserRole.VIEWER: 1,
            UserRole.REVIEWER: 2,
            UserRole.EDITOR: 3,
            UserRole.ADMIN: 4
        }
        
        if role_hierarchy[current_user.role] < role_hierarchy[required_role]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

# Document access control
async def check_document_access(document_id: str, user: User, required_permission: str = "view"):
    from database import get_collection
    documents_collection = await get_collection('documents')
    document = await documents_collection.find_one({"id": document_id})
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Owner has full access
    if document['owner_id'] == user.id:
        return document
    
    # Check if user is a collaborator
    collaborators = document.get('collaborators', [])
    user_collab = next((c for c in collaborators if c['user_id'] == user.id), None)
    
    if not user_collab:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check permission level
    user_role = user_collab['role']
    
    permission_matrix = {
        'view': ['viewer', 'reviewer', 'editor', 'admin'],
        'comment': ['reviewer', 'editor', 'admin'],
        'edit': ['editor', 'admin'],
        'admin': ['admin']
    }
    
    if user_role not in permission_matrix.get(required_permission, []):
        raise HTTPException(status_code=403, detail="Insufficient permissions for this action")
    
    return document