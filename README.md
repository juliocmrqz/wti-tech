# WTI Tech - N-Tier Application

## Overview

A comprehensive 3-Tier application with CRUD operations, state management, external API integration. Built with TypeScript, Python, and PostgreSQL.

## 🏗️ Architecture Strategy

### **3-Tier Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Presentation   │◄──►│  Business Logic │◄──►│   Data Layer    │
│   (React TS)    │    │   (FastAPI)     │    │  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

Each tier serves a specific purpose in the N-Tier architecture:

- **Presentation Tier**: User interface and client-side logic
- **Business Logic Tier**: Application logic, authentication, and API endpoints with stored procedures
- **Data Tier**: Database operations, data persistence, and business logic functions

## 🛠️ Technology Stack & Versions

### **Frontend (Presentation Tier)**
- **React 18.2+** with TypeScript 5.0+ - Component-based UI framework.
- **Node.js 20.9.0** - JavaScript runtime (specified in package.json).
- **Redux Toolkit 1.9+** - Global state management.
- **Material-UI (MUI) v5.14+** - Component library
- **Vite 4.4+** - Build Tool
- **React Router v6.15+** - Client-side routing
- **Axios 1.5+** - HTTP client with interceptors for API communication

### **Backend (Business Logic Tier)**  
- **Python 3.11+** - Python with async/await support (Required)
- **FastAPI 0.103+** - High-performance async web framework with lifespan events
- **Databases 0.8+** - Async database interface with PostgreSQL support
- **Pydantic 2.0+** - Data validation and serialization
- **PyJWT 2.8+** - Stateless JWT authentication
- **aiohttp 3.8+** - Async HTTP client for external API integration
- **Uvicorn 0.23+** - ASGI server for production deployment

### **Database (Data Tier)**
- **PostgreSQL 15+** - Database with stored procedures
- **psycopg2-binary 2.9+** - PostgreSQL adapter for Python
- **SQL Functions & Procedures** - Business logic at database level
- **Connection Pooling** - Database connection

### **Security & Validation**
- **Input Sanitization** - XSS and SQL injection protection
- **Comprehensive Validation** - Client-side and server-side validation
- **JWT Authentication** - Secure stateless authentication
- **Password Hashing** - SHA-256 with salt for secure password storage

## 📋 System Requirements

