# backend/domain/authentication/models.py
from sqlalchemy import Column, Integer, String, DateTime, UniqueConstraint # Removed Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.db import Base
from ..cart.models import CartItem # Assuming CartItem is needed

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    # is_active = Column(Boolean, default=True) # <-- REMOVED
    # role = Column(String, default="user")     # <-- REMOVED

    __table_args__ = (UniqueConstraint('email', name='uq_user_email'),)

    cart_items = relationship(
        "CartItem",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', name='{self.full_name}')>"