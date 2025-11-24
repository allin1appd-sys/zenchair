from fastapi import HTTPException, status, Request
from typing import Optional
from datetime import datetime, timezone
import os
from database import get_database
from models import User

async def get_current_user(request: Request) -> User:
    """
    Get current user from session token
    Checks cookies first, then Authorization header
    """
    db = get_database()
    
    # Check cookies first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Find session
    session = await db.user_sessions.find_one({
        "session_token": session_token
    })
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session"
        )
    
    # Check expiration
    if session["expires_at"] < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": session_token})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired"
        )
    
    # Get user
    user_doc = await db.users.find_one({"_id": session["user_id"]})
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return User(**user_doc)

async def get_current_barber(request: Request) -> User:
    """Get current user and verify they are a barber"""
    user = await get_current_user(request)
    
    if user.role != "barber":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only barbers can access this resource"
        )
    
    return user

async def get_current_admin(request: Request) -> User:
    """Get current user and verify they are an admin"""
    user = await get_current_user(request)
    
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this resource"
        )
    
    return user
