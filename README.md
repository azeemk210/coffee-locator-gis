# GIS Web Portal

A modern web-based GIS (Geographic Information System) portal for managing and visualizing spatial data. Built with FastAPI, Next.js, PostgreSQL with PostGIS, and deployed with Docker.

## 🌍 Features

- **Interactive Web Map**: MapLibre GL JS with zoom, pan, and layer controls
- **User Authentication**: JWT-based login/registration with secure PBKDF2 password hashing
- **Role-Based Access Control (RBAC)**: User and admin roles with permission handling
- **Spatial Data Management**: Create, read, update shops with geographic locations
- **Real-Time Map Markers**: Click on map to add new shops with coordinates
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Production Ready**: Docker containerization with health checks and hot reload support
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation

## 🛠️ Tech Stack

### Frontend
- **Next.js 14.1** - Modern React framework with App Router
- **TypeScript 5.3** - Type-safe JavaScript
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **MapLibre GL JS 3.6** - Free vector web map library
- **Axios 1.6** - HTTP client with request/response interceptors
- **React Context API** - State management

### Backend
- **FastAPI 0.104.1** - Modern Python async web framework
- **SQLAlchemy 2.0** - Python SQL toolkit and ORM
- **GeoAlchemy2** - Spatial extension for SQLAlchemy (PostGIS support)
- **PyJWT** - JSON Web Token authentication
- **PBKDF2-HMAC-SHA256** - Secure password hashing (100k iterations)
- **Uvicorn** - ASGI web server

### Database
- **PostgreSQL 17** - Relational database
- **PostGIS 3.4** - Spatial database extension for geographic queries

