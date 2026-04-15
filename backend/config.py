"""
Configuration management for different environments.
Supports: Local (no Docker), Docker local, Cloud (Render), Server (Docker)
"""

import os
from typing import List

# Get environment name (defaults to 'local')
ENVIRONMENT = os.getenv("ENVIRONMENT", "local").lower()

# ==================== DATABASE CONFIGURATION ====================
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/gis_portal"  # Local dev default
)

# ==================== FLASK/FASTAPI CONFIGURATION ====================
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
DEBUG = ENVIRONMENT == "local"

# ==================== CORS CONFIGURATION ====================
# Define allowed origins for each environment
CORS_ORIGINS: List[str] = []

if ENVIRONMENT == "local":
    # Local development (no Docker)
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
elif ENVIRONMENT == "docker":
    # Local Docker development
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://frontend:3000",  # Docker internal network
    ]
elif ENVIRONMENT == "production":
    # Cloud deployment (Vercel + Render)
    CORS_ORIGINS = [
        "http://localhost:3000",  # Local testing
        "https://coffee-locator-gis.vercel.app",  # Vercel production
        "https://*.vercel.app",  # Vercel preview deployments
        "https://coffee-locator-gis-docker.onrender.com",  # This backend on Render
    ]
elif ENVIRONMENT == "server":
    # Server with Docker
    # Read from environment variable or use defaults
    server_origins = os.getenv("CORS_ORIGINS", "")
    if server_origins:
        CORS_ORIGINS = [o.strip() for o in server_origins.split(",")]
    else:
        CORS_ORIGINS = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://frontend:3000",
            "https://yourdomain.com",  # Update with your domain
        ]

# ==================== LOGGING ====================
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO" if ENVIRONMENT == "production" else "DEBUG")

# ==================== VALIDATION ====================
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# Warn if using default SECRET_KEY in production (but don't break deployment)
if SECRET_KEY == "dev-secret-key-change-in-production" and ENVIRONMENT == "production":
    print("[WARNING] Using default SECRET_KEY in production - consider setting SECRET_KEY environment variable")

print(f"[CONFIG] Environment: {ENVIRONMENT}")
print(f"[CONFIG] Database: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'local'}")
print(f"[CONFIG] CORS Origins: {len(CORS_ORIGINS)} configured")
print(f"[CONFIG] Debug mode: {DEBUG}")
