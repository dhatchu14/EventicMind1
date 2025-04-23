# backend/domain/authentication/repository.py
from sqlalchemy.orm import Session
from typing import Optional

# Use relative imports for models and schemas within the same package
from .models import User as UserModel
from .schemas import UserCreate

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> Optional[UserModel]:
        return self.db.query(UserModel).filter(UserModel.email == email).first()

    def get_by_id(self, user_id: int) -> Optional[UserModel]:
        return self.db.query(UserModel).filter(UserModel.id == user_id).first()

    def create(self, user_in: UserCreate, hashed_password: str) -> UserModel:
        db_user = UserModel(
            email=user_in.email,
            full_name=user_in.full_name,
            hashed_password=hashed_password
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    # Add update/delete methods here if needed