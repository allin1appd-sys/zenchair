from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from database import get_database
from dependencies import get_current_barber
import uuid

router = APIRouter(prefix="/api/products", tags=["Products"])

class CreateProductRequest(BaseModel):
    name: str
    description: str
    price: float
    image: Optional[str] = None  # base64
    quantity: int = 0

class UpdateProductRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    quantity: Optional[int] = None

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_product(
    shop_id: str,
    request_data: CreateProductRequest,
    current_user: Request
):
    """Create a new product"""
    user = await get_current_barber(current_user)
    db = get_database()
    
    # Verify shop ownership
    shop = await db.barber_shops.find_one({"_id": shop_id, "barber_id": user.id})
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found or access denied"
        )
    
    product_id = f"product_{uuid.uuid4().hex}"
    product_data = {
        "_id": product_id,
        "shop_id": shop_id,
        **request_data.dict(),
        "created_at": datetime.utcnow()
    }
    
    await db.products.insert_one(product_data)
    return {"success": True, "product_id": product_id}

@router.get("/shop/{shop_id}")
async def get_shop_products(shop_id: str):
    """Get all products for a shop"""
    db = get_database()
    products = await db.products.find({"shop_id": shop_id}).to_list(100)
    return products

@router.put("/{product_id}")
async def update_product(
    product_id: str,
    request_data: UpdateProductRequest,
    current_user: Request
):
    """Update a product"""
    user = await get_current_barber(current_user)
    db = get_database()
    
    # Get product
    product = await db.products.find_one({"_id": product_id})
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Verify shop ownership
    shop = await db.barber_shops.find_one({
        "_id": product["shop_id"],
        "barber_id": user.id
    })
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update product
    update_data = {k: v for k, v in request_data.dict().items() if v is not None}
    await db.products.update_one({"_id": product_id}, {"$set": update_data})
    
    return {"success": True, "message": "Product updated"}

@router.delete("/{product_id}")
async def delete_product(product_id: str, current_user: Request):
    """Delete a product"""
    user = await get_current_barber(current_user)
    db = get_database()
    
    # Get product
    product = await db.products.find_one({"_id": product_id})
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Verify shop ownership
    shop = await db.barber_shops.find_one({
        "_id": product["shop_id"],
        "barber_id": user.id
    })
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    await db.products.delete_one({"_id": product_id})
    return {"success": True, "message": "Product deleted"}
