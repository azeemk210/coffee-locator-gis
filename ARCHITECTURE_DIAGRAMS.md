# Architecture Diagram - GIS Coffee Locator Portal

## Complete System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              UBUNTU SERVER                                    │
│                          192.168.120.65 (External IP)                         │
│                                                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                     DOCKER COMPOSE ORCHESTRATION                        │  │
│  │                     Network: gis-network (bridge)                       │  │
│  │                                                                          │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │  │
│  │  │                        NGINX CONTAINER                           │   │  │
│  │  │                    (gis-portal-nginx)                            │   │  │
│  │  │  Image: nginx:alpine                                             │   │  │
│  │  │  Port: 0.0.0.0:80:80                                             │   │  │
│  │  │  IP: 172.18.0.2                                                  │   │  │
│  │  │  Config: /etc/nginx/conf.d/default.conf (mounted)               │   │  │
│  │  │                                                                   │   │  │
│  │  │  ┌─────────────────────────────────────────────────────────┐    │   │  │
│  │  │  │  ROUTING LOGIC                                          │    │   │  │
│  │  │  │  ─────────────────────────────────────────────────────  │    │   │  │
│  │  │  │                                                           │    │   │  │
│  │  │  │  GET  /                    → Frontend:3000               │    │   │  │
│  │  │  │  POST /api/*               → Backend:8000/*              │    │   │  │
│  │  │  │  GET  /api/*               → Backend:8000/*              │    │   │  │
│  │  │  │  POST /shops               → Backend:8000/shops          │    │   │  │
│  │  │  │  POST /auth/register       → Backend:8000/auth/register  │    │   │  │
│  │  │  │  POST /auth/login          → Backend:8000/auth/login     │    │   │  │
│  │  │  │                                                           │    │   │  │
│  │  │  └─────────────────────────────────────────────────────────┘    │   │  │
│  │  └─────────────────────────────────────────────────────────────────┘   │  │
│  │           ↓ Routes To         ↓ Routes To          ↓ Routes To           │  │
│  │                                                                          │  │
│  │  ┌──────────────────────┐  ┌─────────────────┐  ┌──────────────────┐   │  │
│  │  │  FRONTEND CONTAINER  │  │ BACKEND CONTAINER │  │ DATABASE SERVICE  │   │  │
│  │  │ (gis-portal-frontend)│  │(gis-portal-backend)│ │  (gis-portal-db)  │   │  │
│  │  │                      │  │                     │  │                  │   │  │
│  │  │ Image: Node:20-alpine│  │ Image: Python:3.11  │  │ Image: postgis/  │   │  │
│  │  │ + Next.js Build      │  │ + Uvicorn           │  │ postgis:17-3.4   │   │  │
│  │  │                      │  │                     │  │                  │   │  │
│  │  │ Port: 3000           │  │ Port: 8000          │  │ Port: 5432       │   │  │
│  │  │ IP: 172.18.0.4       │  │ IP: 172.18.0.3      │  │ IP: 172.18.0.5   │   │  │
│  │  │                      │  │                     │  │                  │   │  │
│  │  │ ┌──────────────────┐ │  │ ┌─────────────────┤ │  │ ┌──────────────┐ │   │  │
│  │  │ │ Environment:     │ │  │ │ Environment:    │ │  │ │ Volumes:     │ │   │  │
│  │  │ │ .env:            │ │  │ │ .env (root +    │ │  │ │ postgres_data│ │   │  │
│  │  │ │ - NEXT_PUBLIC_   │ │  │ │ backend/.env):  │ │  │ │ (persistent) │ │   │  │
│  │  │ │   API_URL=       │ │  │ │ - DATABASE_URL  │ │  │ │              │ │   │  │
│  │  │ │   https://...:80/ │ │  │ │   (postgres://  │ │  │ │ Port Binding:│ │   │  │
│  │  │ │   api            │ │  │ │    db:5432/...) │ │  │ │ 5432:5432    │ │   │  │
│  │  │ │ - NODE_ENV=prod  │ │  │ │ - ENVIRONMENT   │ │  │ │              │ │   │  │
│  │  │ │                  │ │  │ │   =docker       │ │  │ │ Health Check:│ │   │  │
│  │  │ └──────────────────┘ │  │ └─────────────────┤ │  │ │ pg_isready   │ │   │  │
│  │  │                      │  │                     │  │ │ every 10s    │ │   │  │
│  │  │ Restart:       │  │ Restart:           │  │ │              │ │   │  │
│  │  │ unless-stopped │  │ unless-stopped     │  │ │ Restart:     │ │   │  │
│  │  │                      │  │                     │  │ always       │ │   │  │
│  │  │ Status: running      │  │ Status: running     │  │ Status: running   │   │  │
│  │  │ (healthy)            │  │ (healthy)           │  │ (healthy)    │   │  │
│  │  └──────────────────────┘  └─────────────────────┘  └──────────────┘   │  │
│  │           ↑                       ↑                         ↑             │  │
│  │           └───────────────────────┴─────────────────────────┘             │  │
│  │              All services communicate via gis-network                      │  │
│  │              DNS: gis-portal-frontend, gis-portal-backend, gis-portal-db  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                              ↑                                                 │
└──────────────────────────────┼──────────────────────────────────────────────┘
                               │
                 Port 80 (HTTP) │
                 Exposed on     │
               192.168.120.65   │
                               │
                    ┌──────────┴──────────┐
                    │                     │
         ┌──────────▼──────────┐  ┌───────▼──────────┐
         │  Client Device      │  │  Another Browser │
         │  Windows/Mac        │  │  or API Client   │
         │                     │  │                  │
         │ http://192.168.120. │  │ Postman/curl/JS │
         │ 65/register         │  │ fetch()          │
         │                     │  │                  │
         │ Requests:           │  │ Requests:        │
         │ - GET /             │  │ - POST /api/auth │
         │ - GET /dashboard    │  │ - GET /api/shops │
         │ - POST /api/auth/*  │  │ - POST /api/shop │
         │ - GET /api/shops    │  │   s/{id}         │
         └─────────────────────┘  └──────────────────┘
```

---

## Data Flow Diagrams

### 1. User Registration Flow

```
┌────────────────────────────────────┐
│  Browser at 192.168.120.65         │
│                                    │
│  GET /register                     │
└─────────────────┬──────────────────┘
                  │
                  │ Port 80
                  ▼
        ┌─────────────────────┐
        │ Nginx (Port 80)     │
        │ Reverse Proxy       │
        │ Routes / → Frontend │
        └────────────┬────────┘
                     │
                     │ Internal DNS: frontend:3000
                     ▼
        ┌──────────────────────┐
        │ Frontend Container   │
        │ (Port 3000)          │
        │                      │
        │ Serves registration  │
        │ form HTML            │
        └────────────┬─────────┘
                     │
                     │ User fills form and clicks Register
                     │ POST http://192.168.120.65/api/auth/register
                     │ {email, password, name}
                     │
                     ▼
        ┌─────────────────────┐
        │ Nginx (Port 80)     │
        │ Receives POST       │
        │ Routes /api/* →     │
        │ Backend:8000/*      │
        └────────────┬────────┘
                     │
                     │ Internal DNS: backend:8000
                     ▼
        ┌───────────────────────────┐
        │ Backend Container         │
        │ (Port 8000, FastAPI)      │
        │                           │
        │ 1. Validate email         │
        │ 2. Hash password          │
        │ 3. Generate JWT token     │
        │ 4. Prepare SQL INSERT     │
        └────────────┬──────────────┘
                     │
                     │ SQL: INSERT INTO users (email, password_hash, ...)
                     │ Internal DNS: db:5432
                     ▼
        ┌────────────────────────────┐
        │ PostgreSQL Container       │
        │ (Port 5432)                │
        │ + PostGIS Extension        │
        │                            │
        │ 1. Execute INSERT          │
        │ 2. Return user_id, record  │
        │ 3. Commit transaction      │
        └──────────────┬─────────────┘
                       │
                       │ Response: {user_id, email, token}
                       ▼
        ┌───────────────────────────┐
        │ Backend Container         │
        │ Formats JSON response     │
        │ Status 200 OK             │
        └────────────┬──────────────┘
                     │
                     │ Response through Nginx
                     ▼
        ┌─────────────────────┐
        │ Nginx               │
        │ Forwards response   │
        │ to client           │
        └────────────┬────────┘
                     │
                     │ HTTP 200 with JSON
                     ▼
        ┌────────────────────────────┐
        │ Browser                    │
        │ - Receives {user_id, token}│
        │ - Stores token in storage  │
        │ - Redirects to /login      │
        │ - Shows "Registration OK"  │
        └────────────────────────────┘
```

### 2. Map Data Loading Flow

```
┌────────────────────────────────────┐
│  Browser at 192.168.120.65         │
│                                    │
│  User navigates to /dashboard      │
└─────────────────┬──────────────────┘
                  │
                  │ GET /dashboard
                  │ Cookie: auth_token=***
                  │
                  ▼
        ┌─────────────────────┐
        │ Nginx (Port 80)     │
        │ Routes to Frontend  │
        └────────────┬────────┘
                     │
                     ▼
        ┌──────────────────────┐
        │ Frontend Container   │
        │ Returns dashboard    │
        │ page with Map        │
        │ component            │
        └────────────┬─────────┘
                     │
                     │ Browser loads React/Next.js
                     │ Map component mounts
                     │
                     │ useEffect(() => {
                     │   fetch('/api/shops')
                     │ })
                     │
                     │ GET http://192.168.120.65/api/shops
                     │ Headers: Authorization: Bearer token
                     │
                     ▼
        ┌─────────────────────┐
        │ Nginx (Port 80)     │
        │ Routes /api/* to    │
        │ Backend:8000        │
        └────────────┬────────┘
                     │
                     │ Internal: GET backend:8000/shops
                     │
                     ▼
        ┌──────────────────────────┐
        │ Backend Container        │
        │ (FastAPI /shops route)   │
        │                          │
        │ 1. Verify JWT token      │
        │ 2. Extract user_id       │
        │ 3. Prepare SQL query     │
        └────────────┬─────────────┘
                     │
                     │ SELECT id, name, latitude, longitude, 
                     │        ST_AsGeoJSON(geometry) as geo
                     │ FROM shops
                     │ WHERE user_id = $1
                     │
                     ▼
        ┌────────────────────────────┐
        │ PostgreSQL + PostGIS       │
        │ (Port 5432)                │
        │                            │
        │ 1. Spatial index lookup    │
        │ 2. Convert geometry to     │
        │    GeoJSON format          │
        │ 3. Return results          │
        │                            │
        │ Example result:            │
        │ {                          │
        │   id: "uuid-123",          │
        │   name: "MyShop",          │
        │   latitude: 52.123,        │
        │   longitude: 13.456,       │
        │   geo: {type: "Point", ...}│
        │ }                          │
        └──────────────┬─────────────┘
                       │
                       │ JSON array of shops
                       ▼
        ┌──────────────────────────┐
        │ Backend Container        │
        │ Formats as GeoJSON       │
        │ FeatureCollection        │
        │ Status 200 OK            │
        └────────────┬─────────────┘
                     │
                     │ {type: "FeatureCollection",
                     │  features: [...]}
                     │
                     ▼
        ┌─────────────────────┐
        │ Nginx               │
        │ Forwards response   │
        └────────────┬────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Browser / Map Component    │
        │                            │
        │ 1. Receives GeoJSON        │
        │ 2. MapLibre GL processes   │
        │ 3. Renders shop markers    │
        │ 4. User sees map with      │
        │    coffee shop locations   │
        │ 5. Can click marker for    │
        │    details popup           │
        └────────────────────────────┘
```

---

## Network Topology Diagram

```
                    ┌─────────────────────────────────┐
                    │   Client Network (Your Network) │
                    │   192.168.120.0/24              │
                    └──────────────┬──────────────────┘
                                   │
                         192.168.120.65
                            (Server IP)
                                   │
                ┌──────────────────┴──────────────────┐
                │                                     │
          Port 80                            Other Ports
          (HTTP)                         (SSH, etc.)
                │
                ▼
        ┌──────────────────┐
        │ Nginx Container  │
        │ (Listen :80)     │
        └────────┬─────────┘
                 │
        ┌────────┴────────┬────────────┬──────────┐
        │                 │            │          │
   Location /        Location /api/  Shops   Auth Routes
        │                 │            │          │
        ▼                 ▼            ▼          ▼
    ┌────────┐     ┌──────────┐   ┌────────┐  ┌───────┐
    │Frontend│     │Application│   │Backend │  │Backend│
    │:3000   │     │Layer      │   │:8000   │  │:8000  │
    └────┬───┘     │Backend    │   └───┬────┘  └───┬───┘
         │         │:8000      │       │           │
         │         └──────┬────┘       │           │
         └────────────────┼────────────┴───────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              │   gis-network         │
              │   (Docker Bridge)     │
              │                       │
              │ 172.18.0.0/16         │
              │                       │
        ┌─────▼─────┬─────────────┬───▼────┬──────────┐
        │ 172.18.0.2│ 172.18.0.4  │172.18.0│172.18.0.5
        │           │             │.3      │          │
        │ Nginx     │ Frontend    │Backend │ Database │
        │           │ Next.js     │FastAPI │PostgreSQL│
        │ :80       │ :3000       │ :8000  │ :5432    │
        └───────────┴─────────────┴────────┴──────────┘
                    Docker Host: Ubuntu Server
```

---

## Container Dependencies & Startup Order

```
        ┌──────────────────────────────────┐
        │  docker-compose up command       │
        └──────────────┬───────────────────┘
                       │
                       │ Evaluates dependencies
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
    ┌────────┐   ┌────────┐   ┌──────────────┐
    │Nginx   │   │Frontend│   │Backend       │
    │(no deps)   │(depends)   │(depends on   │
    └───┬────┘   │on Backend) │db:service_   │
        │        └────┬──────┘ │started)     │
        │             │        └──────┬──────┘
        │             │               │
        │             └───────┬───────┘
        │                     │
        │             ┌───────▼────────┐
        │             │ Start DB first │
        │             └────────┬───────┘
        │                      │
        │         ┌────────────▼────────────┐
        │         │                         │
        │    Wait for healthcheck          │
        │    pg_isready returns true       │
        │                                  │
        │         │                        │
        │         └────────────┬───────────┘
        │                      │
        │              ┌───────▼────────────┐
        │              │                    │
        │              │ Start Backend      │
        │              │ (once DB ready)    │
        │              └────────┬───────────┘
        │                       │
        │         ┌─────────────▼──────────┐
        │         │                        │
        │         │ Start Frontend         │
        │         │ (once Backend ready)   │
        │         └────────────┬───────────┘
        │                      │
        │         ┌────────────▼───────────┐
        │         │                        │
        │         │ Start/restart Nginx    │
        │         │ (all ready)            │
        │         └────────────┬───────────┘
        │                      │
        └──────────────┬───────┘
                       │
            ┌──────────▼──────────┐
            │ All services        │
            │ running & healthy   │
            │                     │
            │ Application ready   │
            │ for connection at   │
            │ http://192.168.120. │
            │ 65                  │
            └─────────────────────┘
```

---

## Environment Variables Scope

```
┌──────────────────────────────────────────────────────────┐
│              docker-compose.yml                          │
│                                                          │
│   Services defined with env_file references             │
└──────────────────────┬───────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬─────────────────┐
        │              │              │                 │
        ▼              ▼              ▼                 ▼
    ┌────────┐   ┌──────────┐   ┌──────────┐   ┌────────────┐
    │ .env   │   │backend/  │   │frontend/ │   │ Nginx      │
    │(root)  │   │.env      │   │.env      │   │(no env)    │
    │        │   │          │   │          │   │            │
    │POSTGRES│   │DATABASE_ │   │NEXT_PUBLIC  │            │
    │_USER   │   │URL=post  │   │_API_URL=   │            │
    │        │   │gresql://postgres   │http://...       │            │
    │POSTGRES│   │:password │   │                │            │
    │_PASSWORD │   │@db:5432 │   │NEXT_PUBLIC  │            │
    │        │   │/gis_portal  │_ENVIRONMENT   │            │
    │POSTGRES│   │          │   │=docker   │            │
    │_DB     │   │ENVIRONMENT  │   │                │            │
    │        │   │=docker   │   │NODE_ENV=   │            │
    │        │   │          │   │production  │            │
    │        │   │PYTHONUNBUFF  │   │            │            │
    │        │   │ERABLE=1 │   │            │            │
    └────┬───┘   └────┬─────┘   └──────┬─────┘   └────────────┘
         │             │               │
         │    ┌────────┴───────────┐   │
         │    │                    │   │
         │    ▼                    ▼   │
         │  Backend Container    Frontend Container
         │  - Has all root vars  - Has frontend/.env
         │  - Has backend/.env   - Missing root vars
         │  - DATABASE_URL set ✓ - API_URL set ✓
         │
         └──▶ Database Container
              - Has root vars
              - POSTGRES_* set ✓
```

---

**Navigate to [ARCHITECTURE_SUMMARY.md](ARCHITECTURE_SUMMARY.md) for detailed explanations of each component.**
