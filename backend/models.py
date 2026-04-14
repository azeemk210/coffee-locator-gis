from geoalchemy2 import Geometry
from geoalchemy2.types import Geometry as GeometryType
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, default="user", nullable=False)

    shops: Mapped[list["Shop"]] = relationship("Shop", back_populates="creator")


class Shop(Base):
    __tablename__ = "shops_v2"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    creator_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    location = mapped_column(Geometry(geometry_type="POINT", srid=4326), nullable=False)

    creator: Mapped[User] = relationship("User", back_populates="shops")
