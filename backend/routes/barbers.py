from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from database import get_database
from dependencies import get_current_barber, get_current_user
from models import BarberShop, Location, WorkingHours, User
import uuid

router = APIRouter(prefix="/api/barbers", tags=["Barbers"])

class CreateShopRequest(BaseModel):
    name: str
    description: str
    location: Location
    phone: str
    email: str
    working_hours: List[WorkingHours]

class UpdateShopRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[Location] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    working_hours: Optional[List[WorkingHours]] = None
    is_open: Optional[bool] = None

class AddGalleryImageRequest(BaseModel):
    image: str  # base64

class SetVacationRequest(BaseModel):
    vacation_dates: List[str]  # ["2025-01-15", "2025-01-16"]

@router.post("/shops", status_code=status.HTTP_201_CREATED)
async def create_barber_shop(
    request_data: CreateShopRequest,
    current_user: Request
):
    """Create a new barber shop (barber only)"""
    user = await get_current_barber(current_user)
    db = get_database()
    
    # Check if barber already has a shop
    existing_shop = await db.barber_shops.find_one({"barber_id": user.id})
    if existing_shop:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a shop"
        )
    
    shop_id = f"shop_{uuid.uuid4().hex}"
    shop_data = {
        "_id": shop_id,
        "barber_id": user.id,
        **request_data.dict(),
        "rating": 0.0,
        "total_reviews": 0,
        "gallery_images": [],
        "vacation_dates": [],
        "is_open": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.barber_shops.insert_one(shop_data)
    return {"success": True, "shop_id": shop_id, "message": "Shop created successfully"}

@router.get("/shops/my")
async def get_my_shop(current_user: Request):
    """Get current barber's shop"""
    user = await get_current_barber(current_user)
    db = get_database()
    
    shop = await db.barber_shops.find_one({"barber_id": user.id})
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
    return shop

@router.put("/shops/{shop_id}")
async def update_barber_shop(
    shop_id: str,
    request_data: UpdateShopRequest,
    current_user: Request
):
    """Update barber shop"""
    user = await get_current_barber(current_user)
    db = get_database()
    
    # Verify ownership
    shop = await db.barber_shops.find_one({"_id": shop_id, "barber_id": user.id})
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found or access denied"
        )
    
    # Update only provided fields
    update_data = {k: v for k, v in request_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.barber_shops.update_one(
        {"_id": shop_id},
        {"$set": update_data}
    )
    
    return {"success": True, "message": "Shop updated successfully"}

@router.post("/shops/{shop_id}/gallery")
async def add_gallery_image(
    shop_id: str,
    request_data: AddGalleryImageRequest,
    current_user: Request
):
    """Add image to gallery"""
    user = await get_current_barber(current_user)
    db = get_database()
    
    # Verify ownership
    shop = await db.barber_shops.find_one({"_id": shop_id, "barber_id": user.id})
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found or access denied"
        )
    
    await db.barber_shops.update_one(
        {"_id": shop_id},
        {"$push": {"gallery_images": request_data.image}}
    )
    
    return {"success": True, "message": "Image added to gallery"}

@router.delete("/shops/{shop_id}/gallery/{image_index}")
async def remove_gallery_image(
    shop_id: str,
    image_index: int,
    current_user: Request
):
    """Remove image from gallery"""
    user = await get_current_barber(current_user)
    db = get_database()
    
    # Verify ownership
    shop = await db.barber_shops.find_one({"_id": shop_id, "barber_id": user.id})
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found or access denied"
        )
    
    # Remove image at index
    gallery = shop.get("gallery_images", [])
    if 0 <= image_index < len(gallery):
        gallery.pop(image_index)
        await db.barber_shops.update_one(
            {"_id": shop_id},
            {"$set": {"gallery_images": gallery}}
        )
        return {"success": True, "message": "Image removed"}
    
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid image index"
    )

@router.post("/shops/{shop_id}/vacation")
async def set_vacation_dates(
    shop_id: str,
    request_data: SetVacationRequest,
    current_user: Request
):
    """Set vacation dates"""
    user = await get_current_barber(current_user)
    db = get_database()
    
    # Verify ownership
    shop = await db.barber_shops.find_one({"_id": shop_id, "barber_id": user.id})
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found or access denied"
        )
    
    await db.barber_shops.update_one(
        {"_id": shop_id},
        {"$set": {"vacation_dates": request_data.vacation_dates}}
    )
    
    return {"success": True, "message": "Vacation dates updated"}

# Customer endpoints

@router.get("/shops")
async def get_barber_shops(
    city: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_km: float = 10.0
):
    """Get barber shops by city or location"""
    db = get_database()
    
    query = {}
    
    if city:
        # Search by city
        query["location.city"] = {"$regex": city, "$options": "i"}
    elif latitude and longitude:
        # Search by geolocation (simple distance calculation)
        # For production, use MongoDB geospatial queries
        pass
    
    shops = await db.barber_shops.find(query).to_list(100)
    return shops

@router.get("/shops/{shop_id}")
async def get_barber_shop_details(shop_id: str):
    """Get barber shop details"""
    db = get_database()
    
    shop = await db.barber_shops.find_one({"_id": shop_id})
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
    # Get services
    services = await db.services.find({"shop_id": shop_id}).to_list(100)
    
    # Get products
    products = await db.products.find({"shop_id": shop_id}).to_list(100)
    
    # Get reviews
    reviews = await db.reviews.find({"shop_id": shop_id}).to_list(100)
    
    return {
        **shop,
        "services": services,
        "products": products,
        "reviews": reviews
    }
