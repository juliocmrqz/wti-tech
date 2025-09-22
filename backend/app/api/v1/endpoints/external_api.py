"""
External API integration endpoints.

Handles integration with JSONPlaceholder API and other external services.
This provides a proxy layer for external API calls with caching and error handling.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import aiohttp
import asyncio
from datetime import datetime, timedelta
import json
from app.core.config import settings
from app.db.database import execute_query, execute_query_one, execute_command

router = APIRouter()

# In-memory cache for external API responses (in production, use Redis)
_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL = timedelta(minutes=15)  # 15 minutes cache

class ExternalPost(BaseModel):
    id: int
    title: str
    body: str
    userId: int

class ExternalComment(BaseModel):
    id: int
    postId: int
    name: str
    email: str
    body: str

class ExternalUser(BaseModel):
    id: int
    name: str
    username: str
    email: str
    phone: str
    website: str

def _is_cache_valid(cache_entry: Dict[str, Any]) -> bool:
    """Check if cache entry is still valid."""
    cached_at = cache_entry.get("cached_at")
    if not cached_at:
        return False
    return datetime.now() - cached_at < CACHE_TTL

def _get_from_cache(key: str) -> Optional[Any]:
    """Get data from cache if valid."""
    if key in _cache and _is_cache_valid(_cache[key]):
        return _cache[key]["data"]
    return None

def _set_cache(key: str, data: Any) -> None:
    """Set data in cache with timestamp."""
    _cache[key] = {
        "data": data,
        "cached_at": datetime.now()
    }

async def _make_external_request(url: str) -> Dict[str, Any]:
    """Make HTTP request to external API with error handling."""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise HTTPException(
                        status_code=response.status,
                        detail=f"External API error: {response.status}"
                    )
    except aiohttp.ClientTimeout:
        raise HTTPException(status_code=408, detail="External API timeout")
    except aiohttp.ClientError as e:
        raise HTTPException(status_code=503, detail=f"External API unavailable: {str(e)}")

@router.get("/posts", response_model=List[ExternalPost])
async def get_external_posts(limit: int = 20, user_id: Optional[int] = None):
    """Get posts from JSONPlaceholder API with caching."""
    cache_key = f"posts_{limit}_{user_id}"
    
    # Try cache first
    cached_data = _get_from_cache(cache_key)
    if cached_data:
        return cached_data
    
    # Build URL
    url = f"{settings.EXTERNAL_API_BASE_URL}/posts"
    if user_id:
        url += f"?userId={user_id}"
    
    # Fetch from external API
    data = await _make_external_request(url)
    
    # Limit results
    if isinstance(data, list):
        data = data[:limit]
    
    # Cache the result
    _set_cache(cache_key, data)
    
    return data

@router.get("/posts/{post_id}", response_model=ExternalPost)
async def get_external_post(post_id: int):
    """Get a specific post from JSONPlaceholder API."""
    cache_key = f"post_{post_id}"
    
    # Try cache first
    cached_data = _get_from_cache(cache_key)
    if cached_data:
        return cached_data
    
    # Fetch from external API
    url = f"{settings.EXTERNAL_API_BASE_URL}/posts/{post_id}"
    data = await _make_external_request(url)
    
    # Cache the result
    _set_cache(cache_key, data)
    
    return data

@router.get("/posts/{post_id}/comments", response_model=List[ExternalComment])
async def get_external_post_comments(post_id: int):
    """Get comments for a specific post from JSONPlaceholder API."""
    cache_key = f"post_comments_{post_id}"
    
    # Try cache first
    cached_data = _get_from_cache(cache_key)
    if cached_data:
        return cached_data
    
    # Fetch from external API
    url = f"{settings.EXTERNAL_API_BASE_URL}/posts/{post_id}/comments"
    data = await _make_external_request(url)
    
    # Cache the result
    _set_cache(cache_key, data)
    
    return data

@router.get("/users", response_model=List[ExternalUser])
async def get_external_users(limit: int = 10):
    """Get users from JSONPlaceholder API."""
    cache_key = f"users_{limit}"
    
    # Try cache first
    cached_data = _get_from_cache(cache_key)
    if cached_data:
        return cached_data
    
    # Fetch from external API
    url = f"{settings.EXTERNAL_API_BASE_URL}/users"
    data = await _make_external_request(url)
    
    # Limit results
    if isinstance(data, list):
        data = data[:limit]
    
    # Cache the result
    _set_cache(cache_key, data)
    
    return data

@router.get("/users/{user_id}", response_model=ExternalUser)
async def get_external_user(user_id: int):
    """Get a specific user from JSONPlaceholder API."""
    cache_key = f"user_{user_id}"
    
    # Try cache first
    cached_data = _get_from_cache(cache_key)
    if cached_data:
        return cached_data
    
    # Fetch from external API
    url = f"{settings.EXTERNAL_API_BASE_URL}/users/{user_id}"
    data = await _make_external_request(url)
    
    # Cache the result
    _set_cache(cache_key, data)
    
    return data

@router.post("/sync/posts")
async def sync_external_posts(background_tasks: BackgroundTasks, user_id: int):
    """Sync external posts to local database for a specific user."""
    async def sync_posts_background():
        try:
            # Get external posts for the user
            url = f"{settings.EXTERNAL_API_BASE_URL}/posts?userId={user_id}"
            external_posts = await _make_external_request(url)
            
            # Check if local user exists
            local_user = await execute_query_one(
                "SELECT id FROM users WHERE id = $1", user_id
            )
            if not local_user:
                return
            
            # Sync each post
            for ext_post in external_posts:
                # Check if post already synced
                existing = await execute_query_one(
                    "SELECT id FROM posts WHERE external_post_id = $1",
                    ext_post["id"]
                )
                
                if not existing:
                    # Insert new post
                    await execute_command("""
                        INSERT INTO posts (title, content, user_id, external_post_id, is_published, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, true, NOW(), NOW())
                    """, ext_post["title"], ext_post["body"], user_id, ext_post["id"])
                    
        except Exception as e:
            # Log error in production
            print(f"Background sync error: {e}")
    
    background_tasks.add_task(sync_posts_background)
    return {"message": "Sync started in background"}

@router.post("/sync/comments/{post_id}")
async def sync_external_comments(post_id: int, background_tasks: BackgroundTasks):
    """Sync external comments for a specific post."""
    async def sync_comments_background():
        try:
            # Check if local post exists
            local_post = await execute_query_one(
                "SELECT id, external_post_id FROM posts WHERE id = $1",
                post_id
            )
            if not local_post or not local_post.get("external_post_id"):
                return
            
            # Get external comments
            url = f"{settings.EXTERNAL_API_BASE_URL}/posts/{local_post['external_post_id']}/comments"
            external_comments = await _make_external_request(url)
            
            # Sync each comment
            for ext_comment in external_comments:
                # Check if comment already synced
                existing = await execute_query_one(
                    "SELECT id FROM comments WHERE external_comment_id = $1",
                    ext_comment["id"]
                )
                
                if not existing:
                    # Create a placeholder user for external comment if needed
                    comment_user = await execute_query_one(
                        "SELECT id FROM users WHERE email = $1",
                        ext_comment["email"]
                    )
                    
                    if not comment_user:
                        # Create external user
                        comment_user = await execute_query_one("""
                            INSERT INTO users (username, email, first_name, last_name, password_hash, created_at, updated_at)
                            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                            RETURNING id
                        """, 
                        ext_comment["email"].split("@")[0],  # username from email
                        ext_comment["email"],
                        ext_comment["name"].split()[0] if " " in ext_comment["name"] else ext_comment["name"],
                        ext_comment["name"].split()[-1] if " " in ext_comment["name"] else "",
                        "external_user"  # placeholder password hash
                        )
                    
                    # Insert comment
                    await execute_command("""
                        INSERT INTO comments (content, user_id, post_id, external_comment_id, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, NOW(), NOW())
                    """, ext_comment["body"], comment_user["id"], post_id, ext_comment["id"])
                    
        except Exception as e:
            # Log error in production
            print(f"Background comment sync error: {e}")
    
    background_tasks.add_task(sync_comments_background)
    return {"message": "Comment sync started in background"}

@router.get("/cache/stats")
async def get_cache_stats():
    """Get cache statistics for monitoring."""
    total_entries = len(_cache)
    valid_entries = sum(1 for entry in _cache.values() if _is_cache_valid(entry))
    
    return {
        "total_entries": total_entries,
        "valid_entries": valid_entries,
        "expired_entries": total_entries - valid_entries,
        "cache_ttl_minutes": CACHE_TTL.total_seconds() / 60
    }

@router.delete("/cache")
async def clear_cache():
    """Clear the entire cache."""
    global _cache
    _cache.clear()
    return {"message": "Cache cleared successfully"}