# Environment Configuration Guide

## Overview

This document explains how to manage environment variables for the GIS Portal across different deployment scenarios.

**Key Principle:** 
- **Templates stay in git:** `.env.docker`, `.env.local`, `.env.server`
- **Active files ignored:** `.env`, `.env.production.local` are gitignored

---

## Environment Structure

### Frontend Templates

```
frontend/
├── .env.docker      ← Use for local Docker + Nginx
├── .env.local       ← Use for local development (npm run dev)
├── .env.server      ← Template for server deployment
├── .env             ← IGNORED (generated from templates)
└── .env.production.local ← IGNORED (causes conflicts)
```

### Backend Templates

```
backend/
├── .env.docker      ← Use for local Docker
├── .env.local       ← Use for local development
├── .env.server      ← Template for server deployment
└── .env             ← IGNORED (generated from templates)
```

---

## Deployment Scenarios

### Scenario 1: Local Development WITHOUT Docker

**When to use:** Learning, debugging, development before containerization

**Setup:**

```bash
# Frontend
cd frontend
cp .env.local .env
npm install
npm run dev

# Backend (separate terminal)
cd backend
cp .env.local .env
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

**Access Points:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

**API URL:** `http://localhost:8000` (direct, no proxy)

**Environment Values:**
```
Frontend (.env.local):
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENVIRONMENT=local
NODE_ENV=development

Backend (.env.local):
ENVIRONMENT=local
DATABASE_URL=postgresql://postgres:password@localhost:5432/gis_portal
```

---

### Scenario 2: Local Docker with Nginx Reverse Proxy

**When to use:** Testing Docker setup, validating production config locally

**Setup:**

```bash
# Copy Docker configs
cp frontend/.env.docker frontend/.env
cp backend/.env.docker backend/.env

# Stop old containers (if any)
docker-compose down

# Build and start all services
docker-compose up -d --build
```

**Verify all 4 containers running:**
```bash
docker-compose ps
```

Expected output:
```
gis-portal-nginx      running    port 80
gis-portal-frontend   running    port 3000
gis-portal-backend    running    port 8000
gis-portal-db         running    port 5432
```

**Access Points:**
- Frontend: `http://localhost` (port 80, Nginx proxy)
- Internal Frontend: `http://localhost:3000`
- Internal Backend: `http://localhost:8000`
- Database: `localhost:5432`

**API URL:** `http://localhost/api` (Nginx routes `/api/*` to backend)

**Environment Values:**
```
Frontend (.env.docker):
NEXT_PUBLIC_API_URL=http://localhost/api
NEXT_PUBLIC_ENVIRONMENT=docker
NODE_ENV=production

Backend (.env.docker):
ENVIRONMENT=docker
DATABASE_URL=postgresql://user:password@db:5432/gis_portal
PYTHONUNBUFFURABLE=1
```

**Testing Workflow:**
```bash
# 1. Open browser at http://localhost
# 2. Register a test account
# 3. Login
# 4. Create a shop by clicking the map
# 5. Click/hover marker to see popup
# 6. Open DevTools (F12) → Network tab
# 7. Verify API calls show: http://localhost/api/...
```

**View Logs:**
```bash
docker-compose logs frontend -f    # Frontend logs
docker-compose logs backend -f     # Backend logs
docker-compose logs nginx -f       # Nginx logs
docker-compose logs -f             # All services
```

---

### Scenario 3: Server Deployment with Docker & Nginx

**When to use:** Production or self-hosted deployment

**Prerequisites:**
- Ubuntu server with Docker installed
- Server IP: `192.168.120.65` (update to your actual IP)

**Setup:**

```bash
# On server
cd ~/eControl/coffee-locator-final/coffee-locator-gis

# Pull latest code from GitHub
git pull

# Create .env files on server (NOT from .env.server template)
# Frontend config
echo 'NEXT_PUBLIC_API_URL=http://192.168.120.65/api' > frontend/.env
echo 'NEXT_PUBLIC_ENVIRONMENT=docker' >> frontend/.env
echo 'NODE_ENV=production' >> frontend/.env

# Backend config
echo 'ENVIRONMENT=docker' > backend/.env
echo 'DATABASE_URL=postgresql://postgres:password@db:5432/gis_portal' >> backend/.env
echo 'PYTHONUNBUFFURABLE=1' >> backend/.env

# PostgreSQL config
echo 'POSTGRES_USER=postgres' >> .env
echo 'POSTGRES_PASSWORD=password' >> .env
echo 'POSTGRES_DB=gis_portal' >> .env

# Rebuild and start
sudo docker-compose down
sudo docker-compose up -d --build

# Verify all running
sudo docker-compose ps
```

**Access Points:**
- Application: `http://192.168.120.65` (port 80, Nginx proxy)
- Internal Frontend: `192.168.120.65:3000`
- Internal Backend: `192.168.120.65:8000`
- Database: `192.168.120.65:5432`

**API URL:** `http://192.168.120.65/api` (Nginx routes to backend)

---

## Quick Reference Table

