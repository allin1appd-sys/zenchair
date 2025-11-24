from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    CUSTOMER = "customer"
    BARBER = "barber"
    ADMIN = "admin"

class User(BaseModel):
    id: str = Field(alias="_id")
    email: EmailStr
    name: str
    picture: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER
    phone: Optional[str] = None
    username: Optional[str] = None  # For username-based login
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WorkingHours(BaseModel):
    day: int  # 0-6 (Monday-Sunday)
    open_time: str  # "09:00"
    close_time: str  # "18:00"
    is_closed: bool = False

class Location(BaseModel):
    address: str
    city: str
    latitude: float
    longitude: float

class BarberShop(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    barber_id: str  # Owner user ID
    name: str
    description: str
    location: Location
    phone: str
    email: EmailStr
    rating: float = 0.0
    total_reviews: int = 0
    gallery_images: List[str] = []  # base64 encoded images
    working_hours: List[WorkingHours] = []
    is_open: bool = True
    vacation_dates: List[str] = []  # ["2025-01-15", "2025-01-16"]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class Service(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    shop_id: str
    name: str
    description: str
    price: float  # in ILS
    duration: int  # in minutes
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class Product(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    shop_id: str
    name: str
    description: str
    price: float  # in ILS
    image: Optional[str] = None  # base64 encoded
    quantity: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class Booking(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    shop_id: str
    customer_id: str
    barber_id: str
    service_ids: List[str]
    product_ids: List[str] = []
    date: str  # "2025-01-15"
    time: str  # "10:00"
    status: BookingStatus = BookingStatus.PENDING
    total_price: float
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class Review(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    shop_id: str
    customer_id: str
    rating: int  # 1-5
    comment: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    PAYMENT_FAILED = "payment_failed"

class Subscription(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    barber_id: str
    plan: str  # "monthly" or "yearly"
    price: float  # 500 for monthly
    status: SubscriptionStatus = SubscriptionStatus.ACTIVE
    start_date: datetime
    renewal_date: datetime
    tranzila_standing_order_id: Optional[str] = None
    payment_token: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
