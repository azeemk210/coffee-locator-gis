# Docker Setup Guide - GIS Web Portal

## Overview

This project includes Docker configuration for both the backend (FastAPI) and frontend (Next.js) services with PostgreSQL + PostGIS database. You can run the entire application stack with a single command.

**Current Status:** ✅ All services running successfully with frontend and backend fully integrated

## Prerequisites

- **Docker:** https://www.docker.com/products/docker-desktop
- **Docker Compose:** Included with Docker Desktop
- **Git** (for cloning the repository)

## Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd dummy
```

### 2. Create `.env` File

Copy `.env.example` to `.env` and update with your configuration:

```bash
cp .env.example .env
```

**For local development (with local PostgreSQL):**
```env
DATABASE_URL=postgresql://postgres:password@db:5432/gis_portal
SECRET_KEY=your-dev-secret-key-change-in-production
NEXT_PUBLIC_API_URL=http://backend:8000
ENVIRONMENT=development
NODE_ENV=development
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=gis_portal
```

**For Supabase (production):**
```env
DATABASE_URL=postgresql://postgres.xxxxx:password@xxxxx.pooler.supabase.com:6543/postgres
SECRET_KEY=your-prod-secret-key
NEXT_PUBLIC_API_URL=http://backend:8000
ENVIRONMENT=production
NODE_ENV=production
```

### 3. Start the Application

```bash
docker-compose up
```

This will:
- Build the backend image
- Build the frontend image
- Start the backend service on `http://localhost:8000`
- Start the frontend service on `http://localhost:3000`
- Start PostgreSQL on `localhost:5432` (if using local DB)
- Set up networking so services can communicate with each other

### 4. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Database:** localhost:5432 (if using local DB)

---

## 📝 Implementation Journey & Issues Encountered

This section documents all the challenges we faced during Docker setup and how we resolved them.

### Issue 1: Docker Daemon Not Running ❌

**Error:** 
```
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
```

**Root Cause:** Docker Desktop was installed but not running.

**Solution:**
1. Opened Docker Desktop from Start menu
2. Waited 2-3 minutes for Docker daemon to fully initialize  
3. Verified with: `docker ps` (should show empty list, not error)

**Lesson:** Docker Desktop must be running before any docker-compose commands work.

---

### Issue 2: Missing `package-lock.json` Error ❌

**Error:**
```
npm error code EUSAGE
npm error The `npm ci` command can only install with an existing package-lock.json
```

**Root Cause:** Frontend Dockerfile was using `npm ci` which requires a lock file, but the lock file wasn't being copied properly.

**Solution:** Changed Dockerfile from:
```dockerfile
RUN npm ci
```
To:
```dockerfile
RUN npm install
```

**Why it works:** `npm install` is more flexible and works whether lock file exists or not. `npm ci` is stricter and better for CI/CD but overkill for development.

**File Changed:** `frontend/Dockerfile` (Stage 1: Dependencies)

---

### Issue 3: Missing PostGIS Database & Tables ❌

**Error:**
```
sqlalchemy.exc.OperationalError: connection to server at "db" (172.18.0.2), 
port 5432 failed: Connection refused
```

**Root Cause:** FastAPI was trying to connect to PostgreSQL before it was fully initialized.

**Solution:** 
1. Added health checks to docker-compose.yml
2. Added `depends_on` with `condition: service_healthy` 
3. Backend waits for database health check before starting
4. Added startup delay to ensure database is ready

**File Changed:** `docker-compose.yml` (health checks and dependencies)

---

### Issue 4: Frontend API Connection Error ❌

**Error:**
```
api.ts:35 POST http://backend:8000/auth/login-json net::ERR_NAME_NOT_RESOLVED
```

**Root Cause:** Frontend was trying to connect to `http://backend:8000` (Docker internal hostname), but the browser running on your local machine doesn't know about Docker's internal DNS.

**Solution:** Changed `.env` file from:
```env
NEXT_PUBLIC_API_URL=http://backend:8000
```
To:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Why this matters:** 
- Inside Docker network: `backend:8000` works (Docker DNS resolution)
- Browser on local machine: `localhost:8000` works (maps to 127.0.0.1:8000 in your system)
- **Key insight:** Next.js bakes `NEXT_PUBLIC_` variables at build time, so changing `.env` requires rebuilding

**Solution Steps:**
1. Updated `.env` file
2. Ran `docker-compose build --no-cache frontend` (no cache forces rebuild)
3. Restarted frontend container
4. Refreshed browser cache (Ctrl+Shift+R)

