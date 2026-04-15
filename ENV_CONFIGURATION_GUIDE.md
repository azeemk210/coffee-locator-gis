# Environment Configuration Guide

## 📋 Overview

This project has multiple environment files for different scenarios:

| File | Purpose | When to Use |
|------|---------|-------------|
| `.env` | Root env for docker-compose | Running `docker-compose up` |
| `backend/.env` | Backend FastAPI config | Running backend directly or Docker |
| `frontend/.env.local` | Frontend Next.js config | Running frontend directly or Docker |
| `.env.example` | Template (DON'T EDIT) | Reference for all possible variables |

---

## 🚀 Scenarios & Configuration

### Scenario 1: Local Development (Without Docker)

**Terminal 1 - Backend:**
```bash
cd backend
# Use: backend/.env
# Must have:
DATABASE_URL=postgresql://user:password@localhost:5432/gis_portal
SECRET_KEY=your-dev-key
ENVIRONMENT=development

uvicorn main:app --reload  # Runs on :8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
# Use: frontend/.env.local
# Must have:
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development

npm run dev  # Runs on :3000
```

---

### Scenario 2: Docker Development (Recommended)

**Single Command:**
```bash
# Use: .env (root) + backend/Dockerfile + frontend/Dockerfile
docker-compose up
```

**Environment Variables Used:**
- From `.env` (root)
- Backend gets: `DATABASE_URL`, `SECRET_KEY`, `ENVIRONMENT`
- Frontend gets: `NEXT_PUBLIC_API_URL`, `NODE_ENV`
- Database gets: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`

**Key Difference:**
- `DATABASE_URL=postgresql://user:password@db:5432/gis_portal`
  - Uses `db` hostname (Docker service name)
  - NOT `localhost` (that's the host machine)

---

### Scenario 3: Production on Render

**Prerequisites:**
- Push code to GitHub
- Create Render web service
- Add environment variables in Render dashboard

**Required Render Environment Variables:**
```
DATABASE_URL=postgresql://postgres.xxxxx:password@xxxxx.pooler.supabase.com:6543/postgres
SECRET_KEY=production-secure-random-key-here
ENVIRONMENT=production
```

**Optional for Frontend (Vercel):**
```
NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com
NODE_ENV=production
```

---

## 📝 Current File Status

### ✅ `.env` (Root)
```
✅ DATABASE_URL: Points to local Docker DB (db:5432)
✅ SECRET_KEY: Configured for development
✅ ENVIRONMENT: Set to development
✅ POSTGRES credentials: Match docker-compose.yml
✅ NEXT_PUBLIC_API_URL: Uses Docker internal network (backend:8000)
✅ NODE_ENV: development
```

### ✅ `backend/.env`
```
✅ DATABASE_URL: Points to local Docker DB (db:5432)
✅ SECRET_KEY: Configured
✅ ENVIRONMENT: development
✅ PYTHONUNBUFFERABLE: 1 (proper logging)
✅ Includes Supabase URLs (commented out for easy switching)
```

### ✅ `frontend/.env.local`
```
✅ NEXT_PUBLIC_API_URL: http://localhost:8000 (direct local dev)
✅ NODE_ENV: development
✅ PORT: 3000
✅ Includes docker-compose URL (commented, for easy switching)
✅ Includes production Render URL (commented)
```

### ✅ `.env.example` (Template)
```
✅ Complete reference for all variables
✅ Well-commented sections
✅ Shows both local and Supabase options
```

---

## 🔧 How to Switch Between Environments

### Switch: Local Dev → Docker Compose

**What to do:**
1. No changes needed!
2. `.env` (root) already configured for docker-compose
3. Just run: `docker-compose up`

### Switch: Local Dev → Supabase Production

**In `backend/.env`:**
```diff
- DATABASE_URL=postgresql://user:password@db:5432/gis_portal
+ DATABASE_URL="postgresql://postgres.giwyagmjthbvkoynijhb:Salzach%400210@aws-1-eu-central-2.pooler.supabase.com:6543/postgres"

- ENVIRONMENT=development
+ ENVIRONMENT=production
```

### Switch: Docker → Direct Local Dev

**In `backend/.env`:**
```diff
- DATABASE_URL=postgresql://user:password@db:5532/gis_portal
+ DATABASE_URL=postgresql://user:password@localhost:5432/gis_portal
```

**In `frontend/.env.local`:**
```diff
- # NEXT_PUBLIC_API_URL=http://backend:8000
+ NEXT_PUBLIC_API_URL=http://localhost:8000  (uncomment this)
```

### Switch: Docker Backend → Render Frontend

**In `frontend/.env.local`:**
```diff
- NEXT_PUBLIC_API_URL=http://backend:8000
+ NEXT_PUBLIC_API_URL=https://your-render-service.onrender.com
```

And add to Render dashboard environment variables:
```
NEXT_PUBLIC_API_URL=https://your-render-service.onrender.com
```

---

## 🔐 Secret Key Generation

For production, generate a secure `SECRET_KEY`:

**PowerShell:**
```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Output example:**
```
Drmhze6EPcv0fN_81Bj-nA_5K1hQxKB_7LzLkwFng-0
```

Copy this value to `SECRET_KEY` in production environment.

---

## 🚨 Credentials in Different Environments

### Development (`.env`)
```
DATABASE_URL=postgresql://user:password@db:5432/gis_portal
SECRET_KEY=dev-secret-key-12345-change-in-production
```
✅ Safe for local development
⚠️ Never commit to git

### Production (Render Dashboard)
```
DATABASE_URL=postgresql://postgres.xxxxx:password@xxxxx.pooler.supabase.com:6543/postgres
SECRET_KEY=production-secure-random-key-here
ENVIRONMENT=production
```
✅ Set in Render UI (not in code)
✅ Render keeps secrets encrypted

---

## 📋 Checklist: Before Running

### Local Development
- [ ] `backend/.env` exists with `DATABASE_URL`, `SECRET_KEY`
- [ ] `frontend/.env.local` exists with `NEXT_PUBLIC_API_URL`
- [ ] PostgreSQL running on `localhost:5432` (or configured URL)

### Docker Compose
- [ ] `.env` exists in root
- [ ] `docker-compose.yml` present
- [ ] Both `Dockerfile`s created
- [ ] Run: `docker-compose up`

### Production (Render)
- [ ] Code pushed to GitHub
- [ ] Render environment variables set (DATABASE_URL, SECRET_KEY)
- [ ] PostGIS extension enabled in Supabase
- [ ] Database tables created

### Production (Vercel Frontend)
- [ ] `NEXT_PUBLIC_API_URL` points to Render backend
- [ ] `NODE_ENV=production`

---

## 🔄 Priority Order (for each environment)

**Local Dev:**
1. `backend/.env` (for uvicorn)
2. `frontend/.env.local` (for npm run dev)

**Docker:**
1. `.env` (root) - docker-compose reads this
2. `docker-compose.yml` - passes to containers

**Production:**
1. Render dashboard env vars (backend)
2. Vercel dashboard env vars (frontend)
3. Supabase dashboard settings (database)

---

## ❓ Troubleshooting

### "cannot connect to database"
- Check `DATABASE_URL` format is correct
- For Docker: use `db:5432` not `localhost:5432`
- For Supabase: use port `6543` not `5432`

### "frontend can't reach backend"
- Check `NEXT_PUBLIC_API_URL` matches backend URL
- For Docker: should be `http://backend:8000`
- For local: should be `http://localhost:8000`

### "SECRET_KEY not found"
- Add to `backend/.env`: `SECRET_KEY=your-key-here`
- Restart backend: `docker-compose restart backend`

### "env variables not loading"
- Check `.env` is in the same directory as `docker-compose.yml`
- Docker only reads `.env` from working directory
- Explicit variables override `.env`

---

## 📚 Environment Variables Reference

### Backend Variables
| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@db:5432/gis_portal` |
| `SECRET_KEY` | JWT signing key | `random-32-char-string` |
| `ENVIRONMENT` | Environment mode | `development` or `production` |
| `PYTHONUNBUFFERABLE` | Python output buffering | `1` |

### Frontend Variables
| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API endpoint | `http://backend:8000` |
| `NODE_ENV` | Node environment | `development` or `production` |
| `PORT` | Server port | `3000` |

### Database Variables
| Variable | Purpose | Example |
|----------|---------|---------|
| `POSTGRES_USER` | DB username | `user` |
| `POSTGRES_PASSWORD` | DB password | `password` |
| `POSTGRES_DB` | Database name | `gis_portal` |

---

✅ **Your environment files are now correctly configured!**

Ready to run:
```bash
docker-compose up
```

Access at:
- 🌐 Frontend: http://localhost:3000
- 🔌 Backend: http://localhost:8000
- 📚 API Docs: http://localhost:8000/docs
