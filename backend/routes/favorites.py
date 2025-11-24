# Backend API - Add Favorites & Recent Visits
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel
from typing import List
from datetime import datetime
from database import get_database
from dependencies import get_current_user

router = APIRouter(prefix="/api/favorites", tags=["Favorites"])

class AddFavoriteRequest(BaseModel):
    shop_id: str

@router.post("/")
async def add_favorite(
    request_data: AddFavoriteRequest,
    current_user: Request
):
    """Add shop to favorites"""
    user = await get_current_user(current_user)
    db = get_database()
    
    # Check if shop exists
    shop = await db.barber_shops.find_one({"_id": request_data.shop_id})
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
    # Add to favorites (create favorites array if doesn't exist)
    await db.users.update_one(
        {"_id": user.id},
        {
            "$addToSet": {"favorites": request_data.shop_id},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    return {"success": True, "message": "Added to favorites"}

@router.delete("/{shop_id}")
async def remove_favorite(
    shop_id: str,
    current_user: Request
):
    """Remove shop from favorites"""
    user = await get_current_user(current_user)
    db = get_database()
    
    await db.users.update_one(
        {"_id": user.id},
        {
            "$pull": {"favorites": shop_id},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    return {"success": True, "message": "Removed from favorites"}

@router.get("/")
async def get_favorites(current_user: Request):
    """Get user's favorite shops"""
    user = await get_current_user(current_user)
    db = get_database()
    
    # Get user with favorites
    user_doc = await db.users.find_one({"_id": user.id})
    favorite_ids = user_doc.get("favorites", [])
    
    if not favorite_ids:
        return []
    
    # Get shop details
    shops = await db.barber_shops.find({
        "_id": {"$in": favorite_ids}
    }).to_list(100)
    
    return shops

@router.get("/recent")
async def get_recent_shops(current_user: Request):
    """Get recently visited shops based on bookings"""
    user = await get_current_user(current_user)
    db = get_database()
    
    # Get recent bookings
    recent_bookings = await db.bookings.find(
        {"customer_id": user.id}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    # Get unique shop IDs
    shop_ids = list(set([b["shop_id"] for b in recent_bookings]))
    
    if not shop_ids:
        return []
    
    # Get shop details
    shops = await db.barber_shops.find({
        "_id": {"$in": shop_ids}
    }).to_list(100)
    
    return shops
