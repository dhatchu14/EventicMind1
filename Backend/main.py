# main.py (Complete Code with Fixed Logging Config)

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# --- Setup Logging Early ---
# Use a STANDARD format string - REMOVED %(module_name)s
logging.basicConfig(level="DEBUG", format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__) # Get root logger instance

# --- Import Config ---
try:
    from config import db, settings
    config_imported = True
    # Refine logging level if specified in settings
    log_level_str = getattr(settings, "LOG_LEVEL", "DEBUG").upper() # Default to DEBUG
    valid_log_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
    if log_level_str not in valid_log_levels:
        logger.warning(f"Invalid LOG_LEVEL '{log_level_str}' in settings. Using DEBUG.")
        log_level_str = "DEBUG"
    logging.getLogger().setLevel(log_level_str) # Set level on root logger
    logger.info(f"Successfully imported config module. Log level set to {log_level_str}.")
except ImportError as e:
    logger.critical(f"Failed to import config module: {e}. Cannot initialize database or settings.", exc_info=True)
    raise RuntimeError(f"Critical configuration import failed: {e}") from e
except Exception as e:
     logger.critical(f"Unexpected error importing config: {e}", exc_info=True)
     raise RuntimeError(f"Critical configuration import failed: {e}") from e


# --- Import Domain Routers and Models ---
# Define expected modules, their import paths/routers, and associated models
DOMAIN_MODULES = {
    "authentication": {"path": "domain.authentication.endpoints", "routers": ["auth_router", "user_router"], "models_module": "domain.authentication.models", "tag": "Authentication/Users"},
    "product":        {"path": "domain.product.endpoints", "routers": ["router"], "router_var": "product_router", "models_module": "domain.product.models", "tag": "Products", "prefix": "/products"},
    "inventory":      {"path": "domain.inventory.endpoint", "routers": ["router"], "router_var": "inventory_router", "models_module": "domain.inventory.models", "tag": "Inventory", "prefix": "/inventory"},
    "cart":           {"path": "domain.cart.endpoints", "routers": ["router"], "router_var": "cart_router", "models_module": "domain.cart.models", "tag": "Cart", "prefix": "/cart"},
    "order":          {"path": "domain.order.endpoints", "routers": ["router"], "router_var": "order_router", "models_module": "domain.order.models", "tag": "Orders", "prefix": ""},
    "ai":             {"path": "domain.ai.endpoints",       "routers": ["router"], "router_var": "ai_router",          "models_module": None,                 "tag": "AI Features", "prefix": "/ai"},
}

imported_routers_map = {}
modules_imported_flags = {name: False for name in DOMAIN_MODULES}

logger.info("--- Starting Domain Module Import ---") # Start marker

