# backend/main.py
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Assuming config.py provides db and settings similar to previous setup
# Ensure config.db provides necessary SessionLocal, Base, get_db, init_db
from config import db, settings

# Import Authentication routers
from domain.authentication.endpoints import auth_router, user_router

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    # Assuming filename is endpoints.py, adjust if necessary
    from domain.inventory.endpoint import router as inventory_router # Corrected filename assumption
    inventory_module_imported = True
    logging.info("Successfully imported inventory router.")
except ImportError as e:
    inventory_module_imported = False
    # Log the actual error for better debugging
    logging.warning(f"Could not import inventory router: {e}. Inventory endpoints will be unavailable.")

# --- Import Cart router ---
try:
    from domain.cart.endpoints import router as cart_router
    cart_module_imported = True
    logging.info("Successfully imported cart router.")
except ImportError as e:
    cart_module_imported = False
    logging.warning(f"Could not import cart router: {e}. Cart endpoints will be unavailable.")

# --- NEW: Import Order router ---
try:
    # Adjust path if your order module is located elsewhere
    from domain.order.endpoints import router as order_router # <-- IMPORT NEW ROUTER
    order_module_imported = True                          # <-- FLAG FOR ORDER MODULE
    logging.info("Successfully imported order router.")        # <-- LOG SUCCESS
except ImportError as e:
    order_module_imported = False
    logging.warning(f"Could not import order router: {e}. Order/Delivery endpoints will be unavailable.") # <-- LOG FAILURE


# --- IMPORTANT ---
# Ensure all SQLAlchemy models (Auth, User, Product, Inventory, CartItem, Order, Delivery etc.)
# are implicitly imported via their respective endpoint/service/repo modules
# BEFORE init_db() is called so they are registered with db.Base.metadata.
logger.info("Importing models via endpoint modules triggers model registration...")


# Initialize Database (create tables if they don't exist)
# This needs Base to know about ALL models from imported modules
logger.info("Initializing database...")
try:
    db.init_db() # Assumes this uses db.Base.metadata.create_all()
    logger.info("Database initialization check complete.")
except Exception as e:
    logger.error(f"Database initialization failed: {e}", exc_info=True)
    # Depending on the error, you might want to exit or prevent app startup
    raise RuntimeError("Failed to initialize database.") from e


# --- Update API Metadata ---
app = FastAPI(
    title="My E-commerce API",
    description="API for user authentication, product management, inventory tracking, shopping cart, and order processing.", # Updated Description
    version="0.5.0", # Updated Version (incremented for order feature)
)

# CORS Middleware Configuration
# Read origins from settings if available, otherwise use defaults
try:
    origins_str = getattr(settings, "ALLOWED_ORIGINS", "")
    if not origins_str:
        logger.warning("ALLOWED_ORIGINS not found or empty in settings. Using default CORS origins.")
        # Set default origins if setting is missing or empty
        origins = [
            "http://localhost:5173", # React Vite default
            "http://localhost:3000", # React CRA default
            # Add your frontend production URL here for production settings
            # "https://your-frontend-domain.com",
        ]
    else:
        origins = [origin.strip() for origin in origins_str.split(',')]
        logger.info(f"CORS allowed origins from settings: {origins}")

except Exception as e: # Catch potential errors reading/parsing settings
    logger.error(f"Error processing ALLOWED_ORIGINS from settings: {e}. Using default CORS origins.")
    origins = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all standard methods
    allow_headers=["*"], # Allows all headers
)

# --- Include Routers ---

logger.info("Including authentication router...")
app.include_router(auth_router, prefix="/auth", tags=["Authentication"]) # Added prefix for clarity

logger.info("Including user router...")
app.include_router(user_router, prefix="/users", tags=["Users"]) # Added prefix for clarity

# --- Include Product Router (Conditionally) ---
if product_module_imported:
    logger.info("Including product router...")
    app.include_router(product_router, prefix="/products", tags=["Products"]) # Added prefix
else:
    logger.warning("Product router not included due to import failure.")

# --- Include Inventory Router (Conditionally) ---
if inventory_module_imported:
    logger.info("Including inventory router...")
    app.include_router(inventory_router, prefix="/inventory", tags=["Inventory"]) # Added prefix
else:
    logger.warning("Inventory router not included due to import failure.")

# --- Include Cart Router (Conditionally) ---
if cart_module_imported:
    logger.info("Including cart router...")
    app.include_router(cart_router, prefix="/cart", tags=["Cart"]) # Added prefix
else:
    logger.warning("Cart router not included due to import failure.")

# --- NEW: Include Order Router (Conditionally) ---
if order_module_imported:
    logger.info("Including order router...")
    # Using the tags defined in order/endpoints.py ("Order & Delivery")
    # Keeping /delivery and /order at root as defined in endpoints.py for now
    # Alternatively, add prefix="/orders" here and adjust paths in order/endpoints.py
    app.include_router(order_router) # <-- INCLUDE NEW ROUTER
else:
    logger.warning("Order router not included due to import failure.")


# --- Root Endpoint ---
@app.get("/", tags=["Root"])
async def root():
    # Updated welcome message including Order processing
    modules_loaded = ["Authentication", "User"]
    if product_module_imported: modules_loaded.append("Product")
    if inventory_module_imported: modules_loaded.append("Inventory")
    if cart_module_imported: modules_loaded.append("Cart")
    # --- NEW: Add Order to list if loaded ---
    if order_module_imported: modules_loaded.append("Order") # <-- ADD ORDER MODULE
    return {
        "message": "Welcome to the E-commerce API!",
        "active_modules": modules_loaded,
        "api_version": app.version, # Show current version
        "docs_url": app.docs_url, # Show docs URL dynamically
        "redoc_url": app.redoc_url # Show redoc URL dynamically
        }

# --- Optional: Uvicorn runner (usually commented out for deployment) ---
# if __name__ == "__main__":
#     import uvicorn
#     host = getattr(settings, "HOST", "127.0.0.1") # Default to 127.0.0.1 for local dev
#     port = int(getattr(settings, "PORT", 8000))
#     reload = bool(getattr(settings, "RELOAD", True))
#     log_level = getattr(settings, "LOG_LEVEL", "info").lower()

#     logger.info(f"Starting Uvicorn server on {host}:{port} (Reload: {reload}, LogLevel: {log_level})")
#     uvicorn.run(
#         "main:app",
#         host=host,
#         port=port,
#         reload=reload,
#         log_level=log_level
#     )