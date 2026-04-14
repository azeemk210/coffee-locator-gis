from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GeoJSONPoint(BaseModel):
    type: Literal["Point"]
    coordinates: tuple[float, float]


class ShopCreate(BaseModel):
    name: str
    location: GeoJSONPoint


class ShopOut(BaseModel):
    id: int
    name: str
    creator_id: int
    location: GeoJSONPoint
