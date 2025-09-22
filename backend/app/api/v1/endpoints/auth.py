"""
Authentication endpoints.

Handles user login, registration, and token management.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import timedelta
from app.core.security import (
    create_access_token,
    verify_token,
    hash_password,
    verify_password
)
from app.core.config import settings
from app.db.database import execute_query_one, execute_command

router = APIRouter()
security = HTTPBearer()

# Pydantic Models


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int


class TokenData(BaseModel):
    username: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    password: str


class UserInfo(BaseModel):
    id: int
    username: str
    email: str
    first_name: str
    last_name: str
    is_active: bool


async def get_user_by_username(username: str) -> Optional[dict]:
    """Get user by username from database."""
    query = """
        SELECT id, username, email, first_name, last_name, password_hash, is_active
        FROM users 
        WHERE username = $1
    """
    return await execute_query_one(query, username)


async def authenticate_user(username: str, password: str) -> Optional[dict]:
    """Authenticate user with username and password."""
    user = await get_user_by_username(username)
    if not user:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    if not user["is_active"]:
        return None
    return user


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current user from JWT token."""
    token = credentials.credentials
    payload = verify_token(token)

    username: str = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await get_user_by_username(username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_active_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Get current active user."""
    return current_user


@router.post("/login", response_model=Token)
async def login(login_request: LoginRequest):
    """Authenticate user and return access token."""
    user = await authenticate_user(login_request.username, login_request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "user_id": user["id"]},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.post("/register", response_model=UserInfo)
async def register(register_request: RegisterRequest):
    """Register a new user."""
    # Check if username or email already exists
    existing_user = await execute_query_one(
        "SELECT id FROM users WHERE username = $1 OR email = $2",
        register_request.username, register_request.email
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )

    # Hash password
    hashed_password = hash_password(register_request.password)

    # Create user
    query = """
        INSERT INTO users (username, email, first_name, last_name, password_hash, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, username, email, first_name, last_name, is_active
    """

    try:
        user = await execute_query_one(
            query,
            register_request.username,
            register_request.email,
            register_request.first_name,
            register_request.last_name,
            hashed_password
        )
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}"
        )


@router.get("/me", response_model=UserInfo)
async def get_current_user_info(current_user: dict = Depends(get_current_active_user)):
    """Get current user information."""
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "first_name": current_user["first_name"],
        "last_name": current_user["last_name"],
        "is_active": current_user["is_active"]
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: dict = Depends(get_current_active_user)):
    """Refresh access token for current user."""
    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user["username"], "user_id": current_user["id"]},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_active_user)):
    """Logout user (client should discard token)."""
    return {"message": "Successfully logged out"}
