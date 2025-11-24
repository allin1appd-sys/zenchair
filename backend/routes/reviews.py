from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from typing import List
from datetime import datetime
from database import get_database
from dependencies import get_current_user
import uuid

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])

class CreateReviewRequest(BaseModel):
    shop_id: str
    rating: int  # 1-5
    comment: str

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_review(
    request_data: CreateReviewRequest,
    current_user: Request
):
    """Create a review for a shop"""
    user = await get_current_user(current_user)
    db = get_database()
    
    # Validate rating
    if request_data.rating < 1 or request_data.rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be between 1 and 5"
        )
    
    # Check if shop exists
    shop = await db.barber_shops.find_one({"_id": request_data.shop_id})
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
    # Check if user already reviewed
    existing_review = await db.reviews.find_one({
        "shop_id": request_data.shop_id,
        "customer_id": user.id
    })
    
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this shop"
        )
    
    # Create review
    review_id = f"review_{uuid.uuid4().hex}"
    review_data = {
        "_id": review_id,
        "shop_id": request_data.shop_id,
        "customer_id": user.id,
        "rating": request_data.rating,
        "comment": request_data.comment,
        "created_at": datetime.utcnow()
    }
    
    await db.reviews.insert_one(review_data)
    
    # Update shop rating
    all_reviews = await db.reviews.find({"shop_id": request_data.shop_id}).to_list(1000)
    avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
    
    await db.barber_shops.update_one(
        {"_id": request_data.shop_id},
        {
            "$set": {
                "rating": round(avg_rating, 1),
                "total_reviews": len(all_reviews)
            }
        }
    )
    
    return {"success": True, "review_id": review_id}

@router.get("/shop/{shop_id}")
async def get_shop_reviews(shop_id: str):
    """Get all reviews for a shop"""
    db = get_database()
    
    reviews = await db.reviews.find({"shop_id": shop_id}).to_list(1000)
    
    # Enrich with customer info
    for review in reviews:
        customer = await db.users.find_one({"_id": review["customer_id"]})
        if customer:
            review["customer_name"] = customer["name"]
            review["customer_picture"] = customer.get("picture")
    
    return reviews
