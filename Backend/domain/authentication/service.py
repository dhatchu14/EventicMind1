# backend/domain/authentication/service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional

# Use relative imports for local modules
from .repository import UserRepository
from .schemas import UserCreate
from .models import User as UserModel
# Import security utilities from the security package
from security.hashing import get_password_hash, verify_password
# If security files were inside authentication/, use: from .hashing import ...

class AuthService:
    def __init__(self, db: Session):
        # Use the imported UserRepository
        self.user_repository = UserRepository(db)

    def register_user(self, user_in: UserCreate) -> UserModel:
        existing_user = self.user_repository.get_by_email(user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        hashed_password = get_password_hash(user_in.password)
        new_user = self.user_repository.create(user_in=user_in, hashed_password=hashed_password)
        return new_user

    def authenticate_user(self, email: str, password: str) -> Optional[UserModel]:
        user = self.user_repository.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            return None # Return None for either user not found or wrong password
        return user