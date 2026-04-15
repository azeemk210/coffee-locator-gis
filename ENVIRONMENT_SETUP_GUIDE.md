# 🚀 ENVIRONMENT SETUP GUIDE

## Overview
This application supports 4 deployment scenarios, each with specific environment configuration.

---

## 1️⃣ LOCAL DEVELOPMENT (NO DOCKER)

### What is it?
Run both frontend and backend directly on your machine without containers.

### When to use
- Learning and experimentation
- Debugging specific issues
- No Docker installation required
- Fastest for rapid development

### Setup Steps

#### Backend (Python)
```bash
# Terminal 1: Backend

# Navigate to backend directory
cd backend

# Copy environment file
cp .env.example .env

# Or use the local-specific file:
# cp .env.local .env

# Create & activate virtual environment
python -m venv venv
source venv/bin/activate  # Mac/Linux
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Make sure PostgreSQL is running locally (or use Supabase)
# Update DATABASE_URL in .env if needed

# Run the backend
python -m uvicorn main:app --reload --port 8000
```

#### Frontend (Node.js)
```bash
# Terminal 2: Frontend

# Navigate to frontend directory
cd frontend

# Use local environment file (already exists)
# .env.local should have:
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_ENVIRONMENT=local

# Install dependencies
npm install

# Run development server
npm run dev
# Opens at http://localhost:3000
```

#### Database (PostgreSQL + PostGIS)
```bash
# Option A: Use local PostgreSQL
# Install PostgreSQL with PostGIS extension
# Create database: createdb gis_portal
# Apply schema: psql -U postgres -d gis_portal < schema.sql

# Option B: Use Supabase (cloud)
# 1. Create account at https://supabase.com
# 2. Create new project
# 3. Get connection string
# 4. Update DATABASE_URL in backend/.env
```

### Environment Variables Used
- **Backend**: `backend/.env.local` (or copied from `.env.example`)
- **Frontend**: `frontend/.env.local`
- **Database**: PostgreSQL at `localhost:5432`

### Accessing the App
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 2️⃣ LOCAL DOCKER DEVELOPMENT

### What is it?
Run the complete stack (frontend, backend, database) using Docker Compose locally.

### When to use
- Testing Docker setup
- Matches production environment
- Easy to reset and clean
- Simulates multi-container deployment

### Setup Steps

```bash
# 1. Navigate to project root
cd dummy

# 2. Create root .env file for docker-compose
# Copy and update:
cp .env.example .env

# Edit .env to set:
# DATABASE_URL=postgresql://user:password@db:5432/gis_portal
# NEXT_PUBLIC_API_URL=http://backend:8000
# SECRET_KEY=dev-secret-key-12345

# 3. Start all services
docker-compose up --build

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:8000
# - Database: localhost:5432
```

### Environment Variables Used
- **Root**: `.env` file (for docker-compose)
- **Backend Container**: Reads from docker-compose environment
- **Frontend Container**: Reads from docker-compose environment
- **Database**: Uses PostgreSQL container

### Important Notes
- Backend uses `db:5432` (Docker internal hostname)
- Frontend uses `http://backend:8000` (Docker internal network)
- All containers share network: `gis-network`

### Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild without cache
docker-compose build --no-cache

# Clean everything
docker-compose down -v
docker system prune -a -f
```

---

## 3️⃣ CLOUD DEPLOYMENT (VERCEL + RENDER DOCKER)

### What is it?
Frontend on Vercel (serverless), Backend on Render (Docker), Database on cloud service.

### Architecture
```
User's Browser
    ↓
Vercel Frontend (vercel.app)
    ↓ HTTPS
Render Backend (onrender.com)
    ↓
Cloud Database (Supabase/Cloud SQL)
```

### Setup Steps

#### 1. Push to GitHub
```bash
git add .
git commit -m "Environment configuration complete"
git push origin main
```

#### 2. Backend on Render (Docker)

**Create Web Service:**
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Name**: coffee-locator-gis-docker
   - **Environment**: Docker
   - **Region**: Choose closest to you
   - **Plan**: Free (for testing)

**Set Environment Variables:**
Go to Settings → Environment Variables, add:
```
ENVIRONMENT=production
DATABASE_URL=postgresql://user:password@host:5432/gis_portal
SECRET_KEY=<generate-random-32-char-key>
```

**Deploy:**
- Render auto-deploys on push to GitHub
- Monitor deployment in dashboard
- Note the backend URL (e.g., https://coffee-locator-gis-docker.onrender.com)

#### 3. Frontend on Vercel

**Import Project:**
1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import GitHub repository

**Set Environment Variables:**
Go to Settings → Environment Variables, add:
```
NEXT_PUBLIC_API_URL=https://coffee-locator-gis-docker.onrender.com
NEXT_PUBLIC_ENVIRONMENT=production
NODE_ENV=production
```

**Deploy:**
- Vercel auto-deploys on push
- Or trigger manual redeploy from dashboard
- Get your frontend URL (usually name.vercel.app)

#### 4. Database Setup

**Option A: Supabase**
```bash
1. Create account at https://supabase.com
2. New project
3. Copy connection string
4. Use in RENDER as DATABASE_URL
```

**Option B: Cloud SQL / AWS RDS**
```bash
1. Create managed database
2. Install PostGIS extension
3. Get connection URL
4. Use in RENDER as DATABASE_URL
```

### Environment Variables Used
- **Backend (Render)**: Set in Render dashboard
  - `ENVIRONMENT=production`
  - `DATABASE_URL=...`
  - `SECRET_KEY=...`
  
- **Frontend (Vercel)**: Set in Vercel dashboard
  - `NEXT_PUBLIC_API_URL=https://render-backend-url`
  - `NEXT_PUBLIC_ENVIRONMENT=production`
  - `NODE_ENV=production`

