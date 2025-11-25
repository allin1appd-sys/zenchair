from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from database import get_database
from dependencies import get_current_user, get_current_barber
from models import Booking, BookingStatus
import uuid
from ws_handler import notify_new_booking, notify_booking_cancelled, notify_booking_updated

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])

class CreateBookingRequest(BaseModel):
    shop_id: str
    service_ids: List[str]
    product_ids: List[str] = []
    date: str  # "2025-01-15"
    time: str  # "10:00"
    customer_name: str  # Customer provides at booking
    customer_phone: str  # Customer provides at booking
    notes: Optional[str] = None

class UpdateBookingStatusRequest(BaseModel):
    status: BookingStatus

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_booking(
    request_data: CreateBookingRequest,
    current_user: Request = None
):
    """Create a new booking (customers don't need auth)"""
    db = get_database()
    
    # Try to get authenticated user, but allow anonymous customers
    customer_id = "guest"
    try:
        if current_user:
            user = await get_current_user(current_user)
            customer_id = user.id
    except:
        # Customer is not authenticated, that's OK
        pass
    
    # Get shop
    shop = await db.barber_shops.find_one({"_id": request_data.shop_id})
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
    # Validate services
    services = await db.services.find({
        "_id": {"$in": request_data.service_ids},
        "shop_id": request_data.shop_id
    }).to_list(100)
    
    if len(services) != len(request_data.service_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid service IDs"
        )
    
    # Validate products
    if request_data.product_ids:
        products = await db.products.find({
            "_id": {"$in": request_data.product_ids},
            "shop_id": request_data.shop_id
        }).to_list(100)
        
        if len(products) != len(request_data.product_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid product IDs"
            )
    else:
        products = []
    
    # Check if date is within 7 days
    booking_date = datetime.strptime(request_data.date, "%Y-%m-%d")
    today = datetime.utcnow().date()
    max_date = today + timedelta(days=7)
    
    if booking_date.date() < today or booking_date.date() > max_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bookings can only be made within the next 7 days"
        )
    
    # Check for conflicts
    existing_booking = await db.bookings.find_one({
        "shop_id": request_data.shop_id,
        "date": request_data.date,
        "time": request_data.time,
        "status": {"$in": ["pending", "confirmed"]}
    })
    
    if existing_booking:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Time slot already booked"
        )
    
    # Calculate total price
    total_price = sum(s["price"] for s in services) + sum(p["price"] for p in products)
    
    # Create booking
    booking_id = f"booking_{uuid.uuid4().hex}"
    booking_data = {
        "_id": booking_id,
        "shop_id": request_data.shop_id,
        "customer_id": customer_id,
        "customer_name": request_data.customer_name,
        "customer_phone": request_data.customer_phone,
        "barber_id": shop["barber_id"],
        "service_ids": request_data.service_ids,
        "product_ids": request_data.product_ids,
        "date": request_data.date,
        "time": request_data.time,
        "status": BookingStatus.PENDING.value,
        "total_price": total_price,
        "notes": request_data.notes,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.bookings.insert_one(booking_data)
    
    # Notify barber via WebSocket
    await notify_new_booking(request_data.shop_id, {
        "booking_id": booking_id,
        "customer_name": request_data.customer_name,
        "customer_phone": request_data.customer_phone,
        "date": request_data.date,
        "time": request_data.time,
        "services": [s["name"] for s in services],
        "total_price": total_price
    })
    
    return {
        "success": True,
        "booking_id": booking_id,
        "message": "Booking created successfully"
    }

@router.get("/my")
async def get_my_bookings(current_user: Request):
    """Get current user's bookings"""
    user = await get_current_user(current_user)
    db = get_database()
    
    bookings = await db.bookings.find({"customer_id": user.id}).to_list(100)
    
    # Enrich with shop and service details
    for booking in bookings:
        shop = await db.barber_shops.find_one({"_id": booking["shop_id"]})
        services = await db.services.find({
            "_id": {"$in": booking["service_ids"]}
        }).to_list(100)
        
        booking["shop"] = shop
        booking["services"] = services
    
    return bookings

@router.get("/shop/{shop_id}")
async def get_shop_bookings(shop_id: str, current_user: Request):
    """Get bookings for a shop (barber only)"""
    user = await get_current_barber(current_user)
    db = get_database()
    
    # Verify ownership
    shop = await db.barber_shops.find_one({"_id": shop_id, "barber_id": user.id})
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found or access denied"
        )
    
    bookings = await db.bookings.find({"shop_id": shop_id}).to_list(1000)
    
    # Enrich with customer and service details
    for booking in bookings:
        customer = await db.users.find_one({"_id": booking["customer_id"]})
        services = await db.services.find({
            "_id": {"$in": booking["service_ids"]}
        }).to_list(100)
        
        booking["customer"] = {
            "name": customer["name"],
            "phone": customer.get("phone"),
            "email": customer.get("email")
        }
        booking["services"] = services
    
    return bookings

