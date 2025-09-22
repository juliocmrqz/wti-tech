"""
Users API endpoints.

Handles CRUD operations for users using raw SQL queries.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from passlib.context import CryptContext
from app.db.database import execute_query, execute_query_one, execute_command

router = APIRouter()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pydantic Models
class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

class UserWithStats(UserResponse):
    total_posts: int
    total_comments: int

def hash_password(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password."""
    return pwd_context.verify(plain_password, hashed_password)

@router.get("/", response_model=List[UserResponse])
async def get_users(skip: int = 0, limit: int = 100, active_only: bool = True):
    """Get all users with pagination."""
    query = """
        SELECT u.id, u.username, u.email, u.first_name, u.last_name,
               u.is_active, u.created_at, u.updated_at
        FROM users u
        WHERE ($3 = false OR u.is_active = true)
        ORDER BY u.created_at DESC
        LIMIT $2 OFFSET $1
    """
    users = await execute_query(query, skip, limit, active_only)
    return users

@router.get("/{user_id}", response_model=UserWithStats)
async def get_user(user_id: int):
    """Get a specific user by ID with statistics."""
    query = """
        SELECT u.id, u.username, u.email, u.first_name, u.last_name,
               u.is_active, u.created_at, u.updated_at,
               COUNT(DISTINCT p.id) as total_posts,
               COUNT(DISTINCT c.id) as total_comments
        FROM users u
        LEFT JOIN posts p ON u.id = p.user_id
        LEFT JOIN comments c ON u.id = c.user_id
        WHERE u.id = $1
        GROUP BY u.id, u.username, u.email, u.first_name, u.last_name,
                 u.is_active, u.created_at, u.updated_at
    """
    user = await execute_query_one(query, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/username/{username}", response_model=UserResponse)
async def get_user_by_username(username: str):
    """Get a user by username."""
    query = """
        SELECT u.id, u.username, u.email, u.first_name, u.last_name,
               u.is_active, u.created_at, u.updated_at
        FROM users u
        WHERE u.username = $1 AND u.is_active = true
    """
    user = await execute_query_one(query, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/", response_model=UserResponse)
async def create_user(user: UserCreate):
    """Create a new user."""
    # Check if username or email already exists
    existing_user = await execute_query_one(
        "SELECT id FROM users WHERE username = $1 OR email = $2",
        user.username, user.email
    )
    if existing_user:
        raise HTTPException(
            status_code=400, 
            detail="Username or email already registered"
        )
    
    # Hash the password
    hashed_password = hash_password(user.password)
    
    query = """
        INSERT INTO users (username, email, first_name, last_name, password_hash, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, username, email, first_name, last_name, is_active, created_at, updated_at
    """
    try:
        result = await execute_query_one(
            query, user.username, user.email, user.first_name, 
            user.last_name, hashed_password
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user: UserUpdate):
    """Update an existing user."""
    # First check if user exists
    existing_user = await execute_query_one(
        "SELECT id FROM users WHERE id = $1", user_id
    )
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build dynamic update query
    update_fields = []
    values = []
    param_index = 1
    
    if user.username is not None:
        # Check if username is already taken by another user
        username_check = await execute_query_one(
            "SELECT id FROM users WHERE username = $1 AND id != $2",
            user.username, user_id
        )
        if username_check:
            raise HTTPException(status_code=400, detail="Username already taken")
        
        update_fields.append(f"username = ${param_index}")
        values.append(user.username)
        param_index += 1
        
    if user.email is not None:
        # Check if email is already taken by another user
        email_check = await execute_query_one(
            "SELECT id FROM users WHERE email = $1 AND id != $2",
            user.email, user_id
        )
        if email_check:
            raise HTTPException(status_code=400, detail="Email already taken")
        
        update_fields.append(f"email = ${param_index}")
        values.append(user.email)
        param_index += 1
        
    if user.first_name is not None:
        update_fields.append(f"first_name = ${param_index}")
        values.append(user.first_name)
        param_index += 1
        
    if user.last_name is not None:
        update_fields.append(f"last_name = ${param_index}")
        values.append(user.last_name)
        param_index += 1
        
    if user.is_active is not None:
        update_fields.append(f"is_active = ${param_index}")
        values.append(user.is_active)
        param_index += 1
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_fields.append(f"updated_at = NOW()")
    values.append(user_id)
    
    query = f"""
        UPDATE users 
        SET {', '.join(update_fields)}
        WHERE id = ${param_index}
        RETURNING id, username, email, first_name, last_name, is_active, created_at, updated_at
    """
    
    try:
        result = await execute_query_one(query, *values)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{user_id}")
async def delete_user(user_id: int, hard_delete: bool = False):
    """Delete a user (soft delete by default)."""
    if hard_delete:
        # Hard delete - actually remove from database
        result = await execute_command(
            "DELETE FROM users WHERE id = $1", user_id
        )
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "User permanently deleted"}
    else:
        # Soft delete - just mark as inactive
        result = await execute_command(
            "UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1",
            user_id
        )
        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "User deactivated"}

@router.get("/{user_id}/posts")
async def get_user_posts(user_id: int, skip: int = 0, limit: int = 20):
    """Get all posts by a specific user."""
    query = """
        SELECT p.id, p.title, p.content, p.user_id, p.category_id,
               p.is_published, p.created_at, p.updated_at,
               c.name as category_name
        FROM posts p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.user_id = $1
        ORDER BY p.created_at DESC
        LIMIT $3 OFFSET $2
    """
    posts = await execute_query(query, user_id, skip, limit)
    return posts

@router.get("/{user_id}/activity")
async def get_user_activity(user_id: int):
    """Get user activity summary using stored procedure."""
    query = "SELECT * FROM get_user_activity_summary($1)"
    activity = await execute_query_one(query, user_id)
    if not activity:
        raise HTTPException(status_code=404, detail="User not found")
    return activity