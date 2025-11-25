from fastapi import APIRouter, HTTPException, Response, Header, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone, timedelta
from database import get_database
from models import User, UserSession, UserRole
import requests
import os
import uuid
import bcrypt

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

# Barber Registration (email, username, password)
class BarberRegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    name: str
    phone: Optional[str] = None

class BarberLoginRequest(BaseModel):
    username: str
    password: str

class SessionIDRequest(BaseModel):
    session_id: str

# Hash password
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

@router.post("/barber/register")
async def register_barber(request: BarberRegisterRequest, response: Response):
    """
    Register a new barber with email, username, and password
    """
    db = get_database()
    
    # Check if email exists
    existing_email = await db.users.find_one({"email": request.email})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username exists
    existing_username = await db.users.find_one({"username": request.username})
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Hash password
    password_hash = hash_password(request.password)
    
    # Create new barber user
    user_id = f"user_{uuid.uuid4().hex}"
    new_user = {
        "_id": user_id,
        "email": request.email,
        "username": request.username,
        "password_hash": password_hash,
        "name": request.name,
        "phone": request.phone,
        "role": UserRole.BARBER.value,
        "picture": None,
        "created_at": datetime.now(timezone.utc)
    }
    await db.users.insert_one(new_user)
    
    # Generate session token
    session_token = f"session_{uuid.uuid4().hex}"
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set httpOnly cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return {
        "success": True,
        "session_token": session_token,
        "user": {
            "id": user_id,
            "email": request.email,
            "username": request.username,
            "name": request.name,
            "role": UserRole.BARBER.value
        }
    }

@router.post("/barber/login")
async def login_barber(request: BarberLoginRequest, response: Response):
    """
    Login barber with username and password
    """
    db = get_database()
    
    # Find user by username
    user = await db.users.find_one({"username": request.username})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify password
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    
    # Generate new session token
    session_token = f"session_{uuid.uuid4().hex}"
    session_doc = {
        "user_id": user["_id"],
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set httpOnly cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return {
        "success": True,
        "session_token": session_token,
        "user": {
            "id": user["_id"],
            "email": user.get("email"),
            "name": user["name"],
            "username": user["username"],
            "role": user["role"]
        }
    }

@router.post("/barber/oauth/session")
async def barber_google_oauth(request: SessionIDRequest, response: Response):
    """
    Process Google OAuth for barbers
    """
    db = get_database()
    
    try:
        # Get user data from Emergent Auth
        headers = {"X-Session-ID": request.session_id}
        auth_response = requests.get(EMERGENT_AUTH_URL, headers=headers, timeout=10)
        
        if auth_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid session ID"
            )
        
        user_data = auth_response.json()
        session_token = user_data.get("session_token")
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": user_data["email"]})
        
        if existing_user:
            user_id = existing_user["_id"]
        else:
            # Create new barber user
            user_id = f"user_{uuid.uuid4().hex}"
            new_user = {
                "_id": user_id,
                "email": user_data["email"],
                "name": user_data["name"],
                "picture": user_data.get("picture"),
                "role": UserRole.BARBER.value,
                "username": user_data["email"].split('@')[0],  # Default username from email
                "phone": None,
                "password_hash": None,  # OAuth users don't have password
                "created_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(new_user)
        
        # Store session in database
        session_doc = {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc)
        }
        await db.user_sessions.insert_one(session_doc)
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,
            path="/"
        )
        
        return {
            "success": True,
            "session_token": session_token,
            "user": {
                "id": user_id,
                "email": user_data["email"],
                "name": user_data["name"],
                "picture": user_data.get("picture"),
                "role": existing_user.get("role") if existing_user else UserRole.BARBER.value
            }
        }
        
    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to authenticate with Google"
        )

@router.get("/me")
async def get_current_user_info(authorization: Optional[str] = Header(None)):
    """
    Get current user information
    """
    db = get_database()
    
    # Get session token from header
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    session_token = authorization.replace("Bearer ", "")
    
    # Find session
    session = await db.user_sessions.find_one({"session_token": session_token})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session"
        )
    
    # Check expiration
    if session["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired"
        )
    
    # Get user
    user = await db.users.find_one({"_id": session["user_id"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "id": user["_id"],
        "email": user.get("email"),
        "name": user["name"],
        "username": user.get("username"),
        "phone": user.get("phone"),
        "picture": user.get("picture"),
        "role": user["role"]
    }

@router.post("/logout")
async def logout(authorization: Optional[str] = Header(None), response: Response = None):
    """
    Logout user and clear session
    """
    db = get_database()
    
    if authorization and authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")
        await db.user_sessions.delete_one({"session_token": session_token})
    
    # Clear cookie
    if response:
        response.delete_cookie(key="session_token", path="/")
    
    return {"success": True, "message": "Logged out successfully"}
