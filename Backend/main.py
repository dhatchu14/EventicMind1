# main.py

import logging
from fastapi import FastAPI, APIRouter # Import APIRouter for type hinting
from fastapi.middleware.cors import CORSMiddleware
import os
import importlib # Use importlib for cleaner dynamic imports

# --- Setup Logging Early ---
logging.basicConfig(level="INFO", format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Import Config and Set Log Level ---
try:
    from config import db, settings
    config_imported = True
    log_level_str = getattr(settings, "LOG_LEVEL", "INFO").upper()
    valid_log_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
    if log_level_str not in valid_log_levels:
        logger.warning(f"Invalid LOG_LEVEL '{log_level_str}' in settings. Using INFO.")
        log_level_str = "INFO"
    logging.getLogger().setLevel(log_level_str)
    logger.info(f"Successfully imported config module. Log level set to {log_level_str}.")
except ImportError as e:
    logger.critical(f"Failed to import config module: {e}. Cannot initialize database or settings.", exc_info=True)
    raise RuntimeError(f"Critical configuration import failed: {e}") from e
except Exception as e:
     logger.critical(f"Unexpected error importing config: {e}", exc_info=True)
     raise RuntimeError(f"Critical configuration import failed: {e}") from e

# --- Define Router Configurations ---
# Structure: 'module_key': {'module_path': str, 'router_name': str, 'prefix': str, 'tags': list[str]}
ROUTER_CONFIGS = {
    # Authentication Routers
    "auth": {
        "module_path": "domain.authentication.endpoints",
        "router_name": "auth_router",
        "prefix": "/auth",
        "tags": ["Authentication"]
    },
    "users": {
        "module_path": "domain.authentication.endpoints",
        "router_name": "user_router",
        "prefix": "/users",
        "tags": ["Users"]
    },
    # Admin Protected Router (Example - ensure it exists in endpoints.py)
    # "admin_protected": {
    #     "module_path": "domain.authentication.endpoints",
    #     "router_name": "admin_protected_router",
    #     "prefix": "/admin-area", # Example prefix
    #     "tags": ["Admin Protected"]
    # },
    # Other Domain Routers
    "product": {
        "module_path": "domain.product.endpoints",
        "router_name": "router", # Assuming 'router' is the common name
        "prefix": "/products",
        "tags": ["Products"]
    },
    "inventory": {
        "module_path": "domain.inventory.endpoint", # Check if 'endpoint' or 'endpoints'
        "router_name": "router",
        "prefix": "/inventory",
        "tags": ["Inventory"]
    },
    "cart": {
        "module_path": "domain.cart.endpoints",
        "router_name": "router",
        "prefix": "/cart",
        "tags": ["Cart"]
    },
    "order": {
        "module_path": "domain.order.endpoints",
        "router_name": "router",
        "prefix": "/orders", # Define a prefix like /orders explicitly
        "tags": ["Orders"]
    },
    "ai": {
        "module_path": "domain.ai.endpoints",
        "router_name": "router",
        "prefix":"/api/v1/ai",
        "tags": ["AI Features"]
    },
}

# --- Attempt to Import Models Implicitly (SQLAlchemy Requirement) ---
# SQLAlchemy needs models imported somewhere so Base knows about them before create_all
MODEL_MODULE_PATHS = [
    "domain.authentication.models",
    "domain.product.models",
    "domain.inventory.models",
    "domain.cart.models",
    "domain.order.models",
    # Add other model paths if they exist
]
logger.info("--- Pre-importing Model Modules ---")
for path in MODEL_MODULE_PATHS:
    try:
        importlib.import_module(path)
        logger.info(f"Successfully pre-imported models from: {path}")
    except ImportError:
        logger.warning(f"Could not pre-import models module (may not exist or error): {path}")
    except Exception as e:
        logger.error(f"Error pre-importing models module {path}: {e}", exc_info=True)


# --- Initialize Database ---
if config_imported and hasattr(db, 'init_db'):
    logger.info("Initializing database via config.db.init_db()...")
    try:
        # Log known tables *before* creating them
        known_table_names_before = list(db.Base.metadata.tables.keys())
        logger.info(f"Models known to Base.metadata before create_all: {known_table_names_before}")
        if not all(table in known_table_names_before for table in ["users", "products"]): # Example check
             logger.warning("Essential tables (users, products) not found in Base.metadata before create_all. Check model imports.")

        db.init_db() # Calls Base.metadata.create_all(bind=engine)
        known_table_names_after = list(db.Base.metadata.tables.keys())
        logger.info(f"Database initialization (create_all) completed. Tables now known: {known_table_names_after}")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}", exc_info=True)
        raise RuntimeError("Failed to initialize database.") from e
