"""
API Version 1 Router

This module defines all API routes for version 1 of the application.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import posts, users, external_api, auth

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(posts.router, prefix="/posts", tags=["posts"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(
    external_api.router, prefix="/external", tags=["external-api"])