- **Database**: Cloud-hosted (Supabase, Cloud SQL, or RDS)

### Accessing the App
- Frontend: https://yourapp.vercel.app

### CORS Configuration
Backend automatically allows:
- `https://yourdomain.vercel.app`
- `https://*.vercel.app` (all Vercel deployments)
- `https://yourbackend.onrender.com`

---

## 4️⃣ SERVER DEPLOYMENT (YOUR SERVER WITH DOCKER)

### What is it?
Deploy on your own server (VPS, dedicated host) using Docker.

### When to use
- Full control over infrastructure
- Custom domain
- Data sovereignty requirements
- Cost savings at scale

### Setup Steps

#### 1. Prepare Server
```bash
# SSH into your server
ssh user@your-server.com

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

sudo apt-get install docker-compose -y

# Create application directory
mkdir /app/gis-portal
cd /app/gis-portal

# Clone repository
git clone <your-repo-url> .
```

#### 2. Configure Environment

**Backend (.env file on server):**
```bash
cat > backend/.env << EOF
ENVIRONMENT=server
DATABASE_URL=postgresql://user:password@db:5432/gis_portal
SECRET_KEY=<generate-random-32-char-key>
CORS_ORIGINS=http://localhost:3000,http://yourdomain.com,https://yourdomain.com
EOF
```

**Frontend (.env file on server):**
```bash
cat > frontend/.env.production << EOF
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_ENVIRONMENT=server
NODE_ENV=production
EOF
```

#### 3. Update Configuration

**docker-compose.yml changes:**
```yaml
frontend:
  volumes:
    - ./frontend:/app
    # Add this for HTTPS:
    - /etc/letsencrypt:/etc/letsencrypt:ro

backend:
  # Update for your domain
  environment:
    - CORS_ORIGINS=https://yourdomain.com
```

#### 4. Setup HTTPS (Recommended)

```bash
# Install Certbot for Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Mount certificates in docker-compose.yml (see above)
```

#### 5. Setup Nginx Reverse Proxy

```bash
# Create nginx config
sudo cat > /etc/nginx/sites-available/gis-portal << 'EOF'
upstream backend {
    server localhost:8000;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
EOF

# Enable config
sudo ln -s /etc/nginx/sites-available/gis-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Start Services
```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Verify health
curl https://yourdomain.com/health
```

### Environment Variables Used
- **Backend**: `backend/.env` (or docker environment)
  - `ENVIRONMENT=server`
  - `DATABASE_URL=...`
  - `CORS_ORIGINS=...`
  
- **Frontend**: Built with environment variables
  - `NEXT_PUBLIC_API_URL=https://yourdomain.com`
  - `NODE_ENV=production`

- **Database**: PostgreSQL container or external managed service

### Maintenance
```bash
# Update code
git pull origin main

# Rebuild containers
docker-compose build --no-cache

# Restart services
docker-compose restart

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 🔄 Quick Reference: Which Setup to Use?

| Scenario | Use | Command |
|----------|-----|---------|
| **Learning & Testing** | Local (No Docker) | `npm run dev` + `uvicorn` |
| **Development** | Local Docker | `docker-compose up` |
| **Demo/Sharing** | Cloud (Vercel + Render) | Push to GitHub |
| **Production** | Server with Docker | Deploy to VPS |

---

## 🔐 Security Checklist

### Never commit these files:
- `.env` (root)
- `backend/.env` (without .local/.docker/.production/.server suffix)
- `secrets.txt`
- `passwords.txt`

### For Production:
- [ ] Generate strong SECRET_KEY (32+ random characters)
- [ ] Use strong database password
- [ ] Enable HTTPS/SSL
- [ ] Restrict CORS origins to your domain only
- [ ] Keep dependencies updated
- [ ] Regular backups
- [ ] Monitor error logs

---

## 🆘 Troubleshooting

### Local (No Docker)
**Backend not responding**: Check if PostgreSQL is running and DATABASE_URL is correct
**CORS error**: Verify NEXT_PUBLIC_API_URL matches backend URL

### Docker
**Services not communicating**: Check if they're on the same network (`gis-network`)
**Port already in use**: Change ports in docker-compose.yml

### Cloud
**404 on frontend**: Check if NEXT_PUBLIC_API_URL is set in Vercel env vars
**CORS error**: Verify backend CORS_ORIGINS includes your Vercel domain

### Server
**SSL certificates error**: Ensure Let's Encrypt cert path is correct
**Nginx routing**: Test with `curl -v https://yourdomain.com`

---

## 📚 Additional Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [PostgreSQL + PostGIS](https://postgis.net/)

---

**Last Updated**: April 15, 2026