else:
    logger.error("Database configuration or init_db function not found. Database not initialized.")
    # Depending on your app, you might want to raise an error here too


# --- Create FastAPI App Instance ---
app = FastAPI(
    title="My E-commerce API",
    description="API for user authentication, product management, inventory tracking, shopping cart, and order processing.",
    version="1.1.0",
)

# --- CORS Middleware Configuration ---
logger.info("Configuring CORS middleware...")
# Default origins - adjust as needed
default_origins = ["http://localhost:5173", "http://localhost:3000"]
origins = default_origins
try:
    if config_imported and hasattr(settings, "ALLOWED_ORIGINS"):
        origins_str = getattr(settings, "ALLOWED_ORIGINS", "")
        if origins_str and isinstance(origins_str, str):
            configured_origins = [origin.strip() for origin in origins_str.split(',') if origin.strip()]
            if configured_origins:
                origins = configured_origins
            else:
                 logger.warning("ALLOWED_ORIGINS was empty in settings. Using default CORS origins.")
        elif not origins_str:
             logger.warning("ALLOWED_ORIGINS was empty or not found in settings. Using default CORS origins.")
        else:
            logger.warning(f"ALLOWED_ORIGINS in settings is not a string ('{type(origins_str)}'). Using default CORS origins.")
    else:
        logger.warning("ALLOWED_ORIGINS not found in settings or config not loaded. Using default CORS origins.")
except Exception as e:
    logger.error(f"Error processing ALLOWED_ORIGINS from settings: {e}. Using default CORS origins.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info(f"CORS middleware configured for origins: {origins}")

# --- Dynamically Include Routers ---
logger.info("--- Including Routers ---")
included_routers_count = 0
for key, config in ROUTER_CONFIGS.items():
    module_path = config['module_path']
    router_name = config['router_name']
    prefix = config['prefix']
    tags = config['tags']
    try:
        logger.debug(f"Attempting to import router '{router_name}' from module '{module_path}'...")
        module = importlib.import_module(module_path)
        router_instance = getattr(module, router_name, None)

        if router_instance and isinstance(router_instance, APIRouter):
            app.include_router(router_instance, prefix=prefix, tags=tags)
            logger.info(f"Successfully included router '{key}' ({router_name}) from '{module_path}' with prefix '{prefix}' and tags {tags}.")
            included_routers_count += 1
        elif router_instance:
             logger.error(f"Found '{router_name}' in '{module_path}' but it's not an APIRouter instance (type: {type(router_instance)}). Skipping inclusion for key '{key}'.")
        else:
            logger.error(f"Router variable '{router_name}' not found in module '{module_path}'. Skipping inclusion for key '{key}'.")

    except ImportError:
        logger.error(f"Failed to import module '{module_path}' for router key '{key}'. Router not included.", exc_info=True)
    except AttributeError:
         logger.error(f"AttributeError: Could not find '{router_name}' in '{module_path}' for key '{key}'. Router not included.", exc_info=True)
    except Exception as e:
        logger.error(f"Unexpected error including router for key '{key}' ({module_path}): {e}", exc_info=True)

if included_routers_count == 0:
    logger.critical("No routers were successfully included. The API will likely not function.")
else:
     logger.info(f"--- Finished including {included_routers_count} router(s) ---")


# --- Root Endpoint ---
@app.get("/", tags=["Root"])
async def root():
    # You can enhance this later if needed
    return {
        "message": f"Welcome to the E-commerce API ({app.version})",
        "status": "Running",
        "documentation": app.docs_url or "/docs"
    }

# --- Startup and Shutdown Events ---
@app.on_event("startup")
async def startup_event():
    logger.info("Application startup complete.")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutdown.")

# --- Optional: Add block for running with uvicorn directly ---
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    log_level_main = logging.getLevelName(logging.getLogger().level).lower()
    logger.info(f"Starting server via __main__ on {host}:{port} with log level {log_level_main}")
    # Consider setting reload based on an environment variable for production
    reload_flag = os.getenv("UVICORN_RELOAD", "true").lower() == "true"
    uvicorn.run(
        "main:app", # Point to the FastAPI app instance
        host=host,
        port=port,
        reload=reload_flag,
        log_level=log_level_main
    )