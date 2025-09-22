#!/usr/bin/env python3
"""
Password Migration Script
Converts existing plain text passwords to properly hashed passwords
"""

import asyncio
import os
import hashlib
import secrets
import databases
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://wtitech_user:wtitech_pass@localhost:5432/wtitech"
)

def hash_password(password: str) -> str:
    """Hash a password with salt using SHA-256"""
    salt = secrets.token_hex(32)
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}${password_hash}"

async def migrate_passwords():
    """Migrate plain text passwords to hashed passwords"""
    database = databases.Database(DATABASE_URL)
    
    try:
        await database.connect()
        print("✅ Connected to database")
        
        # Get all users with plain text passwords (no $ in password = not hashed)
        users = await database.fetch_all("""
            SELECT id, username, hashed_password 
            FROM users 
            WHERE hashed_password NOT LIKE '%$%'
        """)
        
        if not users:
            print("✅ No plain text passwords found - all passwords are already hashed!")
            return
            
        print(f"🔄 Found {len(users)} users with plain text passwords")
        
        for user in users:
            user_id = user["id"]
            username = user["username"]
            plain_password = user["hashed_password"]
            
            # Hash the password
            hashed_password = hash_password(plain_password)
            
            # Update the user
            await database.execute("""
                UPDATE users 
                SET hashed_password = :hashed_password 
                WHERE id = :user_id
            """, {
                "hashed_password": hashed_password,
                "user_id": user_id
            })
            
            print(f"✅ Updated password for user: {username}")
            
        print(f"🎉 Successfully migrated {len(users)} passwords!")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
    finally:
        await database.disconnect()
        print("🔒 Database connection closed")

if __name__ == "__main__":
    print("🔐 Starting password migration...")
    asyncio.run(migrate_passwords())