"""
Posts API endpoints.

Handles CRUD operations for blog posts using raw SQL queries.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.db.database import execute_query, execute_query_one, execute_command

router = APIRouter()

# Pydantic Models
class PostBase(BaseModel):
    title: str
    content: str
    category_id: Optional[int] = None

class PostCreate(PostBase):
    user_id: int

class PostUpdate(PostBase):
    title: Optional[str] = None
    content: Optional[str] = None

class PostResponse(PostBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

@router.get("/", response_model=List[PostResponse])
async def get_posts(skip: int = 0, limit: int = 100):
    """Get all posts with pagination."""
    query = """
        SELECT p.id, p.title, p.content, p.user_id, p.category_id,
               p.created_at, p.updated_at
        FROM posts p
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $1
    """
    posts = await execute_query(query, skip, limit)
    return posts

@router.get("/{post_id}", response_model=PostResponse)
async def get_post(post_id: int):
    """Get a specific post by ID."""
    query = """
        SELECT p.id, p.title, p.content, p.user_id, p.category_id,
               p.created_at, p.updated_at
        FROM posts p
        WHERE p.id = $1
    """
    post = await execute_query_one(query, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.post("/", response_model=PostResponse)
async def create_post(post: PostCreate):
    """Create a new post."""
    query = """
        INSERT INTO posts (title, content, user_id, category_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, title, content, user_id, category_id, created_at, updated_at
    """
    try:
        result = await execute_query_one(
            query, post.title, post.content, post.user_id, post.category_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{post_id}", response_model=PostResponse)
async def update_post(post_id: int, post: PostUpdate):
    """Update an existing post."""
    # First check if post exists
    existing_post = await execute_query_one(
        "SELECT id FROM posts WHERE id = $1", post_id
    )
    if not existing_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Build dynamic update query
    update_fields = []
    values = []
    param_index = 1
    
    if post.title is not None:
        update_fields.append(f"title = ${param_index}")
        values.append(post.title)
        param_index += 1
        
    if post.content is not None:
        update_fields.append(f"content = ${param_index}")
        values.append(post.content)
        param_index += 1
        
    if post.category_id is not None:
        update_fields.append(f"category_id = ${param_index}")
        values.append(post.category_id)
        param_index += 1
    
    update_fields.append(f"updated_at = ${param_index}")
    values.append("NOW()")
    values.append(post_id)
    
    query = f"""
        UPDATE posts 
        SET {', '.join(update_fields)}
        WHERE id = ${param_index + 1}
        RETURNING id, title, content, user_id, category_id, created_at, updated_at
    """
    
    try:
        result = await execute_query_one(query, *values)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{post_id}")
async def delete_post(post_id: int):
    """Delete a post."""
    result = await execute_command(
        "DELETE FROM posts WHERE id = $1", post_id
    )
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post deleted successfully"}