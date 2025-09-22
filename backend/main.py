from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
from contextlib import asynccontextmanager
import os
import jwt
import databases
import aiohttp
import hashlib
import secrets
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Import validation utilities
from app.core.validation import (
    InputSanitizer,
    UserCreateValidated,
    PostCreateValidated,
    LoginRequestValidated,
    validate_integer_id,
    validate_pagination_params
)

# Load environment variables
load_dotenv()

# Database Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://wtitech_user:wtitech_pass@localhost:5432/wtitech")

# Database connection
database = databases.Database(DATABASE_URL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await database.connect()
    print("✅ Connected to PostgreSQL database")
    yield
    # Shutdown
    await database.disconnect()
    print("🔒 Database connection closed")


# Initialize FastAPI
app = FastAPI(
    title="WTI Tech API",
    description="Simplified N-Tier Application Backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Pydantic Models


class Post(BaseModel):
    id: Optional[int] = None
    title: str
    content: str
    author_name: str
    user_id: int
    created_at: Optional[datetime] = None


class PostCreate(BaseModel):
    title: str
    content: str


class User(BaseModel):
    id: Optional[int] = None
    username: str
    email: str
    first_name: str
    last_name: str


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    first_name: str
    last_name: str


class Token(BaseModel):
    access_token: str
    token_type: str


class LoginRequest(BaseModel):
    username: str
    password: str


class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None

# Keep original models for backward compatibility, but add validation where used
# New validated models are imported from validation.py

# Standardized API Response Models


class APIResponse(BaseModel):
    success: bool
    message: Optional[dict] = None
    additionalData: Optional[str] = None


class APIResponseWithData(BaseModel):
    success: bool
    message: Optional[dict] = None
    additionalData: Optional[str] = None
    data: Optional[dict] = None


class APIResponseWithList(BaseModel):
    success: bool
    message: Optional[dict] = None
    additionalData: Optional[str] = None
    data: Optional[List[dict]] = None


# JWT Configuration
SECRET_KEY = os.getenv(
    "SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def hash_password(password: str) -> str:
    """Hash a password with salt using SHA-256"""
    salt = secrets.token_hex(32)
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}${password_hash}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    print(f"🔍 DEBUG: Verifying password")
    print(f"   Plain password: '{plain_password}'")
    print(f"   Stored hash: '{hashed_password}'")

    try:
        salt, stored_hash = hashed_password.split('$')
        password_hash = hashlib.sha256(
            (plain_password + salt).encode()).hexdigest()
        result = password_hash == stored_hash
        print(f"   Hash verification: {'✅ SUCCESS' if result else '❌ FAILED'}")
        return result
    except ValueError:
        # Handle old plain text passwords for migration
        result = plain_password == hashed_password
        print(
            f"   Plain text comparison: {'✅ SUCCESS' if result else '❌ FAILED'}")
        return result


async def authenticate_user(username: str, password: str):
    """Authenticate user with database data"""
    user = await database.fetch_one(
        "SELECT * FROM users WHERE username = :username", {
            "username": username}
    )
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return dict(user)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = await database.fetch_one(
            "SELECT * FROM users WHERE username = :username", {
                "username": username}
        )
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return dict(user)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Routes


@app.get("/", response_model=APIResponse)
async def root():
    """Health check endpoint."""
    return APIResponse(
        success=True,
        message={"message": "WTI Tech API is running!", "status": "healthy"},
        additionalData=None
    )


@app.get("/health", response_model=APIResponseWithData)
async def health_check():
    """Detailed health check using stored procedures."""
    try:
        # Use stored procedure to get post statistics
        stats = await database.fetch_one("SELECT * FROM get_post_statistics()")
        users_count = await database.fetch_val("SELECT COUNT(*) FROM users")

        return APIResponseWithData(
            success=True,
            message={
                "status": "healthy",
                "service": "wti-tech-backend",
                "version": "1.0.0",
                "posts_count": stats["total_posts"] if stats else 0,
                "users_count": users_count,
                "database": "connected"
            },
            additionalData=None,
            data=None
        )
    except Exception as e:
        return APIResponseWithData(
            success=False,
            message=None,
            additionalData=f"Health check failed: {str(e)}",
            data=None
        )

# Posts endpoints


@app.get("/api/posts", response_model=APIResponseWithList)
async def get_posts(limit: int = 50):
    """Get all posts using stored procedure."""
    try:
        # Validate limit parameter
        validated_limit, _ = validate_pagination_params(limit, 0)

        # Use stored procedure to get recent posts
        posts = await database.fetch_all("SELECT * FROM get_recent_posts(:limit)", {"limit": validated_limit})

        # Convert to list of dictionaries
        result = []
        for post in posts:
            result.append({
                "id": post["id"],
                "title": post["title"],
                "content": post["content"],
                "author_name": post["author_name"],
                "user_id": post["user_id"],
                "created_at": post["created_at"].isoformat() + "Z"
            })

        return APIResponseWithList(
            success=True,
            message=None,
            additionalData=None,
            data=result
        )
    except Exception as e:
        return APIResponseWithList(
            success=False,
            message=None,
            additionalData=f"Failed to fetch posts: {str(e)}",
            data=[]
        )


@app.get("/api/posts/{post_id}", response_model=APIResponseWithData)
async def get_post(post_id: int):
    """Get a specific post."""
    try:
        # Validate post_id
        validated_post_id = validate_integer_id(post_id, "Post ID")

        post = await database.fetch_one("""
            SELECT p.id, p.title, p.content, p.user_id, p.created_at,
                   CONCAT(u.first_name, ' ', u.last_name) as author_name
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = :post_id
        """, {"post_id": validated_post_id})

        if not post:
            return APIResponseWithData(
                success=False,
                message=None,
                additionalData="Post not found",
                data=None
            )

        post_data = {
            "id": post["id"],
            "title": post["title"],
            "content": post["content"],
            "author_name": post["author_name"],
            "user_id": post["user_id"],
            "created_at": post["created_at"].isoformat() + "Z"
        }

        return APIResponseWithData(
            success=True,
            message=post_data,
            additionalData=None,
            data=None
        )
    except Exception as e:
        return APIResponseWithData(
            success=False,
            message=None,
            additionalData=f"Failed to fetch post: {str(e)}",
            data=None
        )


@app.post("/api/posts", response_model=APIResponseWithData)
async def create_post(post: PostCreateValidated, current_user: dict = Depends(get_current_user)):
    """Create a new post using stored procedure."""
    try:
        # Use stored procedure to create post with validation
        result = await database.fetch_one(
            "SELECT * FROM create_post_with_validation(:title, :content, :user_id)",
            {
                "title": post.title,
                "content": post.content,
                "user_id": current_user["id"]
            }
        )

        # Check if the stored procedure succeeded
        if not result["success"]:
            return APIResponseWithData(
                success=False,
                message=None,
                additionalData=result["message"],
                data=None
            )

        # Get the created post details
        new_post = await database.fetch_one("""
            SELECT p.id, p.title, p.content, p.user_id, p.created_at,
                   CONCAT(u.first_name, ' ', u.last_name) as author_name
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = :post_id
        """, {"post_id": result["post_id"]})

        post_data = {
            "id": new_post["id"],
            "title": new_post["title"],
            "content": new_post["content"],
            "author_name": new_post["author_name"],
            "user_id": new_post["user_id"],
            "created_at": new_post["created_at"].isoformat() + "Z"
        }

        return APIResponseWithData(
            success=True,
            message=post_data,
            additionalData=None,
            data=None
        )
    except Exception as e:
        return APIResponseWithData(
            success=False,
            message=None,
            additionalData=f"Failed to create post: {str(e)}",
            data=None
        )


@app.put("/api/posts/{post_id}", response_model=APIResponseWithData)
async def update_post(
    post_id: int,
    post: PostCreateValidated,
    current_user: dict = Depends(get_current_user)
):
    """Update a post."""
    try:
        # Validate post_id
        validated_post_id = validate_integer_id(post_id, "Post ID")

        # Check if post exists and get current info
        existing_post = await database.fetch_one("""
            SELECT p.id, p.title, p.content, p.user_id, p.created_at,
                   CONCAT(u.first_name, ' ', u.last_name) as author_name
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = :post_id
        """, {"post_id": validated_post_id})

        if not existing_post:
            return APIResponseWithData(
                success=False,
                message=None,
                additionalData="Post not found",
                data=None
            )

        # Check if current user is the author of the post
        if existing_post["user_id"] != current_user["id"]:
            return APIResponseWithData(
                success=False,
                message=None,
                additionalData="You can only edit your own posts",
                data=None
            )

        # Update the post
        updated_post = await database.fetch_one("""
            UPDATE posts 
            SET title = :title, content = :content, updated_at = NOW()
            WHERE id = :post_id
            RETURNING id, title, content, user_id, created_at
        """, {
            "title": post.title,
            "content": post.content,
            "post_id": validated_post_id
        })

        post_data = {
            "id": updated_post["id"],
            "title": updated_post["title"],
            "content": updated_post["content"],
            "author_name": existing_post["author_name"],
            "user_id": updated_post["user_id"],
            "created_at": updated_post["created_at"].isoformat() + "Z"
        }

        return APIResponseWithData(
            success=True,
            message=post_data,
            additionalData=None,
            data=None
        )
    except Exception as e:
        return APIResponseWithData(
            success=False,
            message=None,
            additionalData=f"Failed to update post: {str(e)}",
            data=None
        )


@app.delete("/api/posts/{post_id}", response_model=APIResponse)
async def delete_post(post_id: int, current_user: dict = Depends(get_current_user)):
    """Delete a post."""
    try:
        # Validate post_id
        validated_post_id = validate_integer_id(post_id, "Post ID")

        # Check if post exists first
        existing_post = await database.fetch_one(
            "SELECT id, user_id FROM posts WHERE id = :post_id", {
                "post_id": validated_post_id}
        )
        if not existing_post:
            return APIResponse(
                success=False,
                message=None,
                additionalData="Post not found"
            )

        # Check if current user is the author of the post
        if existing_post["user_id"] != current_user["id"]:
            return APIResponse(
                success=False,
                message=None,
                additionalData="You can only delete your own posts"
            )

        # Delete the post
        await database.execute("DELETE FROM posts WHERE id = :post_id", {"post_id": validated_post_id})
        return APIResponse(
            success=True,
            message={"message": "Post deleted successfully"},
            additionalData=None
        )
    except Exception as e:
        return APIResponse(
            success=False,
            message=None,
            additionalData=f"Failed to delete post: {str(e)}"
        )


@app.get("/api/users/{user_id}/posts", response_model=APIResponseWithList)
async def get_user_posts(user_id: int, limit: int = 50):
    """Get posts by a specific user."""
    try:
        # Validate parameters
        validated_user_id = validate_integer_id(user_id, "User ID")
        validated_limit, _ = validate_pagination_params(limit, 0)

        # Get posts by user with author information
        posts = await database.fetch_all("""
            SELECT 
                p.id,
                p.title,
                p.content,
                CONCAT(u.first_name, ' ', u.last_name) as author_name,
                p.user_id,
                p.created_at,
                p.updated_at
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = :user_id
            ORDER BY p.created_at DESC
            LIMIT :limit
        """, {"user_id": validated_user_id, "limit": validated_limit})

        # Convert to list of dictionaries
        result = []
        for post in posts:
            result.append({
                "id": post["id"],
                "title": post["title"],
                "content": post["content"],
                "author_name": post["author_name"],
                "user_id": post["user_id"],
                "created_at": post["created_at"].isoformat() + "Z",
                "updated_at": post["updated_at"].isoformat() + "Z" if post["updated_at"] else None
            })

        return APIResponseWithList(
            success=True,
            message=None,
            additionalData=None,
            data=result
        )
    except Exception as e:
        return APIResponseWithList(
            success=False,
            message=None,
            additionalData=f"Failed to fetch user posts: {str(e)}",
            data=[]
        )

# Auth endpoints


@app.post("/api/auth/register", response_model=APIResponseWithData)
async def register(user: UserCreateValidated):
    """Register a new user."""
    try:
        # Input is already validated by UserCreateValidated model
        # Check if user already exists
        existing_user = await database.fetch_one(
            "SELECT id FROM users WHERE username = :username OR email = :email",
            {"username": user.username, "email": user.email}
        )
        if existing_user:
            return APIResponseWithData(
                success=False,
                message=None,
                additionalData="Username or email already registered",
                data=None
            )

        # Hash the password before storing
        hashed_password = hash_password(user.password)

        # Insert new user
        new_user = await database.fetch_one(
            """
            INSERT INTO users (username, email, first_name, last_name, hashed_password)
            VALUES (:username, :email, :first_name, :last_name, :hashed_password)
            RETURNING id, username, email, first_name, last_name, is_active
            """,
            {
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "hashed_password": hashed_password
            }
        )

        return APIResponseWithData(
            success=True,
            message={
                "id": new_user["id"],
                "username": new_user["username"],
                "email": new_user["email"],
                "first_name": new_user["first_name"],
                "last_name": new_user["last_name"],
                "is_active": new_user["is_active"]
            },
            additionalData=None,
            data=None
        )
    except Exception as e:
        return APIResponseWithData(
            success=False,
            message=None,
            additionalData=f"Registration failed: {str(e)}",
            data=None
        )


@app.post("/api/auth/login", response_model=APIResponseWithData)
async def login(credentials: LoginRequestValidated):
    """Login endpoint with real authentication."""
    try:
        # Input is already validated by LoginRequestValidated model
        user = await authenticate_user(credentials.username, credentials.password)
        if not user:
            return APIResponseWithData(
                success=False,
                message=None,
                additionalData="Invalid username or password",
                data=None
            )

        # Create JWT token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["username"], "user_id": user["id"]},
            expires_delta=access_token_expires
        )

        return APIResponseWithData(
            success=True,
            message={
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user["id"],
                    "username": user["username"],
                    "email": user["email"],
                    "first_name": user["first_name"],
                    "last_name": user["last_name"]
                }
            },
            additionalData=None,
            data=None
        )
    except Exception as e:
        return APIResponseWithData(
            success=False,
            message=None,
            additionalData=f"Login failed: {str(e)}",
            data=None
        )


