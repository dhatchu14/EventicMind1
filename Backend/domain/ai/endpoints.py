# File: domain/ai/endpoints.py (Corrected)

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import Dict, Any

# --- Local Imports ---
# Assumes schemas.py and service.py are in the same domain/ai/ directory
try:
    # CORRECTED: schema -> schemas
    from .schema import PredictionParams, PredictionResponse
    from .service import AISalesPredictorService, get_ai_sales_predictor_service
    # REMOVED incorrect logging call here
except ImportError as e:
     # Log using the root logger or print, as 'logger' isn't defined yet
     logging.error(f"ERROR in AI endpoints: Failed to import AI schemas or service: {e}. AI endpoints will fail.", exc_info=True)
     # Define dummy classes/functions if imports fail
     class PredictionParams: pass
     class PredictionResponse: pass
     class AISalesPredictorService: pass
     def get_ai_sales_predictor_service(): return None

# --- Authentication Imports (ADJUST BASED ON YOUR STRUCTURE) ---
try:
    from ..authentication.service import get_current_active_user
    from ..authentication.models import User as AuthUser # Use your User model name
    # REMOVED incorrect logging call here
except ImportError as e:
    # Log using the root logger or print
    logging.warning(f"WARNING in AI endpoints: Using placeholder Authentication: {e}")
    class AuthUser: id = 1; role = "guest"
    def get_current_active_user(): return AuthUser()

# --- Database Import (ADJUST BASED ON YOUR STRUCTURE) ---
try:
    from config.db import get_db
    # REMOVED incorrect logging call here
except ImportError as e:
     # Log using the root logger or print
     logging.error(f"ERROR in AI endpoints: Failed to import get_db dependency: {e}.", exc_info=True)
     def get_db(): raise ImportError(f"Could not import get_db: {e}")

# --- Router Setup ---
# This router will be imported and included in main.py
router = APIRouter() # No prefix/tags here, they will be added in main.py
# Define logger instance AFTER imports and potential errors
logger = logging.getLogger(__name__)

# --- API Endpoint Definition ---
# ... (rest of the endpoint code remains the same as before) ...
@router.post(
    "/predict-seasonal-demand", # Path relative to the prefix defined in main.py ("/ai")
    response_model=PredictionResponse,
    summary="Predict sales demand based on upcoming seasons/events (Admin)",
    status_code=status.HTTP_200_OK
)
async def predict_seasonal_demand_endpoint(
    params: PredictionParams = Body(default_factory=PredictionParams),
    # --- Dependencies ---
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_active_user),
    predictor_service: AISalesPredictorService = Depends(get_ai_sales_predictor_service)
):
    """
    Analyzes upcoming events/seasons using an LLM and predicts potential impact
    on product categories based on store data.

    - **Requires admin privileges.**
    - Input `prediction_months` (optional, default 3) defines the lookahead period.
    - Input `context_hint` (optional) provides location context (e.g., 'USA', 'Europe').
    """
    user_id = getattr(current_user, 'id', 'N/A')
    user_role = getattr(current_user, 'role', 'N/A')
    logger.info(f"Received POST /ai/predict-seasonal-demand request. User ID: {user_id}, Role: {user_role}")

    # --- Authorization Check ---
    if user_role != "admin":
        logger.warning(f"Forbidden attempt: User {user_id} with role {user_role} tried to access admin AI endpoint.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform this action. Admin privileges required."
        )

    # --- Check if Service is Available ---
    # Add check for predictor_service itself in case get_ai_sales_predictor_service returned None due to import error
    if not predictor_service:
         logger.error("AI Predictor Service dependency failed (likely due to import error in service/endpoints).")
         raise HTTPException(
             status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
             detail="The AI prediction service dependency is unavailable."
         )
    # Check if the LLM was initialized within the service
    if not predictor_service.llm:
         logger.error("AI Predictor Service LLM is not available (Ollama connection issue?).")
         raise HTTPException(
             status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
             detail="The AI prediction service LLM is currently unavailable."
         )

    # --- Call the Service Logic ---
    try:
        prediction_result_dict = await predictor_service.predict_demand(
            params=params.model_dump(),
            db=db
        )
        logger.info(f"Prediction generated successfully for admin user {user_id}.")
        return prediction_result_dict

    except ValueError as ve:
        logger.error(f"Value error during prediction for admin user {user_id}: {ve}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Prediction failed: {ve}")
    except HTTPException as http_exc:
         raise http_exc
    except Exception as e:
        logger.exception(f"Unexpected error during prediction for admin user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal error occurred during AI prediction."
        )