### **Development Environment**
- **Node.js**: `20.9.0` (LTS) - [Download](https://nodejs.org/)
- **Python**: `3.11+` (required for modern async features) - [Download](https://www.python.org/downloads/)
- **PostgreSQL**: `15+` (for advanced SQL features) - [Download](https://www.postgresql.org/download/)
- **Git**: Latest version for version control - [Download](https://git-scm.com/downloads)

## 🚀 Quick Start Options

### **Option 1: Docker Compose**

```bash
# Clone the repository
git clone <repository-url>
cd wti-tech

# Start all services with Docker
docker-compose up -d

# Wait for services to initialize (about 30-60 seconds)
# Check logs if needed
docker-compose logs -f

# Access the applications
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

**Testing the Docker Setup:**
```bash
# Check service status
docker-compose ps

# Test API health
curl http://localhost:8000/health

# Test frontend
# Open browser to http://localhost:3000

# Stop services when done
docker-compose down
```

### **Option 2: Manual Setup (Development & Production)**

Complete step-by-step setup for development.

---

## 🔧 Manual Setup Guide

### **Step 1: Prerequisites Installation**

#### **1.1 Install Node.js 20.9.0**

**Windows:**
1. Download Node.js 20.9.0 LTS from [https://nodejs.org/](https://nodejs.org/)
2. Run the installer and follow the setup wizard
3. Verify installation:
```cmd
node --version  # Should show v20.9.0
npm --version   # Should show 10.x.x
```

**macOS:**
```bash
# Using Homebrew (recommended)
brew install node@20

# Or download directly from nodejs.org
# Verify installation
node --version
npm --version
```

**Linux (Ubuntu/Debian):**
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### **1.2 Install Python 3.11+**

**Windows:**
1. Download Python 3.11+ from [https://www.python.org/downloads/](https://www.python.org/downloads/)
2. **Important**: Check "Add Python to PATH" during installation
3. Choose "Customize installation" and ensure pip is included
4. Verify installation:
```cmd
python --version  # Should show Python 3.11.x or higher
pip --version     # Should show pip 23.x.x
```

**macOS:**
```bash
# Using Homebrew (recommended)
brew install python@3.11

# Or using pyenv for version management
brew install pyenv
pyenv install 3.11.5
pyenv global 3.11.5

# Verify installation
python3 --version
pip3 --version
```

#### **1.3 Install PostgreSQL 15+**

**Windows:**
1. Download PostgreSQL 15+ from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the setup wizard
3. **Remember the password** for the `postgres` superuser
4. **Important**: Note the port (default 5432) and installation directory
5. Add PostgreSQL to PATH (usually automatic)
6. Verify installation:
```cmd
psql --version  # Should show psql (PostgreSQL) 15.x
```

**macOS:**
```bash
# Using Homebrew (recommended)
brew install postgresql@15
brew services start postgresql@15

# Verify installation
psql --version
```

### **Step 2: Database Setup**

#### **2.1 Create Database and User**

**Windows/macOS/Linux:**
```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# If you get "psql: command not found", add PostgreSQL to PATH
# Windows: Add C:\Program Files\PostgreSQL\15\bin to PATH
```

```sql
-- Create the application database
CREATE DATABASE wtitech;

-- Create application user with password
CREATE USER wtitech_user WITH PASSWORD 'wtitech_pass';

-- Grant all privileges on the database
GRANT ALL PRIVILEGES ON DATABASE wtitech TO wtitech_user;

-- Switch to the new database
\c wtitech

-- Grant schema privileges (PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO wtitech_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO wtitech_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO wtitech_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO wtitech_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO wtitech_user;
```

#### **2.2 Initialize Database Schema**

**Option A: Automated Initialization (Recommended)**
```bash
# Navigate to project directory
cd wti-tech

# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Run database initialization script
python init_db.py
```

**Expected Output:**
```
🚀 WTI Tech Database Initialization
==================================================
✅ Connected to PostgreSQL database
🔗 PostgreSQL Version: PostgreSQL 15.x...
🧹 Dropped existing tables
✅ Created users table
✅ Created posts table
✅ Inserted demo users
✅ Inserted demo posts
✅ Created stored procedures
🧪 Testing stored procedures...
   ✅ get_post_statistics: 3 total posts
   ✅ get_recent_posts: Retrieved 3 recent posts
   ✅ get_user_profile: User 'demo' has 2 posts
   ✅ get_user_activity_summary: Demo User - 2 posts
   🎉 All stored procedures working correctly!
📊 Database initialized successfully!
   Users: 2
   Posts: 3
🎉 Database setup complete!
```

**Option B: Manual SQL Execution**
```bash
# Navigate to database directory
cd database

# Execute SQL files in order
psql -U wtitech_user -d wtitech -f 01_schema.sql
psql -U wtitech_user -d wtitech -f 02_sample_data_hashed.sql
psql -U wtitech_user -d wtitech -f 03_stored_procedures.sql
```

#### **2.3 Verify Database Setup**

```bash
# Connect to verify
psql -U wtitech_user -d wtitech

# Check tables were created
\dt
```

**Expected Output:**
```
          List of relations
 Schema |  Name  | Type  |    Owner     
--------+--------+-------+--------------
 public | posts  | table | wtitech_user
 public | users  | table | wtitech_user
```

```sql
-- Check sample data
SELECT COUNT(*) FROM users;  -- Should return 2
SELECT COUNT(*) FROM posts;  -- Should return 3

-- Test stored procedures
SELECT * FROM get_post_statistics();
SELECT * FROM get_recent_posts(5);

-- Exit
\q
```

### **Step 3: Backend Setup**

#### **3.1 Backend Environment Setup**

```bash
# Navigate to backend directory (if not already there)
cd backend

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Upgrade pip to latest version
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

#### **3.2 Environment Configuration**

```bash
# Create environment file
copy .env.example .env  # Windows
cp .env.example .env    # macOS/Linux

# Edit .env file with your configuration
```

**Edit `.env` file:**
```env
# Database Configuration
DATABASE_URL=postgresql://wtitech_user:wtitech_pass@localhost:5432/wtitech

# JWT Configuration  
SECRET_KEY=your-super-secret-jwt-key-change-in-production-environment
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Configuration
DEBUG=True
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
```

#### **3.3 Start Backend Server**

```bash
# Start development server with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Alternative: Production server
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
✅ Connected to PostgreSQL database
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

#### **3.4 Test Backend API**

**Open new terminal and test:**
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test API documentation
# Open browser to: http://localhost:8000/docs
```

**Expected Health Response:**
```json
{
  "success": true,
  "message": {
    "status": "healthy",
    "service": "wti-tech-backend",
    "version": "1.0.0",
    "posts_count": 3,
    "users_count": 2,
    "database": "connected"
  },
  "additionalData": null,
  "data": null
}
```

### **Step 4: Frontend Setup**

#### **4.1 Frontend Environment Setup**

**Open new terminal:**
```bash
# Navigate to frontend directory
cd wti-tech/frontend

# Install dependencies
npm install

# Verify Node.js version compatibility
node --version  # Should be 20.9.0 or compatible
```

#### **4.2 Frontend Configuration**

Create environment file for frontend (if needed):
```bash
# Create environment file (optional)
copy .env.example .env.local  # Windows
cp .env.example .env.local    # macOS/Linux
```

**Edit `.env.local` (if created):**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_TITLE=WTI Tech Application
```

#### **4.3 Start Frontend Development Server**

```bash
# Start development server
npm run dev

# Alternative port if 3000 is busy
npm run dev -- --port 3001
```

**Expected Output:**
```
  VITE v4.4.9  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.100:3000/
  ➜  press h to show help
```

### **Step 5: Application Testing**

#### **5.1 Access the Application**

**Frontend Application:**
- URL: http://localhost:3000
- Features: User registration, login, post management, external API integration

**Backend API:**
- URL: http://localhost:8000
- Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

#### **5.2 Test User Registration**

1. **Open Frontend**: http://localhost:3000
2. **Navigate to Register**: Click "Register" link
3. **Fill Registration Form**:
   - Username: `testuser2`
   - Email: `test2@example.com`
   - Password: `password123`
   - First Name: `Test`
   - Last Name: `User`
4. **Submit Form**: Click "Register" button
5. **Verify Success**: Should redirect to login page

#### **5.3 Test User Login**

1. **Navigate to Login**: Click "Login" link
2. **Use Demo Credentials**:
   - Username: `demo`
   - Password: `password123`
   
   **Or use your registered user:**
   - Username: `testuser2`
   - Password: `password123`
3. **Submit Form**: Click "Login" button
4. **Verify Success**: Should redirect to dashboard/home page

#### **5.4 Test Post Management**

1. **Create New Post**:
   - Navigate to "Create Post" page
   - Title: `My Test Post`
   - Content: `This is a test post to verify the application is working correctly.`
   - Click "Create Post"

2. **View Posts**:
   - Navigate to "Posts" page
   - Verify your post appears in the list
   - Click on post to view details

3. **Edit Post** (if you're the author):
   - Click "Edit" button on your post
   - Modify title or content
   - Save changes

#### **5.5 Test External API Integration**

1. **Navigate to External Posts**: Click "External Posts" link
2. **Verify External Data**: Should display posts from JSONPlaceholder API
3. **Test Search**: Use search functionality to filter posts

#### **5.6 Test API Endpoints Directly**

```bash
# Test authentication
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "password123"}'

# Test posts endpoint
curl "http://localhost:8000/api/posts"

# Test external API
curl "http://localhost:8000/api/external/posts?limit=5"

# Test statistics (requires authentication)
# Replace YOUR_TOKEN with token from login response
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/statistics"
```

#### **5.7 Test Stored Procedures**

```bash
# Connect to database
psql -U wtitech_user -d wtitech

# Test procedures directly
SELECT * FROM get_post_statistics();
SELECT * FROM get_recent_posts(5);
SELECT * FROM get_user_profile(1);
SELECT * FROM get_user_activity_summary(1);

# Test post creation with validation
SELECT * FROM create_post_with_validation(
  'Test Procedure Post', 
  'This post was created using a stored procedure.', 
  1
);

-- Exit
\q
```

## 🔧 Available Commands

### **Frontend Commands**
```bash
cd frontend

npm run dev          # Start development server with HMR
npm run build        # Production build with TypeScript compilation
npm run preview      # Preview production build locally
npm run lint         # ESLint code analysis
npm run lint:fix     # Auto-fix linting issues  
npm run format       # Prettier code formatting
```

### **Backend Commands**
```bash
cd backend

# Activate virtual environment first
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Development commands
uvicorn main:app --reload                    # Development server with auto-reload
uvicorn main:app --host 0.0.0.0 --port 8000 # Production server
python init_db.py                           # Initialize/reset database
python -m pytest                            # Run test suite (if tests exist)

# Dependency management
pip install -r requirements.txt             # Install dependencies
pip freeze > requirements.txt               # Update dependencies
```

### **Database Commands**
```bash
cd database

# Direct SQL execution
psql -U wtitech_user -d wtitech -f 01_schema.sql
psql -U wtitech_user -d wtitech -f 02_sample_data_hashed.sql
psql -U wtitech_user -d wtitech -f 03_stored_procedures.sql

# Interactive database access
psql -U wtitech_user -d wtitech

# Backup and restore
pg_dump -U wtitech_user wtitech > backup.sql
psql -U wtitech_user -d wtitech < backup.sql
```

## 🛠️ Troubleshooting Common Issues

### **Database Connection Issues**

**Problem**: `Connection refused` or `authentication failed`
```bash
# Check PostgreSQL service status
# Windows: Services.msc -> PostgreSQL
# macOS: brew services list | grep postgresql
# Linux: sudo systemctl status postgresql

# Test connection manually
psql -U postgres -h localhost -p 5432

# Check if user exists
psql -U postgres -c "\du"
```

**Solution**:
1. Ensure PostgreSQL service is running
2. Verify username/password in database setup
3. Check DATABASE_URL in `.env` file
4. Verify firewall/port settings

### **Python/Backend Issues**

**Problem**: `ModuleNotFoundError` or import errors
```bash
# Verify virtual environment is activated
which python  # Should point to venv directory

# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Check Python version
python --version  # Should be 3.11+
```

### **Node.js/Frontend Issues**

**Problem**: `node_modules` or dependency errors
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json  # Remove existing
npm install

# Check Node.js version compatibility
node --version  # Should be 20.9.0
```

### **API Communication Issues**

**Problem**: CORS errors or API unreachable
1. Verify backend is running on port 8000
2. Check CORS settings in `main.py`
3. Verify frontend API base URL configuration
4. Check browser console for detailed error messages

## 📊 Application Features

### **Core Functionality**
- ✅ User Registration & Authentication (JWT-based)
- ✅ CRUD Operations for Blog Posts
- ✅ User Profile Management with Post Statistics
- ✅ External API Integration (JSONPlaceholder)
- ✅ Input Validation & Security (XSS/SQL Injection Protection)
- ✅ Stored Procedures for Business Logic
- ✅ Responsive UI with Material-UI
- ✅ Real-time Form Validation

### **Security Features**
- ✅ Password Hashing with Salt (SHA-256)
- ✅ JWT Token Authentication
- ✅ Input Sanitization and Validation
- ✅ SQL Injection Protection
- ✅ XSS Prevention
- ✅ CORS Configuration

### **Database Features**
- ✅ PostgreSQL with Advanced SQL Features
- ✅ Stored Procedures for Business Logic
- ✅ Database-level Validation
- ✅ Connection Pooling
- ✅ Foreign Key Relationships

## 📚 API Documentation

When the backend is running, comprehensive API documentation is available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### **Key Endpoints**

```bash
# Authentication
POST /api/auth/register  # User registration
POST /api/auth/login     # User login
GET  /api/auth/me        # Current user profile

# Posts Management
GET    /api/posts        # Get all posts (with pagination)
POST   /api/posts        # Create new post (authenticated)
GET    /api/posts/{id}   # Get specific post
PUT    /api/posts/{id}   # Update post (author only)
DELETE /api/posts/{id}   # Delete post (author only)

# User Management
GET /api/users                    # Get all users
GET /api/users/{id}/activity      # Get user activity summary

# Statistics
GET /api/statistics              # Application statistics (authenticated)

# External Integration
GET /api/external/posts          # External posts from JSONPlaceholder

# System
GET /health                      # Health check with database stats
GET /                           # Basic status check
```

## 🚀 Next Steps

After successful setup, you can:

1. **Explore the API**: Use the Swagger documentation at `/docs`
2. **Customize the Frontend**: Modify React components and styling
3. **Extend Database Schema**: Add new tables and stored procedures
4. **Add New Features**: Implement comments, categories, or file uploads
5. **Deploy to Production**: Use Docker or cloud services for deployment

## 📝 Demo Credentials

The application comes with pre-configured demo users:

**Demo User 1:**
- Username: `demo`
- Password: `password123`
- Name: Demo User

**Demo User 2:**
- Username: `testuser`
- Password: `password123`
- Name: Test User

---

**Built with ❤️ using modern web technologies and enterprise architecture patterns.**

## 🏛️ N-Tier Architecture Benefits

### **Why Each Component is Used**

#### **Presentation Tier (Frontend)**
- **React with TypeScript**: Type safety, component reusability, and developer experience
- **Redux Toolkit**: Predictable state management, time-travel debugging, DevTools integration
- **Material-UI**: Consistent design system, accessibility features, responsive components
- **Vite**: Fast Hot Module Replacement (HMR), optimized builds, modern ES modules

#### **Business Logic Tier (Backend)**
- **FastAPI**: Auto-generated OpenAPI docs, built-in validation, high performance
- **Databases Library**: Async/await support, connection pooling, cross-database compatibility
- **Stored Procedures**: Database-level business logic, improved performance, data integrity
- **JWT Authentication**: Stateless auth, scalable across microservices, secure token-based auth

#### **Data Tier (Database)**
- **PostgreSQL**: ACID compliance, advanced SQL features, stored procedures, JSON support
- **Connection Pooling**: Resource efficiency, connection reuse, scalability
- **Input Validation**: Multi-layer security with client and server-side validation

### **Separation of Concerns**
- **Frontend**: Only UI logic and user interactions
- **Backend**: Business rules, authentication, data validation, API orchestration
- **Database**: Data integrity, complex queries, business logic functions, persistence

### **Scalability Benefits**
- Each tier can be scaled independently
- Database can be replicated/sharded
- Backend can be load balanced
- Frontend can use CDN distribution

## 📦 Database Schema & Stored Procedures

### **Database Tables**
```sql
users          # User accounts with hashed passwords
posts          # Blog posts with foreign key relationships
```

### **Stored Procedures Created**
```sql
get_post_statistics(user_id)              # Post statistics for user or overall
get_recent_posts(limit)                   # Recent posts with author info
get_user_profile(user_id)                 # User profile with post count
create_post_with_validation(...)          # Post creation with validation
get_user_activity_summary(user_id)        # User activity metrics
```

## 🔒 Security Features

### **Authentication & Authorization**
- JWT-based stateless authentication
- Password hashing with SHA-256 and salt
- Token expiration and refresh handling
- Protected API endpoints

### **Input Validation & Sanitization**
- **Client-side**: Real-time form validation with Material-UI
- **Server-side**: Pydantic models with custom validators
- **Database-level**: Stored procedure validation
- **XSS Protection**: Input sanitization and encoding
- **SQL Injection Prevention**: Parameterized queries and input validation

### **Data Security**
- Environment-based configuration
- Secure password storage (no plain text)
- CORS configuration for cross-origin requests
- Input length and pattern validation

## 🧪 Testing & Quality Assurance

### **Manual Testing Checklist**
- ✅ User registration with validation
- ✅ User authentication and session management
- ✅ CRUD operations for posts
- ✅ External API integration
- ✅ Input validation and error handling
- ✅ Responsive design on multiple devices
- ✅ Database stored procedures functionality

### **Performance Testing**
- Database query optimization with stored procedures
- API response time measurement
- Frontend bundle size optimization
- Connection pooling efficiency

## 📁 Project Structure

```
wti-tech/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Application pages/routes
│   │   ├── store/          # Redux state management
│   │   └── theme/          # Material-UI theme configuration
│   ├── package.json        # Frontend dependencies
│   └── vite.config.ts      # Vite configuration
├── backend/                 # FastAPI Python application
│   ├── app/
│   │   ├── api/v1/         # API endpoints
│   │   ├── core/           # Core utilities and configuration
│   │   └── db/             # Database configuration
│   ├── main.py             # FastAPI application entry point
│   ├── init_db.py          # Database initialization script
│   └── requirements.txt    # Python dependencies
├── database/               # Database scripts and migrations
│   ├── 01_schema.sql       # Database schema
│   ├── 02_sample_data_hashed.sql  # Sample data with hashed passwords
│   └── 03_stored_procedures.sql   # Business logic procedures
├── docker-compose.yml      # Container orchestration
└── README.md              # This documentation
```