@app.get("/api/auth/me", response_model=APIResponseWithData)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information using stored procedure."""
    try:
        # Use stored procedure to get user profile with post count
        user_profile = await database.fetch_one(
            "SELECT * FROM get_user_profile(:user_id)",
            {"user_id": current_user["id"]}
        )

        if not user_profile:
            return APIResponseWithData(
                success=False,
                message=None,
                additionalData="User profile not found",
                data=None
            )

        return APIResponseWithData(
            success=True,
            message={
                "id": user_profile["id"],
                "username": user_profile["username"],
                "email": user_profile["email"],
                "first_name": user_profile["first_name"],
                "last_name": user_profile["last_name"],
                "is_active": user_profile["is_active"],
                "post_count": user_profile["post_count"],
                "member_since": user_profile["created_at"].isoformat() + "Z"
            },
            additionalData=None,
            data=None
        )
    except Exception as e:
        return APIResponseWithData(
            success=False,
            message=None,
            additionalData=f"Failed to get user info: {str(e)}",
            data=None
        )


@app.put("/api/auth/profile", response_model=APIResponseWithData)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile information."""
    try:
        # Get only the fields that were provided (not None)
        update_data = {}
        if profile_data.first_name is not None:
            update_data["first_name"] = profile_data.first_name.strip()
        if profile_data.last_name is not None:
            update_data["last_name"] = profile_data.last_name.strip()
        if profile_data.email is not None:
            update_data["email"] = profile_data.email.strip().lower()

        if not update_data:
            return APIResponseWithData(
                success=False,
                message=None,
                additionalData="No valid fields to update",
                data=None
            )

        # Check if email is being updated and if it's already taken
        if "email" in update_data and update_data["email"] != current_user["email"]:
            existing_user = await database.fetch_one(
                "SELECT id FROM users WHERE email = :email AND id != :user_id",
                {"email": update_data["email"], "user_id": current_user["id"]}
            )
            if existing_user:
                return APIResponseWithData(
                    success=False,
                    message=None,
                    additionalData="Email is already in use by another account",
                    data=None
                )

        # Build dynamic update query
        set_clauses = []
        params = {"user_id": current_user["id"]}

        for field, value in update_data.items():
            set_clauses.append(f"{field} = :{field}")
            params[field] = value

        if set_clauses:
            query = f"""
                UPDATE users 
                SET {", ".join(set_clauses)}
                WHERE id = :user_id
                RETURNING id, username, email, first_name, last_name, is_active
            """

            updated_user = await database.fetch_one(query, params)

            return APIResponseWithData(
                success=True,
                message={
                    "id": updated_user["id"],
                    "username": updated_user["username"],
                    "email": updated_user["email"],
                    "first_name": updated_user["first_name"],
                    "last_name": updated_user["last_name"],
                    "is_active": updated_user["is_active"]
                },
                additionalData=None,
                data=None
            )
        else:
            return APIResponseWithData(
                success=False,
                message=None,
                additionalData="No fields to update",
                data=None
            )

    except Exception as e:
        return APIResponseWithData(
            success=False,
            message=None,
            additionalData=f"Failed to update profile: {str(e)}",
            data=None
        )

