from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

db_instance = Database()

async def connect_to_mongo():
    """Connect to MongoDB"""
    mongo_url = os.environ.get('MONGO_URL', os.environ.get('MONGODB_URI'))
    db_name = os.environ.get('DB_NAME', 'zenchair')
    
    db_instance.client = AsyncIOMotorClient(mongo_url)
    db_instance.db = db_instance.client[db_name]
    
    # Indexes already exist from previous runs, skip recreation
    print(f"✅ Connected to MongoDB: {db_name}")

async def close_mongo_connection():
    """Close MongoDB connection"""
    if db_instance.client:
        db_instance.client.close()
        print("❌ Disconnected from MongoDB")

def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    return db_instance.db
