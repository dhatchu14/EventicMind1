# File: domain/ai/schemas.py

from pydantic import BaseModel, Field
from typing import List, Optional

# Input schema for the endpoint request body
class PredictionParams(BaseModel):
    prediction_months: int = Field(default=3, ge=1, le=12, description="Number of months to look ahead for predictions.")
    context_hint: Optional[str] = Field(default=None, description="Optional context like country or region (e.g., 'India', 'USA') to help tailor predictions.")

# Output schema for a single insight
class PredictionInsight(BaseModel):
    event_or_season: str
    timeframe: Optional[str] = None
    affected_categories: List[str]
    predicted_impact: str
    inventory_warning: Optional[str] = None

# Output schema for the complete endpoint response
class PredictionResponse(BaseModel):
    summary: Optional[str] = None
    insights: List[PredictionInsight]