# ⚙️ CONFIGURATION SYSTEM QUICK REFERENCE

## How the Configuration Works

This application uses environment variables to switch between different configurations without changing code.

### Backend Configuration System

**Location**: `backend/config.py`
- Defines all configuration based on `ENVIRONMENT` variable
- Automatically loads CORS origins, database settings, etc.
- No code changes needed when switching environments

**Files**:
```
backend/.env.local          → Local development (no Docker)
backend/.env.docker         → Docker development (local)
backend/.env.production     → Cloud (Render)
backend/.env.server         → Server deployment
backend/.env.example        → Template (reference)
```

**Usage**:
```bash
# Set environment by choosing which .env file to use
cp backend/.env.docker backend/.env    # Use for Docker setup
cp backend/.env.local backend/.env     # Use for local setup
```

**How it works**:
1. Python reads `ENVIRONMENT` variable from `.env` file
2. `config.py` sets CORS origins, database connection, etc. based on environment
3. `main.py` imports and uses settings from `config.py`
4. No hardcoded URLs or CORS origins in code

---

### Frontend Configuration System

**Location**: `frontend/src/lib/config.ts`
- Reads `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_ENVIRONMENT` at build time
- Exports configuration object for use throughout app
- Auto-detects environment type based on variables

**Files**:
```
frontend/.env.local             → Local development (no Docker)
frontend/.env.docker            → Docker development (local)
frontend/.env.production.local   → Cloud (Vercel reference)
frontend/.env.server            → Server deployment
```

**Usage**:
```bash
# Next.js automatically uses .env.local for npm run dev
# Other environments need explicit specification or build-time variables

# Local development (npm run dev)
cp frontend/.env.local next.config.js

# Docker development (use root .env via docker-compose)
# Set NEXT_PUBLIC_API_URL in root .env for docker-compose to pass to container

# Vercel/Cloud deployment  
# Set variables in Vercel dashboard (Settings → Environment Variables)
```

**How it works**:
1. Create `.env.local` or other env files
2. `NEXT_PUBLIC_API_URL` gets compiled into JavaScript bundle at build time
3. `frontend/src/lib/config.ts` reads these variables
4. Apply configuration throughout the app via `import { config } from '@/lib/config'`

---

## Configuration Variables Explained

### Environment Variable: `ENVIRONMENT`

**Possible Values**:
- `local` - Direct execution without Docker
- `docker` - Docker Compose local development
- `production` - Cloud deployment (Vercel + Render)
- `server` - Self-hosted server with Docker

**What it controls (Backend)**:
```python
# Different CORS origins for each environment
if ENVIRONMENT == "local":
    CORS_ORIGINS = ["http://localhost:3000", ...]
elif ENVIRONMENT == "docker":
    CORS_ORIGINS = ["http://frontend:3000", ...]  # Docker network
elif ENVIRONMENT == "production":
    CORS_ORIGINS = ["https://yourapp.vercel.app", ...]
```

**What it controls (Frontend)**:
```typescript
const isDevelopment = environment === 'local' || isDev
const isProduction = environment === 'production'
const isDocker = environment === 'docker'
```

---

### Key Configuration Variables

#### Backend
| Variable | Purpose | Example |
|----------|---------|---------|
| `ENVIRONMENT` | Environment type | `local`, `docker`, `production`, `server` |
| `DATABASE_URL` | Database connection | `postgresql://user:pass@host/db` |
| `SECRET_KEY` | JWT signing key | 32+ random chars |
| `CORS_ORIGINS` | Allowed frontend domains | See config.py for defaults |

#### Frontend
| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API endpoint | `http://localhost:8000` |
| `NEXT_PUBLIC_ENVIRONMENT` | Environment type | `local`, `docker`, `production` |
| `NODE_ENV` | Node environment | `development`, `production` |

---

## Step-by-Step: Switching Environments

### Scenario 1: Switch to Docker Development (from Local)

**Backend**:
```bash
cd backend
rm .env  # Remove old .env
cp .env.docker .env
```

**Frontend**:
```bash
cd frontend
rm .env.local
cp .env.docker .env.local
```

**Root**:
```bash
cp .env.example .env
# Edit .env to set values for docker-compose
```

**Start**:
```bash
docker-compose up --build
```

