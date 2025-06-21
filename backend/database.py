from motor.motor_asyncio import AsyncIOMotorClient
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class Database:
    client: Optional[AsyncIOMotorClient] = None
    database = None

    @classmethod
    def get_client(cls) -> AsyncIOMotorClient:
        if cls.client is None:
            mongo_url = os.environ.get('MONGO_URL')
            if not mongo_url:
                raise ValueError("MONGO_URL environment variable is required")
            cls.client = AsyncIOMotorClient(mongo_url)
        return cls.client

    @classmethod
    def get_database(cls):
        if cls.database is None:
            client = cls.get_client()
            db_name = os.environ.get('DB_NAME', 'document_platform')
            cls.database = client[db_name]
        return cls.database

    @classmethod
    async def close_connection(cls):
        if cls.client:
            cls.client.close()
            cls.client = None
            cls.database = None

# Database helper functions
async def get_collection(collection_name: str):
    db = Database.get_database()
    return db[collection_name]

# Collection names
COLLECTIONS = {
    'users': 'users',
    'documents': 'documents',
    'document_views': 'document_views',
    'activity_logs': 'activity_logs',
    'best_practices': 'best_practices',
    'ai_recommendations': 'ai_recommendations',
    'proposal_performances': 'proposal_performances'
}

# Initialize database indexes
async def create_indexes():
    """Create database indexes for better performance"""
    db = Database.get_database()
    
    try:
        # Users collection indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("organization")
        
        # Documents collection indexes
        await db.documents.create_index("owner_id")
        await db.documents.create_index("organization")
        await db.documents.create_index("type")
        await db.documents.create_index("status")
        await db.documents.create_index("created_at")
        await db.documents.create_index("tags")
        
        # Document views collection indexes
        await db.document_views.create_index("document_id")
        await db.document_views.create_index("timestamp")
        await db.document_views.create_index([("document_id", 1), ("timestamp", -1)])
        
        # Activity logs collection indexes
        await db.activity_logs.create_index("user_id")
        await db.activity_logs.create_index("document_id")
        await db.activity_logs.create_index("timestamp")
        await db.activity_logs.create_index("action")
        
        # AI recommendations collection indexes
        await db.ai_recommendations.create_index("document_id")
        await db.ai_recommendations.create_index("type")
        await db.ai_recommendations.create_index("confidence_score")
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Error creating database indexes: {e}")