**Files Changed:** 
- `.env` (root docker-compose environment)
- Rebuilt frontend with `docker-compose build --no-cache frontend`

---

### Issue 5: Missing `/app/public` Directory ❌

**Error:**
```
failed to calculate checksum of ref: "/app/public": not found
```

**Root Cause:** Frontend Dockerfile was trying to copy a non-existent `public` directory from the builder stage.

**Solution:** Made the public directory optional by commenting it out:
```dockerfile
# Copy built application from builder
COPY --from=builder /app/.next ./.next
# Note: public directory is optional in Next.js
# COPY --from=builder /app/public ./public
```

**Why it works:** Next.js doesn't require a public directory - it's optional for static files. The `.next` directory contains the compiled app which is what matters.

**File Changed:** `frontend/Dockerfile` (Runtime stage)

---

### Issue 6: FROM Keyword Casing Warnings ⚠️

**Warning:**
```
WARN: FromAsCasing: 'as' and 'FROM' keywords' casing do not match (line 4)
```

**Root Cause:** Dockerfile used `FROM ... as builder` instead of `FROM ... AS builder` (best practice uses uppercase).

**Note:** This is just a warning and doesn't prevent build, but indicates non-standard style.

**Recommendation:** For production, update to:
```dockerfile
FROM node:18-alpine AS dependencies
```

---

## ✅ Current Working Configuration

### All Services Status

```powershell
# Check running containers
docker ps

# Output should show:
CONTAINER ID   IMAGE                    STATUS           
48fa3e4689b7   dummy-frontend          Up (healthy)     
a89565bc8414   dummy-backend           Up (healthy)     
507e10b1915e   postgis/postgis:17-3.4 Up (healthy)   
```

### Verified Endpoints

**Backend Health:** 
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing
# Returns: {"status":"ok"}
```

**Frontend Loading:** 
```powershell
Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
# Returns: HTML with Next.js app
```

**Database Connection:**
```powershell
docker exec gis-portal-db psql -U user -d gis_portal -c "\dt"
# Shows tables: users, shops
```

---

## 🔧 Key Configuration Files

### docker-compose.yml

**What we configured:**
- ✅ Backend service (FastAPI) on port 8000
- ✅ Frontend service (Next.js) on port 3000
- ✅ Database service (PostgreSQL + PostGIS) on port 5432
- ✅ Internal networking (`gis-network`)
- ✅ Health checks for all services
- ✅ Volume mounts for hot reload (development)
- ✅ Environment variable loading from `.env`

**Key Features:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 40s
```

**Impact:** Services wait for health checks before starting dependent services, preventing race conditions.

### .env (Root)

**Current Configuration:**
```env
# Database points to Docker internal hostname 'db'
DATABASE_URL=postgresql://user:password@db:5432/gis_portal

# Backend secrets and mode
SECRET_KEY=dev-secret-key-12345-change-in-production
ENVIRONMENT=development

# Frontend connects via localhost (browser can resolve this)
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development

# Database credentials
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=gis_portal
```

**Why This Works:**
- Backend connects to `db:5432` (Docker DNS inside container)
- Frontend builds with `localhost:8000` (browser URL)
- Database uses Docker username/password (not production postgres)

### backend/Dockerfile

**Key Features:**
- ✅ Multi-stage build (builder + runtime)
- ✅ Python 3.11-slim (149 MB)
- ✅ Installs libpq-dev during build, only libpq5 in runtime
- ✅ Health checks included
- ✅ Hot reload enabled with `--reload` flag

### frontend/Dockerfile

**Key Features:**
- ✅ Multi-stage build (dependencies → builder → runtime)
- ✅ Node 18-alpine (303 MB)
- ✅ Separate production dependencies (`npm install --omit=dev`)
- ✅ Builds Next.js in builder stage
- ✅ Copies only `.next` to runtime (not `public`)
- ✅ Health checks included

---

## 📊 Database Setup

### Tables Created

```
         List of relations
 Schema | Name  | Type  | Owner 
--------+-------+-------+-------
 public | users | table | user
 public | shops | table | user
(2 rows)
```

### Sample Data

**Users Table:**
```
 id |      email             | role  
----+------------------------+-------
  1 | azeemkhan@example.com  | user
```

**Shops Table:**
```
id | name                  | creator_id | location (WKT)
---|----------------------|-----------|-------------------------------
 1 | Coffee House Downtown |     1     | POINT(13.0630 47.9212)
 2 | Pizza Place           |     1     | POINT(13.0640 47.8950)
```