# External API endpoint


@app.get("/api/external/posts", response_model=APIResponseWithList)
async def get_external_posts(limit: int = 20):
    """Get posts from JSONPlaceholder API."""
    try:
        # Validate pagination parameters
        validated_limit, _ = validate_pagination_params(limit, 0)

        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"https://jsonplaceholder.typicode.com/posts",
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status == 200:
                    external_posts = await response.json()
                    # Limit results
                    if isinstance(external_posts, list):
                        external_posts = external_posts[:validated_limit]

                    return APIResponseWithList(
                        success=True,
                        message=None,
                        additionalData=None,
                        data=external_posts
                    )
                else:
                    return APIResponseWithList(
                        success=False,
                        message=None,
                        additionalData=f"External API error: {response.status}",
                        data=[]
                    )
    except Exception as e:
        return APIResponseWithList(
            success=False,
            message=None,
            additionalData=f"Failed to fetch external posts: {str(e)}",
            data=[]
        )

# Users endpoint


@app.get("/api/users", response_model=APIResponseWithList)
async def get_users():
    """Get all users."""
    try:
        users = await database.fetch_all(
            "SELECT id, username, email, first_name, last_name, is_active FROM users ORDER BY created_at"
        )
        user_list = [dict(user) for user in users]

        return APIResponseWithList(
            success=True,
            message=None,
            additionalData=None,
            data=user_list
        )
    except Exception as e:
        return APIResponseWithList(
            success=False,
            message=None,
            additionalData=f"Failed to fetch users: {str(e)}",
            data=[]
        )


