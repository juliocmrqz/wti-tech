# WTI Tech AI Coding Agent Instructions

## Project Overview

This is a **3-tier N-tier application** demonstrating modern enterprise patterns with TypeScript React frontend, Python FastAPI backend, and PostgreSQL database. The architecture emphasizes security, scalability, and maintainability.

## Architecture & Service Boundaries

### Backend (Business Logic Tier)

- **FastAPI** with async/await patterns using `databases` library (not AsyncPG directly)
- **Raw SQL** approach - NO ORM, all queries in stored procedures or raw SQL
- **JWT authentication** with bcrypt password hashing via `passlib`
- **Structured validation** using custom `InputSanitizer` class in `app/core/validation.py`
- **Lifespan management** for database connections using `@asynccontextmanager`

### Frontend (Presentation Tier)

- **React 18+ with TypeScript** and strict typing patterns
- **Redux Toolkit** with structured slices pattern (auth, posts, users, ui, externalPosts)
- **Material-UI v5** component library with custom theme
- **Protected routes** using `ProtectedRoute` component wrapper
- **Form handling** with React Hook Form + Yup validation

### Database (Data Tier)

- **PostgreSQL 15+** with stored procedures for business logic
- **Connection pooling** managed through FastAPI lifespan events
- **Trigger-based** `updated_at` timestamp management
- **Comprehensive indexing** on foreign keys and search columns

## Critical Development Workflows

### Database Setup

```bash
# Essential sequence - always run init_db.py, never manual SQL
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python init_db.py  # Handles schema + sample data + hashing
```

### Development Environment

```bash
# Backend (Terminal 1)
cd backend
venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (Terminal 2)
cd frontend
npm install
npm run dev  # Vite dev server on port 5173

# Docker Alternative
docker-compose up -d  # All services
```

### Testing Strategy

- **Backend**: `pytest` with `AsyncClient` fixtures in `tests/`
- **Frontend**: Jest + React Testing Library
- **Performance**: Custom load testing in `tests/performance_testing.py`
- **Critical**: Always test auth endpoints after changes

## Project-Specific Conventions

### Security Patterns

- **Never bypass validation**: All inputs go through `InputSanitizer` before database
- **SQL injection protection**: Custom patterns in `validation.py` detect malicious content
- **Password handling**: Always use `hash_password()` from `app/core/security.py`
- **JWT tokens**: Created via `create_access_token()` with configurable expiry

### API Response Format

```python
# Standardized API response structure
{
  "success": bool,
  "message": any,  # Main data payload
  "additionalData": string | null  # Error details or metadata
}
```

### State Management Pattern

```typescript
// Redux slices always follow this structure
export const asyncAction = createAsyncThunk('slice/action', async (params, { rejectWithValue }) => {
  // API call with standardized error handling
  const apiResponse: APIResponseWithData = await response.json();
  if (!apiResponse.success) {
    return rejectWithValue(apiResponse.additionalData || 'Operation failed');
  }
  return apiResponse.message;
});
```

### Database Interaction Pattern

```python
# Always use parameterized queries through databases library
query = "SELECT * FROM users WHERE id = :user_id"
result = await database.fetch_one(query, {"user_id": user_id})
```

## Integration Points & Dependencies

### External API Integration

- **JSONPlaceholder** integration in `app/api/v1/endpoints/external_api.py`
- **aiohttp** for async external calls with timeout handling
- **Error propagation** through standardized API response format

### Authentication Flow

1. Login → JWT token creation in `/api/v1/auth/login`
2. Token storage in `localStorage` (frontend)
3. **All protected routes** require `Authorization: Bearer <token>` header
4. Token validation via `verify_token()` dependency injection

### Cross-Component Communication

- **Frontend**: Redux store as single source of truth
- **Backend**: Shared validation logic in `app/core/validation.py`
- **Database**: Foreign key constraints enforce referential integrity

## Environment-Specific Notes

### Windows Development

- Use `venv\Scripts\activate` (not `source`)
- PostgreSQL often on port 5432 with `postgres` user
- Ensure Python 3.11+ in PATH for async features

### Docker Development

- `docker-compose.yml` includes volume mounts for hot reload
- Database initialization via `./database/init/` scripts
- Network bridge `wtitech-network` connects all services

### AWS Deployment (CDK)

- **Infrastructure as Code** in `infrastructure/` using AWS CDK
- **Network isolation** with VPC, private subnets for database
- **Security groups** restrict access between tiers

## Key Files for AI Context

- `backend/app/core/validation.py` - Security and input handling patterns
- `frontend/src/store/slices/authSlice.ts` - Authentication state management
- `database/01_schema.sql` - Database schema and relationships
- `backend/init_db.py` - Complete database setup process
- `docker-compose.yml` - Service orchestration and networking
- `backend/main.py` - FastAPI application structure and middleware
