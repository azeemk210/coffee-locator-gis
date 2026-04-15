import json
from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session

import auth
import models
import schemas
from database import Base, engine, get_db

app = FastAPI(title="GIS Portal Backend")


# Add your server's IP here
origins = [
    "http://192.168.120.65:3000",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # This is the magic line
    allow_credentials=True,
    allow_methods=["*"],   # Allows GET, POST, etc.
    allow_headers=["*"],   # Allows all headers
)


Base.metadata.create_all(bind=engine)

app.include_router(auth.router)


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Salzburg GIS API is running"}

@app.get("/shops", tags=["shops"])
def list_shops(
    current_user: Annotated[models.User, Depends(auth.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Get shops (RBAC: admins see all, users see only their own)."""
    # Role-based access control
    if current_user.role == "admin":
        shops = db.query(models.Shop).all()
    else:
        shops = db.query(models.Shop).filter(models.Shop.creator_id == current_user.id).all()
    
    # Build response with GeoJSON geometry extracted from PostGIS
    result = []
    for shop in shops:
        try:
            # Extract coordinates using ST_AsGeoJSON and ST_X, ST_Y
            geom_json_result = db.execute(
                select(func.ST_AsGeoJSON(models.Shop.location))
                .where(models.Shop.id == shop.id)
            ).scalar()
            
            if geom_json_result:
                geom_json = json.loads(geom_json_result)
                coords = geom_json.get("coordinates", [0.0, 0.0])
            else:
                coords = [0.0, 0.0]
        except Exception as e:
            print(f"Geometry extraction error for shop {shop.id}: {e}")
            coords = [0.0, 0.0]
        
        result.append({
            "id": shop.id,
            "name": shop.name,
            "creator_id": shop.creator_id,
            "location": {
                "type": "Point",
                "coordinates": coords
            }
        })
    
    return result


@app.post("/shops", tags=["shops"], status_code=201)
def create_shop(
    payload: schemas.ShopCreate,
    current_user: Annotated[models.User, Depends(auth.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Create a new shop with location (for authenticated users)."""
    from geoalchemy2.elements import WKTElement
    
    # Convert GeoJSON coordinates to WKT Point for PostGIS
    coords = payload.location.coordinates
    point_wkt = f"POINT({coords[0]} {coords[1]})"
    location_geom = WKTElement(point_wkt, srid=4326)
    
    shop = models.Shop(
        name=payload.name,
        creator_id=current_user.id,
        location=location_geom,
    )
    db.add(shop)
    db.commit()
    db.refresh(shop)
    
    return {
        "id": shop.id,
        "name": shop.name,
        "creator_id": shop.creator_id,
        "location": {
            "type": "Point",
            "coordinates": list(coords)
        }
    }


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/debug/user", tags=["debug"])
def debug_user(
    current_user: Annotated[models.User, Depends(auth.get_current_user)],
):
    """Debug endpoint to test auth dependency."""
    return {"user_id": current_user.id, "email": current_user.email, "role": current_user.role}
