from fastapi import APIRouter, HTTPException, Response, Header, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone, timedelta
from database import get_database
from models import User, UserSession, UserRole
import requests
import os
import uuid

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

class SessionIDRequest(BaseModel):
    session_id: str

class UsernameLoginRequest(BaseModel):
    username: str

class RegisterRequest(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER

@router.post("/oauth/session")
async def process_google_oauth(request: SessionIDRequest, response: Response):
    """
    Process Google OAuth session ID from Emergent Auth
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
            # Create new user
            user_id = f"user_{uuid.uuid4().hex}"
            new_user = {
                "_id": user_id,
                "email": user_data["email"],
                "name": user_data["name"],
                "picture": user_data.get("picture"),
                "role": UserRole.CUSTOMER.value,
                "username": None,
                "phone": None,
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
            max_age=7 * 24 * 60 * 60,  # 7 days
            path="/"
        )
        
        return {
            "success": True,
            "user": {
                "id": user_id,
                "email": user_data["email"],
                "name": user_data["name"],
                "picture": user_data.get("picture"),
                "role": existing_user.get("role") if existing_user else UserRole.CUSTOMER.value
            }
        }
        
    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to authenticate with Google"
        )

@router.post("/username/login")
async def login_with_username(request: UsernameLoginRequest, response: Response):
    """
    Login with username (for returning users)
    """
    db = get_database()
    
    # Find user by username
    user = await db.users.find_one({"username": request.username})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
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
        "user": {
            "id": user["_id"],
            "email": user.get("email"),
            "name": user["name"],
            "username": user["username"],
            "role": user["role"]
        }
    }

@router.post("/register")
async def register_user(request: RegisterRequest, response: Response):
    """
    Register a new user with username
    """
    db = get_database()
    
    # Check if username exists
    existing_user = await db.users.find_one({"username": request.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Check if email exists (if provided)
    if request.email:
        existing_email = await db.users.find_one({"email": request.email})
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Create new user
    user_id = f"user_{uuid.uuid4().hex}"
    new_user = {
        "_id": user_id,
        "username": request.username,
        "email": request.email,
        "name": request.name,
        "phone": request.phone,
        "role": request.role.value,
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
            "username": request.username,
            "email": request.email,
            "name": request.name,
            "role": request.role.value
        }
    }

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
