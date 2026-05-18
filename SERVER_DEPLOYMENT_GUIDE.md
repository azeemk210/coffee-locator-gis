# Self-Hosted Server Deployment Guide

Deploy your GIS Portal on your own VPS/server with Docker, Nginx, and custom domain.

---

## 📋 Prerequisites

- VPS/Server with Ubuntu 20.04+ or equivalent
- Domain name (e.g., `yourdomain.com`)
- SSH access to server
- ~2GB RAM, 20GB storage minimum

**Recommended Providers:**
- DigitalOcean, Linode, Hetzner, AWS EC2, UpCloud

---

## 🔧 Step 1: Server Setup

### 1.1 Connect to Server
```bash
ssh root@your_server_ip
```

### 1.2 Install Docker & Docker Compose
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 1.3 Install Nginx (Reverse Proxy)
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 1.4 Install Certbot (SSL Certificates)
```bash
sudo apt install certbot python3-certbot-nginx -y
```

---

## 📁 Step 2: Clone Your Repository

```bash
# Go to home directory
cd ~

# Clone your repo
git clone https://github.com/azeemk210/coffee-locator-gis.git
cd coffee-locator-gis

# Create .env files for server
cp backend/.env.server backend/.env
cp frontend/.env.server frontend/.env
```

---

## 🔑 Step 3: Configure Environment Variables

Edit `backend/.env`:
```bash
nano backend/.env
```

```env
# Backend Production Server
ENVIRONMENT=production
DATABASE_URL=postgresql://postgres.xxx:xxx@aws-eu-central-2.pooler.supabase.com:5432/postgres
SECRET_KEY=your-super-secret-key-here-change-me
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
DEBUG=False
```

Edit `frontend/.env`:
```bash
nano frontend/.env
```

```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_ENVIRONMENT=production
```

---

## 📝 Step 4: Update docker-compose.yml for Server

Edit `docker-compose.yml` and modify the backend service:

```yaml
version: "3.8"

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: gis-portal-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://yourdomain.com/api
      - NEXT_PUBLIC_ENVIRONMENT=production
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - gis-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: gis-portal-backend
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - DATABASE_URL=postgresql://...your-supabase-url...
      - SECRET_KEY=your-secret-key
      - CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
    restart: unless-stopped
    networks:
      - gis-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  gis-network:
    driver: bridge
```

**Note:** We're NOT running PostgreSQL in Docker since we're using Supabase cloud.

---

## 🌐 Step 5: Configure Nginx Reverse Proxy

Create Nginx config:
```bash
sudo nano /etc/nginx/sites-available/yourdomain.com
```

```nginx
upstream backend {
    server 127.0.0.1:8000;
}

upstream frontend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificate (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Frontend (root)
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/yourdomain.com
sudo nginx -t  # Test config
sudo systemctl reload nginx
```

---

## 🔐 Step 6: Setup SSL Certificate

```bash
# Get SSL certificate from Let's Encrypt (auto-configures Nginx)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew certificates
sudo systemctl enable certbot.timer
```

---

## 🐳 Step 7: Build and Start Docker Containers

```bash
# Go to app directory
cd ~/coffee-locator-gis

# Build and start
sudo docker-compose build
sudo docker-compose up -d

# Check status
sudo docker-compose ps
sudo docker-compose logs -f backend
```

---

## 📊 Step 8: Verify Deployment

```bash
# Check services
curl https://yourdomain.com        # Frontend
curl https://yourdomain.com/api/shops  # Backend

# Check Docker containers
sudo docker ps

# Check Nginx
sudo journalctl -u nginx -f

# Check backend logs
sudo docker-compose logs -f backend
```

---

## 🔄 Step 9: Maintenance & Monitoring

### View Logs
```bash
# Backend logs
sudo docker-compose logs -f backend --tail 50

# Frontend logs
sudo docker-compose logs -f frontend --tail 50

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Restart Services
```bash
# Restart all
sudo docker-compose restart

# Restart specific service
sudo docker-compose restart backend
sudo docker-compose restart frontend

# Full rebuild
sudo docker-compose down
sudo docker-compose up -d --build
```

### Update Code
```bash
# Pull latest
git pull origin main

# Rebuild and restart
sudo docker-compose down
sudo docker-compose up -d --build
```

### Backup Database
```bash
# Supabase backups are automatic, but you can export data
pg_dump "postgresql://username:password@host/db" > backup.sql
```

---

## 🌍 DNS Configuration

Add these DNS records to your domain registrar:

| Type | Name | Value |
|------|------|-------|
| A | @ | your_server_ip |
| A | www | your_server_ip |
| CNAME | api | your_server_ip (optional) |

---

## 💡 Useful Commands

```bash
# Check server resources
free -h                    # Memory
df -h                      # Disk space
top                        # CPU usage

# Check open ports
ss -tlnp | grep LISTEN

# Restart Nginx
sudo systemctl restart nginx

# Check SSL certificate expiry
sudo certbot certificates

# View firewall rules
sudo iptables -L -n

# Enable firewall
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
```

---

## ⚠️ Security Checklist

- ✅ SSH key authentication (disable password login)
- ✅ Firewall enabled (UFW or similar)
- ✅ SSH on custom port (not 22)
- ✅ SSL certificates (auto-renewed)
- ✅ Environment variables in `.env` (not in docker-compose)
- ✅ Database on Supabase (not exposed)
- ✅ Regular backups enabled
- ✅ Monitoring & alerts setup

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
sudo lsof -i :8000  # Find what's using port 8000
sudo kill -9 <PID>  # Kill process if needed
```

### CORS Errors
- Check `CORS_ORIGINS` in `backend/.env` includes your domain
- Check Nginx proxy headers are correct

### SSL Certificate Issues
```bash
# Renew certificate manually
sudo certbot renew --force-renewal

# Check expiry
sudo certbot certificates
```

### Container Won't Start
```bash
# Check logs
sudo docker-compose logs backend

# Check if port is free
sudo lsof -i :3000
sudo lsof -i :8000

# Rebuild from scratch
sudo docker-compose down
sudo docker system prune -a
sudo docker-compose up -d --build
```

---

## 📞 Support & Monitoring

### Setup Monitoring (Optional)
```bash
# Install Uptime monitor
curl https://uptime-robot-api.com/...

# Or setup simple health check
*/5 * * * * curl -f https://yourdomain.com/api/health || systemctl restart docker
```

### Keep System Updated
```bash
# Auto-updates for security patches
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 🎉 You're Live!

Your application is now deployed on your own server at `https://yourdomain.com`

**Next Steps:**
- Monitor logs regularly
- Set up automated backups
- Configure monitoring/alerts
- Plan scaling strategy if needed
