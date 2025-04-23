# backend/domain/authentication/endpoints.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

# Use relative imports for local modules
from .service import AuthService
from .schemas import UserCreate, User as UserSchema, Token
from .models import User as UserModel # Import model for type hinting
# Import common dependencies
from config.db import get_db
from security.jwt import create_access_token, get_current_user
# If security files were inside authentication/, use: from .jwt import ...

# --- Authentication Router ---
auth_router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@auth_router.post("/signup", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def signup(
    user_in: UserCreate, # Use schema from schemas.py
    db: Session = Depends(get_db)
):
    auth_service = AuthService(db) # Use service from service.py
    try:
        new_user = auth_service.register_user(user_in)
        return new_user
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error during signup: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during registration."
        )

@auth_router.post("/login", response_model=Token) # Use schema from schemas.py
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    auth_service = AuthService(db)
    user = auth_service.authenticate_user(email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email}) # Use JWT function
    return {"access_token": access_token, "token_type": "bearer"}


# --- User Router (Protected) ---
# Defined in the same file, but logically separate via prefix/tags
user_router = APIRouter(
    prefix="/users",
    tags=["Users"],
    dependencies=[Depends(get_current_user)] # Apply auth dependency
)

@user_router.get("/me", response_model=UserSchema) # Use schema from schemas.py
async def read_users_me(
    current_user: UserModel = Depends(get_current_user) # Use model from models.py for type hint
):
    """
    Get the profile of the currently logged-in user.
    """
    return current_user # Pydantic converts the UserModel instance to UserSchema