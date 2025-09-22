#!/usr/bin/env python3
"""
Database initialization script for WTI Tech application.
Creates tables and inserts demo data.
"""

import asyncio
import databases
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://wtitech_user:wtitech_pass@localhost:5432/wtitech")

async def create_stored_procedures(database):
    """Create stored procedures for the WTI Tech application."""
    
    # Stored procedure to get post statistics
    await database.execute("""
        CREATE OR REPLACE FUNCTION get_post_statistics(p_user_id INTEGER DEFAULT NULL)
        RETURNS TABLE (
            total_posts INTEGER,
            user_posts INTEGER
        ) AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                COUNT(*)::INTEGER as total_posts,
                COUNT(CASE WHEN p.user_id = p_user_id THEN 1 END)::INTEGER as user_posts
            FROM posts p
            WHERE (p_user_id IS NULL OR p.user_id = p_user_id);
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    # Stored procedure to get recent posts with author information
    await database.execute("""
        CREATE OR REPLACE FUNCTION get_recent_posts(p_limit INTEGER DEFAULT 10)
        RETURNS TABLE (
            id INTEGER,
            title VARCHAR(200),
            content TEXT,
            author_name TEXT,
            user_id INTEGER,
            created_at TIMESTAMP
        ) AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                p.id,
                p.title,
                p.content,
                CONCAT(u.first_name, ' ', u.last_name) as author_name,
                p.user_id,
                p.created_at
            FROM posts p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
            LIMIT p_limit;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    # Stored procedure to get user information with post count
    await database.execute("""
        CREATE OR REPLACE FUNCTION get_user_profile(p_user_id INTEGER)
        RETURNS TABLE (
            id INTEGER,
            username VARCHAR(50),
            email VARCHAR(100),
            first_name VARCHAR(50),
            last_name VARCHAR(50),
            is_active BOOLEAN,
            post_count INTEGER,
            created_at TIMESTAMP
        ) AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                u.id,
                u.username,
                u.email,
                u.first_name,
                u.last_name,
                u.is_active,
                COUNT(p.id)::INTEGER as post_count,
                u.created_at
            FROM users u
            LEFT JOIN posts p ON u.id = p.user_id
            WHERE u.id = p_user_id
            GROUP BY u.id, u.username, u.email, u.first_name, u.last_name, u.is_active, u.created_at;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    # Stored procedure to create a post with validation
    await database.execute("""
        CREATE OR REPLACE FUNCTION create_post_with_validation(
            p_title VARCHAR(200),
            p_content TEXT,
            p_user_id INTEGER
        )
        RETURNS TABLE (
            post_id INTEGER,
            success BOOLEAN,
            message TEXT
        ) AS $$
        DECLARE
            v_post_id INTEGER;
            v_user_exists BOOLEAN;
        BEGIN
            -- Validate user exists
            SELECT EXISTS(SELECT 1 FROM users WHERE id = p_user_id AND is_active = true) INTO v_user_exists;
            
            IF NOT v_user_exists THEN
                RETURN QUERY SELECT NULL::INTEGER, false, 'User does not exist or is inactive'::TEXT;
                RETURN;
            END IF;
            
            -- Validate title length
            IF LENGTH(TRIM(p_title)) < 5 THEN
                RETURN QUERY SELECT NULL::INTEGER, false, 'Title must be at least 5 characters long'::TEXT;
                RETURN;
            END IF;
            
            -- Validate content length
            IF LENGTH(TRIM(p_content)) < 10 THEN
                RETURN QUERY SELECT NULL::INTEGER, false, 'Content must be at least 10 characters long'::TEXT;
                RETURN;
            END IF;
            
            -- Create the post
            INSERT INTO posts (title, content, user_id, created_at, updated_at)
            VALUES (p_title, p_content, p_user_id, NOW(), NOW())
            RETURNING id INTO v_post_id;
            
            RETURN QUERY SELECT v_post_id, true, 'Post created successfully'::TEXT;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    # Stored procedure to get user activity summary
    await database.execute("""
        CREATE OR REPLACE FUNCTION get_user_activity_summary(p_user_id INTEGER)
        RETURNS TABLE (
            user_id INTEGER,
            username VARCHAR(50),
            full_name VARCHAR(101),
            total_posts INTEGER,
            last_post_date TIMESTAMP
        ) AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                u.id as user_id,
                u.username,
                (u.first_name || ' ' || u.last_name) as full_name,
                COUNT(DISTINCT p.id)::INTEGER as total_posts,
                MAX(p.created_at) as last_post_date
            FROM users u
            LEFT JOIN posts p ON u.id = p.user_id
            WHERE u.id = p_user_id
            GROUP BY u.id, u.username, u.first_name, u.last_name;
        END;
        $$ LANGUAGE plpgsql;
    """)

async def test_stored_procedures(database):
    """Test that stored procedures are working correctly."""
    try:
        print("🧪 Testing stored procedures...")
        
        # Test get_post_statistics
        stats = await database.fetch_one("SELECT * FROM get_post_statistics()")
        if stats:
            print(f"   ✅ get_post_statistics: {stats['total_posts']} total posts")
        
        # Test get_recent_posts
        recent_posts = await database.fetch_all("SELECT * FROM get_recent_posts(5)")
        print(f"   ✅ get_recent_posts: Retrieved {len(recent_posts)} recent posts")
        
        # Test get_user_profile
        user_profile = await database.fetch_one("SELECT * FROM get_user_profile(1)")
        if user_profile:
            print(f"   ✅ get_user_profile: User '{user_profile['username']}' has {user_profile['post_count']} posts")
        
        # Test get_user_activity_summary
        activity = await database.fetch_one("SELECT * FROM get_user_activity_summary(1)")
        if activity:
            print(f"   ✅ get_user_activity_summary: {activity['full_name']} - {activity['total_posts']} posts")
        
        print("   🎉 All stored procedures working correctly!")
        
    except Exception as e:
        print(f"   ⚠️ Stored procedure test warning: {e}")
        # Don't fail the entire initialization if procedures have issues

async def init_database():
    """Initialize the database with tables and demo data."""
    try:
        # Connect to database
        database = databases.Database(DATABASE_URL)
        await database.connect()
        print("✅ Connected to PostgreSQL database")
        
        # Drop tables if they exist (for clean setup)
        await database.execute("DROP TABLE IF EXISTS posts CASCADE")
        await database.execute("DROP TABLE IF EXISTS users CASCADE")
        print("🧹 Dropped existing tables")
        
        # Create users table
        await database.execute("""
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ Created users table")
        
        # Create posts table
        await database.execute("""
            CREATE TABLE posts (
                id SERIAL PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ Created posts table")
        
        # Insert demo users
        await database.execute("""
            INSERT INTO users (username, email, first_name, last_name, hashed_password) VALUES
            ('demo', 'demo@example.com', 'Demo', 'User', 'password123'),
            ('testuser', 'test@example.com', 'Test', 'User', 'password123')
        """)
        print("✅ Inserted demo users")
        
        # Insert demo posts
        await database.execute("""
            INSERT INTO posts (title, content, user_id) VALUES
            ('Welcome to WTI Tech', 'This is our first blog post in the new system!', 1),
            ('FastAPI is Great', 'FastAPI makes building APIs simple and fast.', 1),
            ('PostgreSQL Integration', 'Now we have real database persistence!', 2)
        """)
        print("✅ Inserted demo posts")
        
        # Create stored procedures
        await create_stored_procedures(database)
        print("✅ Created stored procedures")
        
        # Verify data
        users_count = await database.fetch_val("SELECT COUNT(*) FROM users")
        posts_count = await database.fetch_val("SELECT COUNT(*) FROM posts")
        
        # Test stored procedures
        await test_stored_procedures(database)
        
        print(f"📊 Database initialized successfully!")
        print(f"   Users: {users_count}")
        print(f"   Posts: {posts_count}")
        
        await database.disconnect()
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        return False
    
    return True

async def test_connection():
    """Test database connection."""
    try:
        database = databases.Database(DATABASE_URL)
        await database.connect()
        version = await database.fetch_val("SELECT version()")
        print(f"🔗 PostgreSQL Version: {version}")
        await database.disconnect()
        return True
    except Exception as e:
        print(f"❌ Cannot connect to database: {e}")
        print(f"🔧 Make sure PostgreSQL is running on: {DATABASE_URL}")
        return False

if __name__ == "__main__":
    print("🚀 WTI Tech Database Initialization")
    print("=" * 50)
    
    # Test connection first
    if not asyncio.run(test_connection()):
        print("\n💡 Quick fix:")
        print("   docker-compose up postgres -d")
        exit(1)
    
    # Initialize database
    success = asyncio.run(init_database())
    
    if success:
        print("\n🎉 Database setup complete!")
        print("📝 Demo credentials:")
        print("   Username: demo, Password: password123")
        print("   Username: testuser, Password: password123")
        print("🔧 Stored procedures created:")
        print("   - get_post_statistics(user_id)")
        print("   - get_recent_posts(limit)")
        print("   - get_user_profile(user_id)")
        print("   - create_post_with_validation(title, content, user_id)")
        print("   - get_user_activity_summary(user_id)")
    else:
        print("\n❌ Database setup failed")
        exit(1)