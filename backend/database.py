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
    
    # Create indexes
    await db_instance.db.users.create_index("email", unique=True)
    await db_instance.db.users.create_index("username")
    await db_instance.db.user_sessions.create_index("session_token")
    await db_instance.db.user_sessions.create_index("user_id")
    await db_instance.db.barber_shops.create_index("barber_id")
    await db_instance.db.barber_shops.create_index([("location.city", 1)])
    await db_instance.db.barber_shops.create_index([
        ("location.latitude", 1),
        ("location.longitude", 1)
    ])
    await db_instance.db.services.create_index("shop_id")
    await db_instance.db.products.create_index("shop_id")
    await db_instance.db.bookings.create_index("shop_id")
    await db_instance.db.bookings.create_index("customer_id")
    await db_instance.db.bookings.create_index([("date", 1), ("time", 1)])
    await db_instance.db.reviews.create_index("shop_id")
    await db_instance.db.subscriptions.create_index("barber_id")
    
    print(f"✅ Connected to MongoDB: {db_name}")

async def close_mongo_connection():
    """Close MongoDB connection"""
    if db_instance.client:
        db_instance.client.close()
        print("❌ Disconnected from MongoDB")

def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    return db_instance.db