| Aspect | Local (No Docker) | Local Docker | Server |
|--------|------|---------|--------|
| **FE Config** | `.env.local` | `.env.docker` | Custom `.env` |
| **BE Config** | `.env.local` | `.env.docker` | Custom `.env` |
| **API URL** | `http://localhost:8000` | `http://localhost/api` | `http://192.168.120.65/api` |
| **Access** | `http://localhost:3000` | `http://localhost` | `http://192.168.120.65` |
| **Database** | localhost:5432 (external) | Docker network | Docker network |
| **Port 80** | ❌ No | ✅ Nginx | ✅ Nginx |
| **Containers** | 0 (native) | 4 (nginx, frontend, backend, db) | 4 (nginx, frontend, backend, db) |

---

## Environment Variable Reference

### Frontend (Next.js)

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API endpoint (accessible to browser) | `http://localhost:8000` |
| `NEXT_PUBLIC_ENVIRONMENT` | Environment label for logging | `local`, `docker`, `server` |
| `NODE_ENV` | Build mode | `development`, `production` |
| `PORT` | Server port (local dev only) | `3000` |

### Backend (FastAPI)

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@db:5432/gis_portal` |
| `ENVIRONMENT` | Environment context | `local`, `docker`, `server` |
| `PYTHONUNBUFFURABLE` | Python buffering (Docker) | `1` |
| `SECRET_KEY` | JWT secret (optional) | `your-secret-key` |
| `CORS_ORIGINS` | Allowed CORS origins (optional) | See CORS config in main.py |

### Database

| Variable | Purpose | Example |
|----------|---------|---------|
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `password` |
| `POSTGRES_DB` | Database name | `gis_portal` |

---

## Workflow for Changes

### Adding New .env Variable

1. **Add to all three templates** (`.env.docker`, `.env.local`, `.env.server`):
   ```bash
   # frontend/.env.docker
   NEW_VAR=value_for_docker
   
   # frontend/.env.local
   NEW_VAR=value_for_local
   
   # frontend/.env.server
   NEW_VAR=value_for_server
   ```

2. **Use in code:**
   ```typescript
   // frontend/src/lib/config.ts
   const newVar = process.env.NEXT_PUBLIC_NEW_VAR || 'default'
   ```

3. **Commit templates to git:**
   ```bash
   git add frontend/.env.docker frontend/.env.local frontend/.env.server
   git commit -m "Add NEW_VAR to all environment templates"
   git push
   ```

4. **Update running instances:**
   - **Local Docker:** `cp frontend/.env.docker frontend/.env && docker-compose up -d --build`
   - **Server:** SSH → manually update `frontend/.env` → `docker-compose up -d --build`

---

## Troubleshooting

### Issue: API calls going to wrong URL

**Symptom:** Console shows `http://localhost:8000` but should show `http://localhost/api`

**Solution:**
```bash
# Verify correct .env is copied
cat frontend/.env

# Rebuild with --no-cache to force new build
docker-compose down
docker-compose up -d --build --no-cache frontend
```

### Issue: .env file in git (not ignored)

**Symptom:** `.env` appears in git status

**Solution:**
```bash
# Remove from git tracking
git rm --cached frontend/.env backend/.env

# Verify .gitignore has .env listed
cat frontend/.gitignore | grep "^.env$"

# Commit
git commit -m "Remove active .env files from git tracking"
git push
```

### Issue: Nginx not routing correctly

**Symptom:** API calls fail with 502 Bad Gateway

**Solution:**
```bash
# Check Nginx logs
docker-compose logs nginx -f

# Verify backend is running
docker-compose logs backend

# Check docker network
docker network ls
docker network inspect gis-network
```

### Issue: Database connection failed

**Symptom:** Backend cannot connect to database

**Solution:**
```bash
# Verify DATABASE_URL in backend/.env
cat backend/.env | grep DATABASE_URL

# Check database container status
docker-compose logs db

# Test connection from another container
docker-compose exec backend psql $DATABASE_URL
```

---

## Best Practices

✅ **DO:**
- Keep template files (`.env.docker`, `.env.local`, `.env.server`) in git
- Ignore active `.env` files in `.gitignore`
- Copy from templates: `cp .env.docker .env`
- Use `docker-compose --build --no-cache` after env changes
- Document sensitive values in comments

❌ **DON'T:**
- Commit actual `.env` files with secrets to git
- Use `.env.production.local` (conflicts with Next.js)
- Mix different environment configs
- Manually edit `.env` files in git

---

## Quick Commands

```bash
# Local Docker setup
cp frontend/.env.docker frontend/.env && cp backend/.env.docker backend/.env && docker-compose up -d --build

# Local development
cp frontend/.env.local frontend/.env && cp backend/.env.local backend/.env && npm run dev

# Server deployment
git pull && sudo docker-compose down && sudo docker-compose up -d --build

# View all logs
docker-compose logs -f

# Restart a service
docker-compose restart frontend

# Clean rebuild
docker-compose down && docker system prune -f && docker-compose up -d --build
```

---

**Last Updated:** April 16, 2026  
**Status:** ✅ Production Ready