---

### Scenario 2: Switch to Cloud Production

**Backend (on Render)**:
- Set in Render dashboard environment variables:
  ```
  ENVIRONMENT=production
  DATABASE_URL=<your-supabase-url>
  SECRET_KEY=<generate-new-key>
  ```

**Frontend (on Vercel)**:
- Set in Vercel dashboard environment variables:
  ```
  NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com
  NEXT_PUBLIC_ENVIRONMENT=production
  NODE_ENV=production
  ```

---

### Scenario 3: Switch to Server Deployment

**Backend**:
```bash
# On server
cp backend/.env.server backend/.env

# Edit values:
nano backend/.env
# Update DATABASE_URL, SECRET_KEY, CORS_ORIGINS
```

**Frontend**:
```bash
# On server (before building Next.js)
cp frontend/.env.server frontend/.env.production

# Or set as build environment variables
export NEXT_PUBLIC_API_URL=https://yourdomain.com
export NEXT_PUBLIC_ENVIRONMENT=server
npm run build
```

---

## How to Add New Configuration

### Add Backend Config Variable

1. Add to `backend/config.py`:
```python
MY_NEW_SETTING = os.getenv("MY_NEW_SETTING", "default_value")
```

2. Use in `backend/main.py`:
```python
from config import MY_NEW_SETTING
print(MY_NEW_SETTING)
```

3. Add to environment files:
```bash
# backend/.env.local
MY_NEW_SETTING=value_for_local

# backend/.env.docker
MY_NEW_SETTING=value_for_docker
```

### Add Frontend Config Variable

1. Add to `frontend/src/lib/config.ts`:
```typescript
export const getConfig = () => {
  return {
    // ... existing config
    myNewSetting: process.env.NEXT_PUBLIC_MY_NEW_SETTING || 'default',
  }
}
```

2. Use in components:
```typescript
import { config } from '@/lib/config'
console.log(config.myNewSetting)
```

3. Add to environment files:
```bash
# frontend/.env.local
NEXT_PUBLIC_MY_NEW_SETTING=value_for_local
```

---

## Verification: Check Your Configuration

### Backend
```bash
# Check backend config by looking at logs when app starts
docker logs gis-portal-backend | grep "\[CONFIG\]"

# Should show:
# [CONFIG] Environment: docker
# [CONFIG] Database: db:5432
# [CONFIG] CORS Origins: 3 configured
```

### Frontend
```bash
# Check frontend at runtime in browser console
# Open DevTools → Console
# Should show:
# [CONFIG] Frontend runtime config: {...}
```

---

## Troubleshooting Configuration Issues

### Backend CORS Error
**Problem**: Frontend gets 404 or CORS error
**Check**:
1. Verify `ENVIRONMENT` variable is correct
2. Check configured CORS origins: `docker logs`
3. Verify frontend URL matches one of CORS_ORIGINS

**Fix**:
```bash
# Check current config
cat backend/.env

# Update ENVIRONMENT if needed
ENVIRONMENT=docker  # or local, production, server
```

### Frontend Can't Reach Backend
**Problem**: API calls fail with connection refused
**Check**:
1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check if backend is running
3. Browser console should show API URL being used

**Fix**:
```bash
# Check env file being used
cat frontend/.env.local  # for local dev
cat frontend/.env.docker  # for docker dev

# Update if needed
NEXT_PUBLIC_API_URL=http://backend:8000  # for docker
```

### Environment Variable Not Being Read
**Problem**: Changes to `.env` not taking effect
**Solution**:
- **Backend**: Restart container `docker restart gis-portal-backend`
- **Frontend**: Restart dev server `npm run dev` or rebuild `npm run build`
- **Vercel**: Re-deploy after changing environment variables
- **Render**: Environment variables update automatically on re-deploy

---

## Summary

✅ **Configuration is environment-based**, not hardcoded
✅ **All settings in separate `.env` files** for different scenarios  
✅ **Easy to switch** between local, Docker, cloud, and server
✅ **No code changes** needed for different deployments
✅ **Clear documentation** for each environment type

---

**To use this system**:
1. Choose your environment scenario
2. Copy appropriate `.env` file
3. Update values as needed
4. Start the application
5. Configuration automatically applies

Done! 🎉