for module_name, config in DOMAIN_MODULES.items():
    # Use f-strings for manual prefixing, not the main formatter
    logger.info(f"Attempting to process domain module: '{module_name}'")
    try:
        module_path = config["path"]
        logger.debug(f"[{module_name}] Checking path: {module_path}")

        import importlib.util
        spec = importlib.util.find_spec(module_path)
        if spec is None:
            logger.warning(f"[{module_name}] Module path '{module_path}' not found by importlib. Skipping.")
            continue

        logger.debug(f"[{module_name}] Path found. Attempting import...")
        module = __import__(module_path, fromlist=config["routers"])
        logger.info(f"[{module_name}] Successfully imported module from {module_path}.")

        # --- Inner loop to find routers ---
        routers_found = []
        expected_routers = config["routers"]
        logger.debug(f"[{module_name}] Expecting router variable(s): {expected_routers}")

        for router_name in expected_routers:
            logger.debug(f"[{module_name}] Checking existence of attribute '{router_name}' using hasattr...")
            has_the_attr = hasattr(module, router_name)
            logger.debug(f"[{module_name}] hasattr(module, '{router_name}') returned: {has_the_attr}") # LOG THE RESULT

            if has_the_attr:
                logger.debug(f"[{module_name}] Attribute '{router_name}' found. Getting attribute...")
                router_instance = getattr(module, router_name)
                from fastapi import APIRouter # Import here for the check
                if isinstance(router_instance, APIRouter):
                    routers_found.append(router_instance)
                    logger.info(f"[{module_name}] Successfully found and added router '{router_name}'.")
                    if "router_var" in config:
                        globals()[config["router_var"]] = router_instance
                        logger.debug(f"[{module_name}] Stored router as global variable '{config['router_var']}'.")
                else:
                    logger.warning(f"[{module_name}] Attribute '{router_name}' found but it is not an APIRouter instance (type: {type(router_instance)}). Skipping.")
            else:
                logger.warning(f"[{module_name}] Router variable '{router_name}' NOT found in module {module_path} (hasattr returned False).")
        # --- End of inner loop ---

        if not routers_found:
             logger.warning(f"[{module_name}] No specified routers ({expected_routers}) were found or validated in the module. Module will be skipped.")
             continue

        imported_routers_map[module_name] = routers_found
        modules_imported_flags[module_name] = True
        logger.info(f"[{module_name}] Successfully processed and flagged module for inclusion.")

        # --- Attempt to import models right after router import ---
        if config.get("models_module"):
            try:
                __import__(config["models_module"])
                logger.info(f"[{module_name}] Successfully imported models from {config['models_module']}.")
            except ImportError as model_e:
                logger.warning(f"[{module_name}] Could not import models from {config['models_module']}: {model_e}.")
            except Exception as model_e:
                 logger.error(f"[{module_name}] Error importing models from {config['models_module']}: {model_e}.", exc_info=True)
        elif "models_module" in config and config["models_module"] is None:
             logger.info(f"[{module_name}] No dedicated models module specified. Skipping model import.")

    except ImportError as e:
        logger.error(f"[{module_name}] CRITICAL IMPORT ERROR for module {config.get('path', 'N/A')}: {e}. Module cannot be loaded.", exc_info=True)
    except AttributeError as e:
         logger.error(f"[{module_name}] Attribute Error while accessing router in {config.get('path', 'N/A')}: {e}. Check router names.", exc_info=True)
    except Exception as e:
        logger.error(f"[{module_name}] UNEXPECTED ERROR during {module_name} processing from {config.get('path', 'N/A')}: {e}.", exc_info=True)

logger.info("--- Finished Domain Module Import ---") # End marker

# Use the flags derived from the loop above
auth_module_imported = modules_imported_flags["authentication"]
product_module_imported = modules_imported_flags["product"]
inventory_module_imported = modules_imported_flags["inventory"]
cart_module_imported = modules_imported_flags["cart"]
order_module_imported = modules_imported_flags["order"]
ai_module_imported = modules_imported_flags["ai"]


# --- Model Registration Check (Conceptual Logging) ---
logger.info("Model registration check complete (models imported alongside routers). Verify DB logs.")

# --- Initialize Database ---
if config_imported and hasattr(db, 'init_db'):
    logger.info("Initializing database via config.db.init_db()...")
    try:
        known_table_names = list(db.Base.metadata.tables.keys())
        logger.info(f"Models known to Base before init_db: {known_table_names}")
        if not all(table in known_table_names for table in ["products", "inventory"]):
             logger.warning("Essential tables (products, inventory) not found in Base.metadata before create_all. Check model imports.")

        db.init_db()
        logger.info("Database initialization (create_all) completed.")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}", exc_info=True)
        raise RuntimeError("Failed to initialize database.") from e

# --- Create FastAPI App Instance ---
app = FastAPI(
    title="My E-commerce API",
    description="API for user authentication, product management, inventory tracking, shopping cart, and order processing with Cash on Delivery payment. Includes AI Sales Prediction.",
    version="1.1.0",
)

# --- CORS Middleware Configuration ---
logger.info("Configuring CORS middleware...")
origins = ["http://localhost:5173", "http://localhost:3000"] # Default origins
try:
    if config_imported and hasattr(settings, "ALLOWED_ORIGINS"):
        origins_str = getattr(settings, "ALLOWED_ORIGINS", "")
        if origins_str and isinstance(origins_str, str):
            configured_origins = [origin.strip() for origin in origins_str.split(',') if origin.strip()]
            if configured_origins:
                origins = configured_origins
                logger.info(f"CORS allowed origins loaded from settings: {origins}")
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


