# domain/ai/service.py
import logging
from sqlalchemy.orm import Session
from sqlalchemy import func, select, distinct
from datetime import datetime
from typing import Dict, Any, List, Optional
import os
from dotenv import load_dotenv

# Database Models
try:
    from ..product.models import Product
    from ..inventory.models import Inventory
    logger = logging.getLogger(__name__)
    logger.info("Successfully imported DB models (Product, Inventory) for AI Service.")
except ImportError as e:
    logger = logging.getLogger(__name__)
    logger.warning(f"Could not import DB models for AI Service: {e}. Using mock data.")
    class Product:
        id = None
        category = None
    class Inventory:
        prod_id = None
        stock = None

# LangChain & LLM
try:
    from langchain_core.prompts import PromptTemplate
    from langchain_core.output_parsers import StrOutputParser
    from langchain_community.llms import Ollama
    LLM_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Could not import LangChain/Ollama: {e}. Falling back to mock predictions.")
    LLM_AVAILABLE = False

load_dotenv()

class AISalesPredictorService:
    def __init__(self):
        self.llm = None
        self.prediction_chain = None
        if LLM_AVAILABLE:
            try:
                ollama_model = os.getenv("OLLAMA_MODEL", "mistral")
                ollama_base_url = os.getenv("OLLAMA_BASE_URL")
                llm_params = {"model": ollama_model}
                if ollama_base_url:
                    llm_params["base_url"] = ollama_base_url
                self.llm = Ollama(**llm_params)
                logger.info(f"Initialized Ollama LLM with model: {ollama_model}")
            except Exception as e:
                logger.error(f"Failed to initialize Ollama LLM: {e}", exc_info=True)

        # Prompt Template
        prediction_template = """
        Analyze potential sales trends for an e-commerce store based on upcoming seasons and events.

        Context:
        Today's Date: {current_date}
        Store Location Context: {location_context}
        Available Product Categories: {category_list}
        Low Stock Categories: {low_stock_info}

        Task:
        1. Identify major seasons, holidays, or events in {location_context} within the next {prediction_months} months.
        2. List product categories likely to see increased demand.
        3. Provide a brief reason for the predicted impact.
        4. Highlight if any high-demand category is low on stock (Inventory Warning).

        Output Format:
        Summary: [1-2 sentence overview]
        - Event/Season: [Name]
          Timeframe: [e.g., Dec 2025]
          Affected Categories: [List]
          Predicted Impact: [Explanation]
          Inventory Warning: [Warning or None]
        """
        self.prediction_prompt = PromptTemplate.from_template(prediction_template) if LLM_AVAILABLE else None
        self.output_parser = StrOutputParser() if LLM_AVAILABLE else None

        if self.llm and LLM_AVAILABLE:
            self.prediction_chain = self.prediction_prompt | self.llm | self.output_parser
            logger.info("Prediction LLM Chain created.")
        else:
            logger.warning("Prediction chain not created due to missing LLM or LangChain.")

    async def predict_demand(self, params: Dict[str, Any], db: Session) -> Dict[str, Any]:
        if not self.prediction_chain:
            logger.warning("No LLM chain available. Returning mock predictions.")
            return {
                "summary": "AI predicts increased demand due to upcoming seasons (mock data).",
                "insights": [
                    {
                        "event_or_season": "Holiday Season",
                        "timeframe": "Dec 2025",
                        "affected_categories": ["Electronics", "Gifts"],
                        "predicted_impact": "30% sales increase due to holiday shopping.",
                        "inventory_warning": "Stock up on popular items."
                    },
                    {
                        "event_or_season": "Back to School",
                        "timeframe": "Aug 2025",
                        "affected_categories": ["Stationery", "Electronics"],
                        "predicted_impact": "20% sales increase due to school season.",
                        "inventory_warning": None
                    }
                ]
            }

        prediction_months = params.get('prediction_months', 3)
        location_context = params.get('context_hint', 'Global')
        current_date_str = datetime.utcnow().strftime("%Y-%m-%d")
        low_stock_threshold = 10

        # Fetch Categories and Stock Info
        category_list_str = "Unknown"
        low_stock_info_str = "No stock info available."
        try:
            category_query = select(distinct(Product.category)).where(Product.category.isnot(None))
            categories = db.execute(category_query).scalars().all()
            category_list_str = ", ".join(categories) if categories else "No categories found."

            low_stock_query = (
                select(distinct(Product.category))
                .join(Inventory, Product.id == Inventory.prod_id)
                .where(Inventory.stock <= low_stock_threshold, Product.category.isnot(None))
            )
            low_stock_categories = db.execute(low_stock_query).scalars().all()
            low_stock_info_str = (
                f"Low stock (<= {low_stock_threshold} units): {', '.join(low_stock_categories)}"
                if low_stock_categories else "No low stock categories."
            )
            logger.info(f"Categories: {category_list_str}, Low Stock: {low_stock_info_str}")
        except Exception as e:
            logger.error(f"DB query error: {e}", exc_info=True)

        llm_input = {
            "current_date": current_date_str,
            "location_context": location_context,
            "prediction_months": prediction_months,
            "category_list": category_list_str,
            "low_stock_info": low_stock_info_str
        }

        try:
            llm_response = await self.prediction_chain.ainvoke(llm_input)
            logger.info("LLM prediction successful.")
        except Exception as e:
            logger.error(f"LLM prediction failed: {e}", exc_info=True)
            return {
                "summary": "Failed to generate predictions due to LLM error.",
                "insights": []
            }

        # Parse LLM Response
        try:
            lines = llm_response.strip().split('\n')
            summary = ""
            insights = []
            current_insight = None

            for line in lines:
                line = line.strip()
                if not line:
                    continue
                if line.startswith("Summary:"):
                    summary = line[len("Summary:"):].strip()
                elif line.startswith("- Event/Season:"):
                    if current_insight:
                        insights.append(current_insight)
                    current_insight = {
                        "affected_categories": [],
                        "inventory_warning": None
                    }
                    current_insight["event_or_season"] = line[len("- Event/Season:"):].strip()
                elif line.startswith("Timeframe:") and current_insight:
                    current_insight["timeframe"] = line[len("Timeframe:"):].strip()
                elif line.startswith("Affected Categories:") and current_insight:
                    cats = line[len("Affected Categories:"):].strip().split(',')
                    current_insight["affected_categories"] = [cat.strip() for cat in cats if cat.strip()]
                elif line.startswith("Predicted Impact:") and current_insight:
                    current_insight["predicted_impact"] = line[len("Predicted Impact:"):].strip()
                elif line.startswith("Inventory Warning:") and current_insight:
                    warning = line[len("Inventory Warning:"):].strip()
                    current_insight["inventory_warning"] = warning if warning.lower() != "none" else None

            if current_insight:
                insights.append(current_insight)

            return {
                "summary": summary or "AI-generated sales predictions.",
                "insights": insights
            }
        except Exception as e:
            logger.error(f"Error parsing LLM response: {e}", exc_info=True)
            return {
                "summary": "Error parsing AI predictions.",
                "insights": [],
                "raw_response": llm_response
            }

def get_ai_sales_predictor_service():
    return AISalesPredictorService()