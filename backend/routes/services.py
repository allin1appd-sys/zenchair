from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from database import get_database
from dependencies import get_current_barber
import uuid

router = APIRouter(prefix="/api/services", tags=["Services"])

class CreateServiceRequest(BaseModel):
    name: str
    description: str
    price: float
    duration: int  # minutes

class UpdateServiceRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    duration: Optional[int] = None

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_service(
    shop_id: str,
    request_data: CreateServiceRequest,
    current_user: Request
):
    """Create a new service"""
    user = await get_current_barber(current_user)
    db = get_database()
    
    # Verify shop ownership
    shop = await db.barber_shops.find_one({"_id": shop_id, "barber_id": user.id})
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found or access denied"
        )
    
    service_id = f"service_{uuid.uuid4().hex}"
    service_data = {
        "_id": service_id,
        "shop_id": shop_id,
        **request_data.dict(),
        "created_at": datetime.utcnow()
    }
    
    await db.services.insert_one(service_data)
    return {"success": True, "service_id": service_id}

@router.get("/shop/{shop_id}")
async def get_shop_services(shop_id: str):
    """Get all services for a shop"""
    db = get_database()
    services = await db.services.find({"shop_id": shop_id}).to_list(100)
    return services

@router.put("/{service_id}")
async def update_service(
    service_id: str,
    request_data: UpdateServiceRequest,
    current_user: Request
):
    """Update a service"""
    user = await get_current_barber(current_user)
    db = get_database()
    
    # Get service
    service = await db.services.find_one({"_id": service_id})
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    # Verify shop ownership
    shop = await db.barber_shops.find_one({
        "_id": service["shop_id"],
        "barber_id": user.id
    })
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update service
    update_data = {k: v for k, v in request_data.dict().items() if v is not None}
    await db.services.update_one({"_id": service_id}, {"$set": update_data})
    
    return {"success": True, "message": "Service updated"}

@router.delete("/{service_id}")
async def delete_service(service_id: str, current_user: Request):
    """Delete a service"""
    user = await get_current_barber(current_user)
    db = get_database()
    
    # Get service
    service = await db.services.find_one({"_id": service_id})
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    # Verify shop ownership
    shop = await db.barber_shops.find_one({
        "_id": service["shop_id"],
        "barber_id": user.id
    })
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    await db.services.delete_one({"_id": service_id})
    return {"success": True, "message": "Service deleted"}
