import logging
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import Dict, Any

# --- Local Imports ---
try:
    from .schema import PredictionParams, PredictionResponse
    from .service import AISalesPredictorService, get_ai_sales_predictor_service
except ImportError as e:
    logging.error(f"ERROR in AI endpoints: Failed to import AI schemas or service: {e}. AI endpoints will fail.", exc_info=True)
    class PredictionParams: pass
    class PredictionResponse: pass
    class AISalesPredictorService: pass
    def get_ai_sales_predictor_service(): return None

# --- Database Import (ADJUST BASED ON YOUR STRUCTURE) ---
try:
    from config.db import get_db
except ImportError as e:
    logging.error(f"ERROR in AI endpoints: Failed to import get_db dependency: {e}.", exc_info=True)
    def get_db(): raise ImportError(f"Could not import get_db: {e}")

# --- Router Setup ---
router = APIRouter()
logger = logging.getLogger(__name__)

# --- API Endpoint Definition ---
@router.post(
    "/predict-seasonal-demand",
    response_model=PredictionResponse,
    summary="Predict sales demand based on upcoming seasons/events (Admin)",
    status_code=status.HTTP_200_OK
)
async def predict_seasonal_demand_endpoint(
    params: PredictionParams = Body(default_factory=PredictionParams),
    db: Session = Depends(get_db),
    predictor_service: AISalesPredictorService = Depends(get_ai_sales_predictor_service)
):
    """
    Analyzes upcoming events/seasons using an LLM and predicts potential impact
    on product categories based on store data.

    - **Requires admin privileges.**
    - Input `prediction_months` (optional, default 3) defines the lookahead period.
    - Input `context_hint` (optional) provides location context (e.g., 'USA', 'Europe').
    """
    logger.info(f"Received POST /ai/predict-seasonal-demand request.")

    if not predictor_service:
         logger.error("AI Predictor Service dependency failed (likely due to import error in service/endpoints).")
         raise HTTPException(
             status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
             detail="The AI prediction service dependency is unavailable."
         )

    if not predictor_service.llm:
         logger.error("AI Predictor Service LLM is not available (Ollama connection issue?).")
         raise HTTPException(
             status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
             detail="The AI prediction service LLM is currently unavailable."
         )

    try:
        prediction_result_dict = await predictor_service.predict_demand(
            params=params.model_dump(),
            db=db
        )
        logger.info("Prediction generated successfully.")
        return prediction_result_dict

    except ValueError as ve:
        logger.error(f"Value error during prediction: {ve}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Prediction failed: {ve}")
    except HTTPException as http_exc:
         raise http_exc
    except Exception as e:
        logger.exception(f"Unexpected error during prediction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal error occurred during AI prediction."
        )
