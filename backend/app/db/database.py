"""
Database connection and management.

This module handles PostgreSQL database connections using raw SQL
without any ORM framework, as per requirements.
Uses the databases library for consistency with main.py.
"""

import databases
from typing import Optional, List, Dict, Any
from app.core.config import settings
import logging
import os

logger = logging.getLogger(__name__)

# Global database connection
_database: Optional[databases.Database] = None


async def init_db() -> None:
    """Initialize database connection."""
    global _database
    try:
        # Get DATABASE_URL from environment, fallback to settings
        database_url = os.getenv(
            "DATABASE_URL",
            getattr(settings, 'DATABASE_URL',
                    "postgresql://wtitech_user:wtitech_pass@localhost:5432/wtitech")
        )

        _database = databases.Database(database_url)
        await _database.connect()
        logger.info("Database connection initialized")
    except Exception as e:
        logger.error(f"Failed to initialize database connection: {e}")
        raise


async def close_db() -> None:
    """Close database connection."""
    global _database
    if _database:
        await _database.disconnect()
        logger.info("Database connection closed")


def get_database() -> databases.Database:
    """Get the database connection."""
    if _database is None:
        raise RuntimeError("Database connection not initialized")
    return _database


async def execute_query(query: str, values: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Execute a SELECT query and return results."""
    database = get_database()
    if values:
        rows = await database.fetch_all(query, values)
    else:
        rows = await database.fetch_all(query)
    return [dict(row) for row in rows]


async def execute_query_one(query: str, values: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """Execute a SELECT query and return one result."""
    database = get_database()
    if values:
        row = await database.fetch_one(query, values)
    else:
        row = await database.fetch_one(query)
    return dict(row) if row else None


async def execute_command(query: str, values: Optional[Dict[str, Any]] = None) -> str:
    """Execute an INSERT, UPDATE, or DELETE command."""
    database = get_database()
    if values:
        result = await database.execute(query, values)
    else:
        result = await database.execute(query)
    return result


async def execute_transaction(queries: List[tuple]) -> bool:
    """Execute multiple queries in a transaction."""
    database = get_database()
    transaction = await database.transaction()
    try:
        for query, values in queries:
            if values:
                await database.execute(query, values)
            else:
                await database.execute(query)
        await transaction.commit()
        return True
    except Exception as e:
        await transaction.rollback()
        logger.error(f"Transaction failed: {e}")
        raise