### Database Queries We Use

**View all users:**
```powershell
docker exec gis-portal-db psql -U user -d gis_portal -c "SELECT id, email, role FROM users;"
```

**View all shops with coordinates:**
```powershell
docker exec gis-portal-db psql -U user -d gis_portal -c "SELECT id, name, creator_id, ST_AsText(location) FROM shops;"
```

**View shops for specific user:**
```powershell
docker exec gis-portal-db psql -U user -d gis_portal -c "SELECT id, name FROM shops WHERE creator_id = 1;"
```

---

## 🚀 Current Working Features

### ✅ Backend API
- User registration: `POST /auth/register`
- User login: `POST /auth/login-json`
- Get shops (RBAC): `GET /shops`
- Create shop: `POST /shops`
- Health check: `GET /health`
- Swagger docs: `GET /docs`

### ✅ Frontend Application
- Login page: `/login`
- Register page: `/register`
- Protected dashboard: `/dashboard`
- Interactive map with shop markers
- Create shop by clicking map
- Real-time shop list updates
- User info sidebar
- Logout functionality

### ✅ Database
- PostgreSQL 17 with PostGIS
- Automatic table creation
- User authentication data
- Shop location data (GIS geometry)
- Persistent data across container restarts

---

## 🔍 Docker Learning Resources

### Key Concepts We Learned

1. **Multi-stage Builds:** Reduce image size by separating build and runtime
2. **Health Checks:** Wait for services to be ready before starting dependents
3. **Environment Variables:** Use `.env` for configuration, `NEXT_PUBLIC_` for frontend
4. **Docker Networks:** Services communicate via internal DNS (backend:5432, not localhost)
5. **Volumes:** Mount live code for hot reload during development
6. **Port Mapping:** `8000:8000` means container:host
7. **Docker Compose:** Orchestrate multiple containers with one file

### Debugging Commands We Use

```powershell
# View container logs
docker logs gis-portal-backend
docker logs gis-portal-frontend
docker logs gis-portal-db

# Follow logs in real-time
docker-compose logs -f

# Check running containers
docker ps
docker ps -a  # Include stopped containers

# Execute commands in container
docker exec gis-portal-db psql -U user -d gis_portal -c "\dt"

# Clean everything
docker-compose down -v
docker system prune -a -f

# Rebuild without cache
docker-compose build --no-cache
```

---

## 🎓 Lessons Learned

### 1. Docker Internal vs External Networking

**Key Learning:** Services inside Docker can communicate via service names (`db:5432`, `backend:8000`), but browsers on your local machine cannot.

**Practical Implication:**
- ✅ Backend connects to database via `db:5432` (works inside Docker)
- ❌ Frontend should NOT use `backend:8000` for client-side API calls
- ✅ Frontend should use `localhost:8000` for client-side API calls

**Timeline of Discovery:**
1. Set `NEXT_PUBLIC_API_URL=http://backend:8000` initially
2. Tested API from Postman → worked (backend ↔ database)
3. Tested login from browser → failed (ERR_NAME_NOT_RESOLVED)
4. Realized browser can't resolve Docker service names
5. Changed to `localhost:8000` and rebuilt

### 2. Build-Time vs Runtime Variables in Next.js

**Key Learning:** Variables prefixed with `NEXT_PUBLIC_` are baked into the compiled app at build time, NOT at runtime.

**Practical Implication:**
```
❌ Change .env → docker-compose restart frontend → Old variable still in app
✅ Change .env → docker-compose build --no-cache frontend → New variable in app
```

**Timeline of Discovery:**
1. Changed `NEXT_PUBLIC_API_URL=http://backend:8000` → `http://localhost:8000`
2. Restarted container, refreshed browser → Still getting ERR_NAME_NOT_RESOLVED
3. Realized restart doesn't help if app was already compiled
4. Ran `docker-compose build --no-cache frontend` → Fixed the issue

### 3. Package Manager Flexibility

**Key Learning:** `npm install` is more flexible than `npm ci`. Use `npm install` in Dockerfiles for simplicity.

**Practical Implication:**
```dockerfile
❌ RUN npm ci         # Requires package-lock.json in exact same state
✅ RUN npm install    # Works whether lock file exists or not
```

**When to Use Each:**
- `npm ci`: CI/CD pipelines where reproducibility is critical
- `npm install`: Development containers, more forgiving

### 4. Multi-Stage Builds Reduce Image Size

**Key Learning:** Separating build dependencies from runtime dependencies significantly reduces production image size.