@router.get("/available-slots/{shop_id}")
async def get_available_slots(
    shop_id: str,
    date: str  # "2025-01-15"
):
    """Get available time slots for a date"""
    db = get_database()
    
    # Get shop
    shop = await db.barber_shops.find_one({"_id": shop_id})
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
    # Check if shop is on vacation
    if date in shop.get("vacation_dates", []):
        return {"available_slots": [], "message": "Shop closed on this date"}
    
    # Get working hours for the day
    booking_date = datetime.strptime(date, "%Y-%m-%d")
    day_of_week = booking_date.weekday()
    
    working_hours = next(
        (wh for wh in shop.get("working_hours", []) if wh["day"] == day_of_week),
        None
    )
    
    if not working_hours or working_hours.get("is_closed"):
        return {"available_slots": [], "message": "Shop closed on this day"}
    
    # Generate time slots (every 30 minutes)
    open_time = datetime.strptime(working_hours["open_time"], "%H:%M")
    close_time = datetime.strptime(working_hours["close_time"], "%H:%M")
    
    slots = []
    current_time = open_time
    while current_time < close_time:
        slots.append(current_time.strftime("%H:%M"))
        current_time += timedelta(minutes=30)
    
    # Get booked slots
    booked_bookings = await db.bookings.find({
        "shop_id": shop_id,
        "date": date,
        "status": {"$in": ["pending", "confirmed"]}
    }).to_list(1000)
    
    booked_times = [b["time"] for b in booked_bookings]
    
    # Filter available slots
    available_slots = [s for s in slots if s not in booked_times]
    
    return {"available_slots": available_slots}

@router.put("/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    request_data: UpdateBookingStatusRequest,
    current_user: Request
):
    """Update booking status"""
    user = await get_current_user(current_user)
    db = get_database()
    
    # Get booking
    booking = await db.bookings.find_one({"_id": booking_id})
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check authorization
    if booking["customer_id"] != user.id and booking["barber_id"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update status
    await db.bookings.update_one(
        {"_id": booking_id},
        {
            "$set": {
                "status": request_data.status.value,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Notify via WebSocket
    if request_data.status == BookingStatus.CANCELLED:
        await notify_booking_cancelled(booking["shop_id"], booking_id)
    else:
        await notify_booking_updated(booking["shop_id"], {
            "booking_id": booking_id,
            "status": request_data.status.value
        })
    
    return {"success": True, "message": "Booking updated successfully"}

@router.delete("/{booking_id}")
async def cancel_booking(booking_id: str, current_user: Request):
    """Cancel a booking"""
    user = await get_current_user(current_user)
    db = get_database()
    
    # Get booking
    booking = await db.bookings.find_one({"_id": booking_id})
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check authorization
    if booking["customer_id"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update status to cancelled
    await db.bookings.update_one(
        {"_id": booking_id},
        {
            "$set": {
                "status": BookingStatus.CANCELLED.value,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Notify barber
    await notify_booking_cancelled(booking["shop_id"], booking_id)
    
    return {"success": True, "message": "Booking cancelled successfully"}
