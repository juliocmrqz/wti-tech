"""
Input validation and sanitization utilities for WTI Tech API.
Provides protection against SQL injection and other input-based attacks.
"""

import re
import html
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, validator
from fastapi import HTTPException, status


class InputSanitizer:
    """Utility class for input sanitization and validation."""
    
    # Patterns for detecting potential SQL injection attempts
    SQL_INJECTION_PATTERNS = [
        r"(\b(union|select|insert|delete|update|drop|create|alter|exec|execute)\b)",
        r"(--|#|/\*|\*/)",
        r"(\b(or|and)\b\s+\d+\s*=\s*\d+)",
        r"(\'\s*(or|and)\s*\'\w*\'\s*=\s*\'\w*)",
        r"(\d+\s*(=|<|>)\s*\d+)",
        r"(xp_|sp_|fn_)",
        r"(script|javascript|vbscript|onload|onerror)",
    ]
    
    # Patterns for XSS detection
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"vbscript:",
        r"onload\s*=",
        r"onerror\s*=",
        r"onclick\s*=",
        r"onmouseover\s*=",
    ]
    
    @classmethod
    def sanitize_string(cls, value: str, max_length: Optional[int] = None) -> str:
        """
        Sanitize a string input by removing/escaping dangerous characters.
        
        Args:
            value: The string to sanitize
            max_length: Maximum allowed length
            
        Returns:
            Sanitized string
            
        Raises:
            HTTPException: If malicious content is detected
        """
        if not isinstance(value, str):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Input must be a string"
            )
        
        # Trim whitespace
        value = value.strip()
        
        # Check length
        if max_length and len(value) > max_length:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Input exceeds maximum length of {max_length} characters"
            )
        
        # Check for SQL injection patterns
        for pattern in cls.SQL_INJECTION_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Potentially malicious SQL content detected"
                )
        
        # Check for XSS patterns
        for pattern in cls.XSS_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Potentially malicious script content detected"
                )
        
        # HTML escape to prevent XSS
        value = html.escape(value)
        
        return value
    
    @classmethod
    def validate_email(cls, email: str) -> str:
        """Validate email format."""
        email = cls.sanitize_string(email, max_length=100)
        
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email format"
            )
        
        return email.lower()
    
    @classmethod
    def validate_username(cls, username: str) -> str:
        """Validate username format."""
        username = cls.sanitize_string(username, max_length=50)
        
        # Username should only contain alphanumeric characters and underscores
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username can only contain letters, numbers, and underscores"
            )
        
        if len(username) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username must be at least 3 characters long"
            )
        
        return username.lower()
    
    @classmethod
    def validate_name(cls, name: str, field_name: str = "Name") -> str:
        """Validate first/last name fields."""
        name = cls.sanitize_string(name, max_length=50)
        
        # Names should only contain letters, spaces, hyphens, and apostrophes
        if not re.match(r"^[a-zA-Z\s\-']+$", name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} can only contain letters, spaces, hyphens, and apostrophes"
            )
        
        if len(name) < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} is required"
            )
        
        return name.title()  # Capitalize first letter of each word
    
    @classmethod
    def validate_post_title(cls, title: str) -> str:
        """Validate post title."""
        title = cls.sanitize_string(title, max_length=200)
        
        if len(title) < 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Title must be at least 5 characters long"
            )
        
        return title
    
    @classmethod
    def validate_post_content(cls, content: str) -> str:
        """Validate post content."""
        content = cls.sanitize_string(content, max_length=10000)
        
        if len(content) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Content must be at least 10 characters long"
            )
        
        return content
    
    @classmethod
    def validate_password(cls, password: str) -> str:
        """Validate password strength."""
        if not isinstance(password, str):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be a string"
            )
        
        if len(password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long"
            )
        
        if len(password) > 128:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is too long"
            )
        
        # Check for at least one letter and one number
        if not re.search(r'[a-zA-Z]', password) or not re.search(r'\d', password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one letter and one number"
            )
        
        return password


# Enhanced Pydantic models with validation
class UserCreateValidated(BaseModel):
    username: str
    email: str
    password: str
    first_name: str
    last_name: str

    @validator('username')
    def validate_username(cls, v):
        return InputSanitizer.validate_username(v)

    @validator('email')
    def validate_email(cls, v):
        return InputSanitizer.validate_email(v)

    @validator('password')
    def validate_password(cls, v):
        return InputSanitizer.validate_password(v)

    @validator('first_name')
    def validate_first_name(cls, v):
        return InputSanitizer.validate_name(v, "First name")

    @validator('last_name')
    def validate_last_name(cls, v):
        return InputSanitizer.validate_name(v, "Last name")


class PostCreateValidated(BaseModel):
    title: str
    content: str

    @validator('title')
    def validate_title(cls, v):
        return InputSanitizer.validate_post_title(v)

    @validator('content')
    def validate_content(cls, v):
        return InputSanitizer.validate_post_content(v)


class LoginRequestValidated(BaseModel):
    username: str
    password: str

    @validator('username')
    def validate_username(cls, v):
        return InputSanitizer.sanitize_string(v, max_length=50)

    @validator('password')
    def validate_password(cls, v):
        if not isinstance(v, str) or len(v) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is required"
            )
        return v  # Don't sanitize password during login, just validate it exists


def validate_integer_id(value: Any, field_name: str = "ID") -> int:
    """Validate that a value is a positive integer suitable for database ID."""
    try:
        int_value = int(value)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} must be a valid integer"
        )
    
    if int_value <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} must be a positive integer"
        )
    
    # Prevent extremely large values that could cause issues
    if int_value > 2147483647:  # Max PostgreSQL integer
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} value is too large"
        )
    
    return int_value


def validate_pagination_params(limit: int = 20, offset: int = 0) -> tuple[int, int]:
    """Validate pagination parameters."""
    limit = validate_integer_id(limit, "Limit")
    offset = validate_integer_id(offset, "Offset") if offset > 0 else 0
    
    # Reasonable limits to prevent abuse
    if limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limit cannot exceed 100"
        )
    
    return limit, offset