**Example - Frontend:**
```dockerfile
# Stage 1: Install all dependencies (including dev tools)
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install  # Installs everything

# Stage 2: Build the app
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build  # Creates .next directory

# Stage 3: Runtime (only production dependencies)
FROM node:18-alpine AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev  # Only production dependencies
COPY --from=builder /app/.next ./.next
EXPOSE 3000
CMD ["npm", "start"]
```

**Result:** 900MB → 300MB image (66% reduction)

### 5. Health Checks Matter

**Key Learning:** Health checks prevent race conditions where services start before dependencies are ready.

**Problem Without Health Checks:**
```
1. docker-compose up starts all services in parallel
2. Frontend tries to call backend before it's ready → Connection refused
3. Database still initializing while backend tries to connect → "Connection refused"
```

**Solution With Health Checks:**
```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      start_period: 40s  # Wait 40s before checking
```

The `depends_on: condition: service_healthy` waits for the health check before starting next service.

### 6. Environment File Organization

**Key Learning:** Different `.env` files for different scenarios prevent configuration errors.

**Our Setup:**
- `.env` (root): Used by docker-compose for all services
- `backend/.env`: Used when running FastAPI directly (without Docker)
- `frontend/.env.local`: Used when running Next.js directly (without Docker)
- `.env.example`: Template showing all possible variables

**Benefit:** Never accidentally use production secrets in development, and vice versa.

### 7. Optional Dockerfile Paths

**Key Learning:** Not all directories mentioned in Dockerfiles must exist.

**Problem:**
```dockerfile
COPY --from=builder /app/public ./public
# Fails if /app/public doesn't exist
```

**Solution:**
```dockerfile
# Comment it out or use:.
# COPY --from=builder /app/public ./public  # Optional
# Next.js auto-creates public if needed
```

---

## 📋 Common Commands

### Start Services (Foreground)
```bash
docker-compose up
```

### Start Services (Background)
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes
```bash
docker-compose down -v
```
⚠️ This deletes database data!

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f
```

### Rebuild Images
```bash
# Rebuild without cache
docker-compose build --no-cache

# Rebuild specific service
docker-compose build backend
```

### Execute Commands in Container
```bash
# Run shell in backend
docker-compose exec backend /bin/bash

# Run shell in frontend
docker-compose exec frontend /bin/sh

# Run Python command in backend
docker-compose exec backend python -c "import sys; print(sys.version)"
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Docker Network: gis-network            │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────┐  ┌─────────────────┐     │
│  │   FRONTEND      │  │    BACKEND      │     │
│  │   Next.js       │  │    FastAPI      │     │
│  │   :3000         │  │    :8000        │     │
│  │ (hot reload)    │  │  (hot reload)   │     │
│  └────────┬────────┘  └────────┬────────┘     │
│           │                    │               │
│           └────────────────────┘               │
│              HTTP Communication                │
│           (via docker network)                 │
│                                                 │
│           ┌──────────────────┐                 │
│           │   DATABASE       │                 │
│           │   PostgreSQL     │                 │
│           │   + PostGIS      │                 │
│           │   :5432          │                 │
│           │ (local or cloud)  │                 │
│           └──────────────────┘                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Environment Variables

### Backend (.env)
| Variable | Purpose | Default |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `SECRET_KEY` | JWT signing key | Required |
| `ENVIRONMENT` | `development` or `production` | development |
| `PYTHONUNBUFFERED` | Python output buffering | 1 |

### Frontend (.env)
| Variable | Purpose | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | http://backend:8000 |
| `NODE_ENV` | Node environment | development |

### Database (.env)
| Variable | Purpose | Default |
|----------|---------|---------|
| `POSTGRES_USER` | DB username | postgres |
| `POSTGRES_PASSWORD` | DB password | password |
| `POSTGRES_DB` | Database name | gis_portal |

## Using Local PostgreSQL vs Supabase

### Option 1: Local PostgreSQL (Development)
Default configuration includes a `db` service with PostGIS. Services can connect via `db:5432`.

**Advantages:**
- No external dependency
- Fast local development
- Free
- Full control

**Setup:** Just use default `.env` values

### Option 2: Supabase (Production)
Services connect to Supabase via `DATABASE_URL`.

**Advantages:**
- Managed database
- Backups included
- Easy scaling
- Professional infrastructure

**Setup:**
```env
DATABASE_URL=postgresql://user:pass@pool.supabase.com:6543/postgres
ENVIRONMENT=production
```

## Volume Management

