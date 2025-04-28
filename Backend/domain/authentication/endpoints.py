# backend/domain/authentication/endpoints.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

# Use relative imports for local modules if applicable
from .service import AuthService
from .schemas import UserCreate, User as UserSchema, Token
from .models import User as UserModel # Import model for type hinting

# Import common dependencies (adjust paths if necessary)
from config.db import get_db
# Assuming jwt.py is in a top-level 'security' directory
from security.jwt import create_access_token, get_current_user
# If security files were inside authentication/, you might use:
# from .dependencies import get_current_user # Assuming dependencies.py exists
# from .jwt import create_access_token # Assuming jwt.py is here

# --- Authentication Router ---
# Prefix will be applied in main.py
auth_router = APIRouter(
    tags=["Authentication"]
    # No prefix here
)

@auth_router.post("/signup", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def signup(
    user_in: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user.
    """
    auth_service = AuthService(db)
    try:
        new_user = auth_service.register_user(user_in)
        return new_user
    except HTTPException as e:
        # Re-raise known HTTP exceptions (like email already exists)
        raise e
    except Exception as e:
        # Log the unexpected error
        print(f"Unexpected error during signup: {e}") # Replace with proper logging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during registration."
        )

@auth_router.post("/login", response_model=Token)
async def login_for_access_token(
    # Depends on OAuth2PasswordRequestForm expecting form data (username, password)
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return an access token.
    Frontend should send 'username' (which is the email) and 'password'
    as application/x-www-form-urlencoded data.
    """
    auth_service = AuthService(db)
    # Use email from the form's 'username' field for authentication
    user = auth_service.authenticate_user(email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            # Header required by OAuth2 spec
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Create JWT token
    # Ensure create_access_token function is correctly imported and works
    access_token = create_access_token(data={"sub": user.email}) # Using email as the subject ('sub')
    return {"access_token": access_token, "token_type": "bearer"}


# --- User Router (Protected) ---
# Prefix will be applied in main.py
user_router = APIRouter(
    tags=["Users"],
    # Apply authentication dependency to all routes in this router
    # Ensure get_current_user function is correctly imported and works
    dependencies=[Depends(get_current_user)]
    # No prefix here
)

@user_router.get("/me", response_model=UserSchema)
async def read_users_me(
    # Inject the authenticated user object (retrieved based on the token)
    # Ensure UserModel is correctly imported for type hinting
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get the profile of the currently logged-in user.
    Requires a valid Bearer token in the Authorization header.
    """
    # The dependency already fetched the user, just return it.
    # Pydantic will automatically convert the SQLAlchemy UserModel instance
    # into the UserSchema for the response.
    return current_user

# You could add other user-specific, protected endpoints here later
# Example:
# @user_router.put("/me", response_model=UserSchema)
# async def update_user_me(...):
#     # Update logic for the current user
#     pass