@app.get("/api/users/{user_id}/activity", response_model=APIResponseWithData)
async def get_user_activity(user_id: int):
    """Get user activity summary using stored procedure."""
    try:
        # Validate user_id
        validated_user_id = validate_integer_id(user_id, "User ID")

        # Use stored procedure to get user activity summary
        activity = await database.fetch_one(
            "SELECT * FROM get_user_activity_summary(:user_id)",
            {"user_id": validated_user_id}
        )

        if not activity:
            return APIResponseWithData(
                success=False,
                message=None,
                additionalData="User not found",
                data=None
            )

        activity_data = {
            "user_id": activity["user_id"],
            "username": activity["username"],
            "full_name": activity["full_name"],
            "total_posts": activity["total_posts"],
            "last_post_date": activity["last_post_date"].isoformat() + "Z" if activity["last_post_date"] else None
        }

        return APIResponseWithData(
            success=True,
            message=activity_data,
            additionalData=None,
            data=None
        )
    except Exception as e:
        return APIResponseWithData(
            success=False,
            message=None,
            additionalData=f"Failed to fetch user activity: {str(e)}",
            data=None
        )


@app.get("/api/statistics", response_model=APIResponseWithData)
async def get_statistics(current_user: dict = Depends(get_current_user)):
    """Get application statistics using stored procedure."""
    try:
        # Use stored procedure to get statistics for current user
        stats = await database.fetch_one(
            "SELECT * FROM get_post_statistics(:user_id)",
            {"user_id": current_user["id"]}
        )

        # Get overall statistics (all users)
        overall_stats = await database.fetch_one("SELECT * FROM get_post_statistics()")

        users_count = await database.fetch_val("SELECT COUNT(*) FROM users WHERE is_active = true")

        return APIResponseWithData(
            success=True,
            message={
                "overall": {
                    "total_posts": overall_stats["total_posts"] if overall_stats else 0,
                    "total_users": users_count
                },
                "user_specific": {
                    "user_posts": stats["user_posts"] if stats else 0,
                    "total_posts": stats["total_posts"] if stats else 0
                }
            },
            additionalData=None,
            data=None
        )
    except Exception as e:
        return APIResponseWithData(
            success=False,
            message=None,
            additionalData=f"Failed to fetch statistics: {str(e)}",
            data=None
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