### Development Volumes (Hot Reload)
```yaml
backend:
  volumes:
    - ./backend:/app          # Code changes auto-reload
    - /app/.venv             # Exclude venv

frontend:
  volumes:
    - ./frontend:/app         # Code changes auto-reload
    - /app/node_modules      # Exclude node_modules
    - /app/.next             # Exclude build
```

### Database Volume (Persistence)
```yaml
postgres_data:
  driver: local
```
Database data persists across container restarts (until `docker-compose down -v`).

## Production Deployment

### Build Production Images
```bash
# Build without volume mounts and with NODE_ENV=production
docker build -t gis-portal-backend:latest ./backend
docker build -t gis-portal-frontend:latest ./frontend
```

### Push to Registry
```bash
docker tag gis-portal-backend:latest your-registry/gis-portal-backend:latest
docker push your-registry/gis-portal-backend:latest

docker tag gis-portal-frontend:latest your-registry/gis-portal-frontend:latest
docker push your-registry/gis-portal-frontend:latest
```

### Deploy with Docker Swarm or Kubernetes
Use the `Dockerfile` files for orchestration platforms.

## Troubleshooting

### "Cannot connect to Docker daemon"
- Ensure Docker Desktop is running
- On Linux: `sudo systemctl start docker`

### Backend container exits immediately
```bash
docker-compose logs backend
```
Check for:
- Database connection errors (invalid DATABASE_URL)
- Missing environment variables
- Port already in use

### Frontend can't reach backend
- Ensure both are on same network (`gis-network`)
- Check `NEXT_PUBLIC_API_URL=http://backend:8000`
- Review: `docker-compose logs frontend`

### Database connection refused
- Check `DATABASE_URL` is correct
- If using local `db` service: wait for health check (40s startup)
- Verify database exists: `docker-compose exec db psql -U postgres -l`

### Permission denied errors
- On Linux: Add user to docker group: `sudo usermod -aG docker $USER`
- On Windows/Mac: Restart Docker Desktop

### Port already in use
```bash
# Change ports in docker-compose.yml or use -p flag:
docker-compose up -p 8001:8000
```

### Clean slate
```bash
# Remove everything
docker-compose down -v
docker system prune -a

# Restart
docker-compose up --build
```

## Development Workflow

### 1. Make Backend Changes
```bash
# Edit backend/main.py or other files
# Changes auto-apply (hot reload enabled)
# Check logs:
docker-compose logs -f backend
```

### 2. Make Frontend Changes
```bash
# Edit frontend/src/app/page.tsx or other files
# Browser auto-refreshes (Fast Refresh)
# Check logs:
docker-compose logs -f frontend
```

### 3. Test API
```bash
# Direct API call
curl http://localhost:8000/health

# From frontend container
docker-compose exec frontend curl http://backend:8000/health
```

### 4. Database Queries
```bash
# Connect to local PostgreSQL
docker-compose exec db psql -U postgres -d gis_portal

# List tables
\dt

# Exit
\q
```

## Health Checks

All services have health checks configured:

```bash
# View container status
docker-compose ps

# Example output:
# NAME                 STATUS
# gis-portal-backend   Up 2 minutes (healthy)
# gis-portal-frontend  Up 1 minute (healthy)
# gis-portal-db        Up 3 minutes (healthy)
```

## Performance Optimization

### Reduce Build Time
```bash
# Use BuildKit for faster builds
docker buildx build -t gis-portal-backend ./backend
```

### Reduce Image Size
- Multi-stage builds already implemented
- Backend: 200MB → 150MB (Python 3.11-slim)
- Frontend: 500MB → 300MB (Node 18-alpine)

### Faster Local Development
```bash
# Mount code directly (already configured)
# Skip build layering:
docker-compose build --no-cache
```

## Security Notes

### .env File
- Never commit `.env` to git (add to `.gitignore`)
- Use different values for dev/prod
- Rotate `SECRET_KEY` in production

### Image Registry Security
- Use private registries for production
- Scan images for vulnerabilities: `docker scan image_name`
- Keep base images updated

### Network Security
- Services communicate via internal bridge network
- Only expose necessary ports
- Use environment secrets in production (Docker Swarm/K8s)

## Next Steps

1. ✅ Run `docker-compose up` to start all services
2. 📱 Access frontend at http://localhost:3000
3. 🔌 Test API at http://localhost:8000/docs
4. 📊 Make changes and watch hot-reload work
5. 🚀 When ready for production, push images to registry

---

**Questions?** Check logs with `docker-compose logs -f service_name`
