# Subscription Routes with Mock Tranzila
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
from database import get_database
from dependencies import get_current_user
from services.tranzila_service import process_tranzila_payment, TranzilaPaymentRequest
import uuid

router = APIRouter(prefix="/api/subscriptions", tags=["Subscriptions"])

class CreateSubscriptionRequest(BaseModel):
    plan: str  # "monthly" or "yearly"

@router.post("/create")
async def create_subscription(
    request_data: CreateSubscriptionRequest,
    current_user: Request
):
    """Create subscription and process payment"""
    user = await get_current_user(current_user)
    db = get_database()
    
    # Verify user is a barber
    if user.role != "barber":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only barbers can subscribe"
        )
    
    # Check if already has active subscription
    existing_sub = await db.subscriptions.find_one({
        "barber_id": user.id,
        "status": "active"
    })
    
    if existing_sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active subscription"
        )
    
    # Calculate price
    prices = {
        "monthly": 500,
        "yearly": 5000
    }
    
    if request_data.plan not in prices:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan"
        )
    
    amount = prices[request_data.plan]
    
    # Process payment with Tranzila (MOCK for now)
    payment_request = TranzilaPaymentRequest(
        amount=amount,
        currency="ILS",
        customer_email=user.email or f"{user.username}@zenchair.app",
        customer_name=user.name,
        plan=request_data.plan
    )
    
    payment_response = process_tranzila_payment(payment_request)
    
    if not payment_response.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment failed"
        )
    
    # Calculate renewal date
    now = datetime.now(timezone.utc)
    if request_data.plan == "monthly":
        renewal_date = now + timedelta(days=30)
    else:
        renewal_date = now + timedelta(days=365)
    
    # Create subscription record
    subscription_id = f"sub_{uuid.uuid4().hex}"
    subscription_doc = {
        "_id": subscription_id,
        "barber_id": user.id,
        "plan": request_data.plan,
        "price": amount,
        "status": "active",
        "start_date": now,
        "renewal_date": renewal_date,
        "tranzila_standing_order_id": payment_response.standing_order_id,
        "payment_token": payment_response.payment_token,
        "transaction_id": payment_response.transaction_id,
        "created_at": now,
        "updated_at": now
    }
    
    await db.subscriptions.insert_one(subscription_doc)
    
    return {
        "success": True,
        "subscription_id": subscription_id,
        "message": payment_response.message,
        "renewal_date": renewal_date.isoformat()
    }

@router.get("/my")
async def get_my_subscription(current_user: Request):
    """Get current user's subscription"""
    user = await get_current_user(current_user)
    db = get_database()
    
    subscription = await db.subscriptions.find_one({
        "barber_id": user.id
    })
    
    if not subscription:
        return None
    
    # Convert dates for JSON
    subscription["start_date"] = subscription["start_date"].isoformat()
    subscription["renewal_date"] = subscription["renewal_date"].isoformat()
    subscription["created_at"] = subscription["created_at"].isoformat()
    subscription["updated_at"] = subscription["updated_at"].isoformat()
    
    return subscription

@router.post("/cancel")
async def cancel_subscription(current_user: Request):
    """Cancel subscription"""
    user = await get_current_user(current_user)
    db = get_database()
    
    subscription = await db.subscriptions.find_one({
        "barber_id": user.id,
        "status": "active"
    })
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    # Cancel with Tranzila (MOCK for now)
    # cancel_tranzila_standing_order(subscription["tranzila_standing_order_id"])
    
    # Update status
    await db.subscriptions.update_one(
        {"_id": subscription["_id"]},
        {
            "$set": {
                "status": "cancelled",
                "cancelled_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"success": True, "message": "Subscription cancelled"}
