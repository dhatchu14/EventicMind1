# backend/security/jwt.py
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException,status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

from config.settings import settings
from config.db import get_db
# Updated imports for the new structure:
from domain.authentication.schemas import TokenData # Import from schemas.py
from domain.authentication.repository import UserRepository # Import from repository.py
from domain.authentication.models import User as UserModel # Import from models.py

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login") # Points to the login endpoint

SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    print(f"Creating access token...:{data}")
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, credentials_exception) -> TokenData:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise credentials_exception
        # Use the imported TokenData schema
        token_data = TokenData(email=email)
        print(f"Token verified. Extracted email: {token_data}")
    except JWTError as e:
        print(f"JWT Error: {e}")
        raise credentials_exception
    except ValidationError as e:
        print(f"TokenData Validation Error: {e}")
        raise credentials_exception
    return token_data

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> UserModel: # Return type uses the imported UserModel alias
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    print(f"Token received: {token}")  # 👈 Debug
    token_data = verify_token(token, credentials_exception)
    print(f"Token email: {token_data.email}")  # 👈 Debug
    # Use the imported UserRepository
    user_repo = UserRepository(db)    
    user = user_repo.get_by_email(email=token_data.email)
    print(f"User fetched: {user}") 
    if user is None:
        raise credentials_exception
    return user