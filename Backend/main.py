# backend/main.py
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Assuming config.py provides db and settings similar to previous setup
# Ensure config.db provides necessary SessionLocal, Base, get_db, init_db
from config import db, settings

# Import Authentication routers
from domain.authentication.endpoints import auth_router, user_router

# --- Import Product router ---
try:
    from domain.product.endpoints import router as product_router
    product_module_imported = True
    logging.info("Successfully imported product router.")
except ImportError:
    product_module_imported = False
    logging.warning("Could not import product router. Product endpoints will be unavailable.")

# --- Import Inventory router ---
try:
    # Adjust path if your inventory module is located elsewhere
    # Check filename: should likely be 'endpoints.py' not 'endpoint.py'
    from domain.inventory.endpoint import router as inventory_router # <--- Corrected filename assuming it's 'endpoints.py'
    inventory_module_imported = True
    logging.info("Successfully imported inventory router.")
except ImportError:
    inventory_module_imported = False
    logging.warning("Could not import inventory router. Inventory endpoints will be unavailable.")

# --- NEW: Import Cart router ---
try:
    # Adjust path if your cart module is located elsewhere
    from domain.cart.endpoints import router as cart_router
    cart_module_imported = True
    logging.info("Successfully imported cart router.") # Log success
except ImportError as e:
    cart_module_imported = False
    logging.warning(f"Could not import cart router: {e}. Cart endpoints will be unavailable.") # Log failure with error


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- IMPORTANT ---
# Ensure all SQLAlchemy models (Auth, User, Product, Inventory, CartItem etc.) are defined
# and imported (usually via their respective endpoint/service/repo modules)
# BEFORE init_db() is called so they are registered with Base.metadata.
logger.info("Importing models via endpoint modules...")

# Initialize Database (create tables if they don't exist)
logger.info("Initializing database...")
try:
    db.init_db() # Assumes this creates tables for ALL imported models
    logger.info("Database initialization check complete.")
except Exception as e:
    logger.error(f"Database initialization failed: {e}", exc_info=True)
    raise RuntimeError("Failed to initialize database.") from e


# --- Update API Metadata ---
app = FastAPI(
    title="My E-commerce API",
    description="API for user authentication, product management, inventory tracking, and shopping cart.", # Updated Description
    version="0.4.0", # Updated Version (incremented for cart feature)
)

# CORS Middleware Configuration
# Read origins from settings if available, otherwise use defaults
try:
    origins = settings.ALLOWED_ORIGINS.split(',')
    logger.info(f"CORS allowed origins from settings: {origins}")
except AttributeError:
    logger.warning("ALLOWED_ORIGINS not found in settings. Using default CORS origins.")
    origins = [
        "http://localhost:5173", # React Vite default
        "http://localhost:3000", # React CRA default
        # Add your frontend production URL here
    ]
origins = [origin.strip() for origin in origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include Routers ---

logger.info("Including authentication router...")
app.include_router(auth_router) # Includes /auth/...

logger.info("Including user router...")
app.include_router(user_router) # Includes /users/...

# --- Include Product Router (Conditionally) ---
if product_module_imported:
    logger.info("Including product router...")
    app.include_router(product_router) # Includes /products/...
else:
    logger.warning("Product router not included due to import failure.")

# --- Include Inventory Router (Conditionally) ---
if inventory_module_imported:
    logger.info("Including inventory router...")
    app.include_router(inventory_router) # Includes /inventory/...
else:
    logger.warning("Inventory router not included due to import failure.")

# --- NEW: Include Cart Router (Conditionally) ---
if cart_module_imported:
    logger.info("Including cart router...")
    app.include_router(cart_router) # Includes /cart/...
else:
    logger.warning("Cart router not included due to import failure.")


# --- Root Endpoint ---
@app.get("/")
async def root():
    # Updated welcome message including Cart
    modules_loaded = ["Authentication", "User"]
    if product_module_imported:
        modules_loaded.append("Product")
    if inventory_module_imported:
        modules_loaded.append("Inventory")
    # --- NEW: Add Cart to list if loaded ---
    if cart_module_imported:
        modules_loaded.append("Cart")
    return {
        "message": "Welcome to the E-commerce API!",
        "active_modules": modules_loaded,
        "docs": "/docs"
        }

# --- Optional: Uvicorn runner (usually commented out for deployment) ---
# if __name__ == "__main__":
#     import uvicorn
#     logger.info("Starting Uvicorn server for development...")
#     uvicorn.run(
#         "main:app",
#         host=getattr(settings, "HOST", "0.0.0.0"),
#         port=int(getattr(settings, "PORT", 8000)),
#         reload=bool(getattr(settings, "RELOAD", True))
#     )