### DevOps
- **Docker & Docker Compose** - Container orchestration
- **Multi-stage builds** - Optimized production images
- **Health checks** - Automated service health monitoring

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose ([Install Docker Desktop](https://www.docker.com/products/docker-desktop))
- Git (for cloning the repository)

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd dummy
```

### 2. Create Environment File
```bash
cp .env.example .env
```

### 3. Start All Services
```bash
docker-compose up --build
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: PostgreSQL on localhost:5432

### 4. Access the Application
1. Open http://localhost:3000 in your browser
2. Register a new account or login with existing credentials
3. View the interactive map and manage your shops

## 📁 Project Structure

```
dummy/
├── backend/                    # FastAPI application
│   ├── main.py                # Application entry point
│   ├── models.py              # SQLAlchemy ORM models
│   ├── schemas.py             # Pydantic request/response schemas
│   ├── database.py            # Database connection and setup
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile             # Backend container image
│   └── .env                   # Backend environment (git ignored)
│
├── frontend/                   # Next.js React application
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   │   ├── page.tsx      # Home page
│   │   │   ├── login/        # Login page
│   │   │   ├── register/     # Registration page
│   │   │   └── dashboard/    # Protected dashboard with map
│   │   ├── components/       # Reusable React components
│   │   ├── api/             # API client utilities
│   │   ├── contexts/        # React Context providers
│   │   └── types/           # TypeScript type definitions
│   ├── public/              # Static assets (optional)
│   ├── package.json         # Node dependencies
│   ├── tsconfig.json        # TypeScript configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── Dockerfile           # Frontend container image
│   └── .env.local           # Frontend environment (git ignored)
│
├── docker-compose.yml        # Multi-container orchestration
├── .env                      # Docker Compose environment (git ignored)
├── .env.example              # Template environment file
├── .gitignore                # Git ignore rules
│
├── COMPLETE_DOCUMENTATION.md # Full technology documentation
├── ENV_CONFIGURATION_GUIDE.md # Environment setup guide
├── DOCKER_SETUP_GUIDE.md     # Docker implementation journey
└── README.md                 # This file
```

## 📋 Configuration

### Environment Variables

Copy `.env.example` to `.env` and update the values:

```env
# Database connection
DATABASE_URL=postgresql://user:password@db:5432/gis_portal

# Secret key for JWT (change this in production!)
SECRET_KEY=your-secret-key-here

# Frontend API URL
NEXT_PUBLIC_API_URL=http://backend:8000

# PostgreSQL credentials (for local docker db service)
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=gis_portal
```

### Local PostgreSQL vs Supabase

**Development (Local PostgreSQL):**
```env
DATABASE_URL=postgresql://user:password@db:5432/gis_portal
ENVIRONMENT=development
```

**Production (Supabase):**
```env
DATABASE_URL=postgresql://user:password@xxxxx.pooler.supabase.com:6543/postgres
ENVIRONMENT=production
```

## 🛠️ Development

### Start Development Servers
```bash
docker-compose up
```

Both frontend and backend support hot reload - code changes auto-apply without restarting.

### Backend Development
```bash
# Run backend only
docker-compose up backend

# View logs
docker-compose logs -f backend

# Execute Python command
docker-compose exec backend python -c "import sys; print(sys.version)"
```

### Frontend Development
```bash
# Run frontend only
docker-compose up frontend

# View logs
docker-compose logs -f frontend

# Access at http://localhost:3000 with Fast Refresh
```

### Database Access
```bash
# Connect to PostgreSQL
docker-compose exec db psql -U user -d gis_portal

# List tables
\dt

# Run a query
SELECT id, email, role FROM users;

# Exit
\q
```

## 🧪 Testing

### API Testing
```bash
# Health check
curl http://localhost:8000/health

# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8000/auth/login-json \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=password123"

# Auto-generated API docs
# Visit: http://localhost:8000/docs
```

### Frontend Testing
```bash
# Access at http://localhost:3000
# Test login/registration flows
# Try creating shops on the map
# Verify data persistence in database
```

## 📦 Production Deployment

### Deploy on Render

1. **Create Render Account**: https://render.com
2. **Connect Repository**: GitHub repo
3. **Update Environment Variables**:
   - `DATABASE_URL`: Your Supabase connection string
   - `SECRET_KEY`: Production secret (generate a new one!)
   - `NEXT_PUBLIC_API_URL`: Your deployed domain
   - `ENVIRONMENT`: production

4. **Build Command**: 
   ```bash
   docker-compose build
   ```

5. **Start Command**:
   ```bash
   docker-compose up
   ```

See [DOCKER_SETUP_GUIDE.md](./DOCKER_SETUP_GUIDE.md) for detailed deployment instructions.

## 📚 Documentation

- [COMPLETE_DOCUMENTATION.md](./COMPLETE_DOCUMENTATION.md) - Full technical documentation for all components
- [ENV_CONFIGURATION_GUIDE.md](./ENV_CONFIGURATION_GUIDE.md) - Detailed environment configuration guide
- [DOCKER_SETUP_GUIDE.md](./DOCKER_SETUP_GUIDE.md) - Docker implementation journey with errors and solutions

## 🐛 Troubleshooting

### Docker Issues
```bash
# Check container status
docker ps

# View detailed logs
docker-compose logs

# Rebuild without cache
docker-compose build --no-cache

# Reset everything (removes database!)
docker-compose down -v
docker system prune -a -f
docker-compose up --build
```

### Database Connection Issues
- Verify `DATABASE_URL` in `.env`
- Check PostgreSQL is running: `docker ps | grep db`
- Test connection: `docker-compose exec db psql -U user -d gis_portal -c "\dt"`

### Frontend Can't Reach Backend
- Ensure `NEXT_PUBLIC_API_URL=http://backend:8000` in `.env`
- Rebuild frontend: `docker-compose build --no-cache frontend`
- Clear browser cache: Ctrl+Shift+Delete or Cmd+Shift+Delete

### Port Already in Use
```bash
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (Windows)
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
# Change: ports: ["8001:8000"]
```

See [DOCKER_SETUP_GUIDE.md](./DOCKER_SETUP_GUIDE.md#troubleshooting) for more troubleshooting steps.

## 🔒 Security

- **Passwords**: PBKDF2-HMAC-SHA256 with 100k iterations
- **Authentication**: JWT tokens with secure signing
- **Environment Variables**: Never commit `.env` files or credentials
- **Docker**: Multi-stage builds to minimize attack surface
- **Database**: Separate user/admin roles with RBAC enforcement

## 📝 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login-json` - Login with email/password
- `POST /auth/logout` - Logout user

### Shops (RBAC Protected)
- `GET /shops` - List user's shops
- `POST /shops` - Create new shop
- `GET /shops/{id}` - Get shop details
- `PUT /shops/{id}` - Update shop
- `DELETE /shops/{id}` - Delete shop

### Health
- `GET /health` - API health check

See http://localhost:8000/docs for interactive API documentation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 📧 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Built with ❤️ using FastAPI, Next.js, and PostGIS**