# --- Include Routers ---
API_PREFIX = ""

# Include Auth/User Router (Specific Handling)
if auth_module_imported:
    auth_routers = imported_routers_map.get("authentication", [])
    if len(auth_routers) >= 2:
        logger.info(f"Including authentication router at prefix: {API_PREFIX}/auth")
        app.include_router(auth_routers[0], prefix=f"{API_PREFIX}/auth", tags=["Authentication"])
        logger.info(f"Including user router at prefix: {API_PREFIX}/users")
        app.include_router(auth_routers[1], prefix=f"{API_PREFIX}/users", tags=["Users"])
    elif len(auth_routers) == 1:
        logger.warning("Authentication module loaded, but only one router found. Including it at /auth.")
        app.include_router(auth_routers[0], prefix=f"{API_PREFIX}/auth", tags=["Authentication/Users"])
    else:
        logger.error("Authentication module loaded, but expected routers not found correctly in map.")
else:
    logger.warning("Authentication/User routers not included due to import failure.")

# Include other Domain Routers using the map and flags
for module_name, config in DOMAIN_MODULES.items():
    if module_name == "authentication": continue

    logger.debug(f"Checking inclusion flag for '{module_name}': {modules_imported_flags.get(module_name, 'Not Found')}") # Use .get for safety

    if modules_imported_flags.get(module_name, False): # Check flag using .get
        if module_name in imported_routers_map and imported_routers_map[module_name]:
            router_instance = imported_routers_map[module_name][0]
            prefix = config.get("prefix", f"/{module_name}")
            tag = config.get("tag", module_name.capitalize())
            full_prefix = f"{API_PREFIX}{prefix}"
            logger.info(f"Including {module_name} router at prefix: {full_prefix}")
            app.include_router(router_instance, prefix=full_prefix, tags=[tag])
        else:
            # This case should be less likely now due to checks in the first loop
            logger.warning(f"'{module_name.capitalize()}' module was flagged as imported, but no routers found in map. Router NOT included.")
    else:
        # This is the target warning we are trying to diagnose
        logger.warning(f"{module_name.capitalize()} router not included because module import failed or was skipped (flag is False).")


# --- Root Endpoint ---
@app.get(f"{API_PREFIX}/", tags=["Root"])
async def root():
    # Recalculate based on the final flags, ensuring consistency
    modules_loaded = [DOMAIN_MODULES[name].get("tag", name.capitalize())
                      for name, loaded in modules_imported_flags.items() if loaded]

    # Adjust specific tags if needed
    if "Authentication/Users" in modules_loaded:
        modules_loaded.remove("Authentication/Users")
        modules_loaded.extend(["Authentication", "Users"])
    # Ensure AI tag is only present if flag is True
    if "AI Features" in modules_loaded and not modules_imported_flags.get("ai", False):
        logger.error("Root endpoint inconsistency: AI Features tag present but flag is False.")
        modules_loaded.remove("AI Features")

    return {
        "message": f"Welcome to the E-commerce API ({app.version})",
        "active_modules": sorted(list(set(modules_loaded))),
        "documentation": app.docs_url or "/docs"
    }

# --- Startup and Shutdown Events ---
@app.on_event("startup")
async def startup_event():
    logger.info("Application startup sequence initiated.")
    logger.info("Application startup complete.")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutdown sequence initiated.")
    logger.info("Application shutdown complete.")

# --- Optional: Add block for running with uvicorn directly ---
# if __name__ == "__main__":
#     import uvicorn
#     port = int(os.getenv("PORT", 8000))
#     host = os.getenv("HOST", "127.0.0.1")
#     log_level_main = logging.getLevelName(logging.getLogger().level).lower()
#     logger.info(f"Starting server via __main__ on {host}:{port} with log level {log_level_main}")
#     uvicorn.run("main:app", host=host, port=port, reload=True, log_level=log_level_main)