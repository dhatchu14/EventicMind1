import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# --- Setup Logging Early ---
# Basic config first, might be refined if settings load successfully
logging.basicConfig(level="INFO", format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__) # Get root logger instance

# --- Import Config ---
try:
    from config import db, settings # Adjust path if needed
    config_imported = True
    # Refine logging level if specified in settings
    log_level_str = getattr(settings, "LOG_LEVEL", "INFO").upper()
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
    "inventory":      {"path": "domain.inventory.endpoint", "routers": ["router"], "router_var": "inventory_router", "models_module": "domain.inventory.models", "tag": "Inventory", "prefix": "/inventory"}, # Check 'endpoint' vs 'endpoints'
    "cart":           {"path": "domain.cart.endpoints", "routers": ["router"], "router_var": "cart_router", "models_module": "domain.cart.models", "tag": "Cart", "prefix": "/cart"},
    "order":          {"path": "domain.order.endpoints", "routers": ["router"], "router_var": "order_router", "models_module": "domain.order.models", "tag": "Orders", "prefix": ""}, # Order prefix likely handled in its router
}

imported_routers_map = {}
modules_imported_flags = {name: False for name in DOMAIN_MODULES}

for module_name, config in DOMAIN_MODULES.items():
    try:
        module = __import__(config["path"], fromlist=config["routers"])
        routers_found = []
        for router_name in config["routers"]:
            router_instance = getattr(module, router_name)
            routers_found.append(router_instance)
            # Store by specific name if provided (e.g., product_router)
            if "router_var" in config and router_name == "router":
                 globals()[config["router_var"]] = router_instance
            elif router_name == "auth_router": # Specific handling for auth
                 globals()["auth_router"] = router_instance
            elif router_name == "user_router":
                 globals()["user_router"] = router_instance

        imported_routers_map[module_name] = routers_found
        modules_imported_flags[module_name] = True
        logger.info(f"Successfully imported {module_name} router(s) from {config['path']}.")

        # --- Attempt to import models right after router import ---
        if config["models_module"]:
            try:
                # This import executes the model definitions, registering them with Base
                __import__(config["models_module"])
                logger.info(f"Successfully imported models from {config['models_module']} for {module_name}.")
            except ImportError as model_e:
                logger.warning(f"Could not import models from {config['models_module']} for {module_name}: {model_e}. Associated tables might not be created.")
            except Exception as model_e:
                 logger.error(f"Error importing models from {config['models_module']} for {module_name}: {model_e}.", exc_info=True)

    except ImportError as e:
        logger.warning(f"Could not import router module {config['path']} for {module_name}: {e}. Endpoints/models will be unavailable.")
    except AttributeError as e:
         logger.warning(f"Could not find expected router(s) in {config['path']} for {module_name}: {e}. Endpoints/models will be unavailable.")
    except Exception as e:
        logger.error(f"Unexpected error during {module_name} router import from {config['path']}: {e}.", exc_info=True)

# Use the flags derived from the loop above
auth_module_imported = modules_imported_flags["authentication"]
product_module_imported = modules_imported_flags["product"]
inventory_module_imported = modules_imported_flags["inventory"]
cart_module_imported = modules_imported_flags["cart"]
order_module_imported = modules_imported_flags["order"]


# --- Model Registration Check (Conceptual Logging) ---
logger.info("Model registration check complete (models imported alongside routers). Verify DB logs.")

# --- Initialize Database ---
# This MUST happen AFTER all model files have been imported
if config_imported and hasattr(db, 'init_db'):
    logger.info("Initializing database via config.db.init_db()...")
    try:
        # Log models known to Base before creation (moved here for clarity)
        known_table_names = list(db.Base.metadata.tables.keys())
        logger.info(f"Models known to Base before init_db: {known_table_names}")
        if 'delivery_info' not in known_table_names or 'orders' not in known_table_names:
             logger.warning("Order/DeliveryInfo tables not found in Base.metadata before create_all. Check imports.")

        db.init_db() # This calls Base.metadata.create_all(bind=db.engine)
        logger.info("Database initialization (create_all) completed.")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}", exc_info=True)
        raise RuntimeError("Failed to initialize database.") from e
# ... (rest of the code: FastAPI app creation, CORS, include routers, root endpoint, events) ...

# --- Create FastAPI App Instance ---
app = FastAPI(
    title="My E-commerce API",
    description="API for user authentication, product management, inventory tracking, shopping cart, and order processing with Cash on Delivery payment.",
    version="1.0.2",
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
    allow_methods=["*"], # Allows all standard methods
    allow_headers=["*"], # Allows all headers
)
logger.info(f"CORS middleware configured for origins: {origins}")


# --- Include Routers ---
API_PREFIX = "" # Set your desired global API prefix here, e.g., "/api/v1"

# Include Auth/User Router (Specific Handling)
if auth_module_imported:
    auth_routers = imported_routers_map.get("authentication", [])
    if len(auth_routers) >= 2:
        logger.info(f"Including authentication router at prefix: {API_PREFIX}/auth")
        app.include_router(auth_routers[0], prefix=f"{API_PREFIX}/auth", tags=["Authentication"]) # Assuming auth_router is first
        logger.info(f"Including user router at prefix: {API_PREFIX}/users")
        app.include_router(auth_routers[1], prefix=f"{API_PREFIX}/users", tags=["Users"]) # Assuming user_router is second
    else:
        logger.error("Authentication module loaded, but expected routers (auth_router, user_router) not found correctly in map.")
else:
    logger.warning("Authentication/User routers not included due to import failure.")

# Include other Domain Routers using the map and flags
for module_name, config in DOMAIN_MODULES.items():
    if module_name == "authentication": continue # Already handled

    if modules_imported_flags[module_name]:
        router_instance = imported_routers_map[module_name][0] # Assuming single router 'router'
        prefix = config.get("prefix", f"/{module_name}s") # Default prefix convention
        tag = config.get("tag", module_name.capitalize())
        logger.info(f"Including {module_name} router at prefix: {API_PREFIX}{prefix}")
        app.include_router(router_instance, prefix=f"{API_PREFIX}{prefix}", tags=[tag])
    else:
        logger.warning(f"{module_name.capitalize()} router not included.")


# --- Root Endpoint ---
@app.get(f"{API_PREFIX}/", tags=["Root"])
async def root():
    modules_loaded = [name.capitalize() for name, loaded in modules_imported_flags.items() if loaded]
    if "Authentication" in modules_loaded: # Adjust naming if needed
        modules_loaded.remove("Authentication")
        modules_loaded = ["Authentication", "User"] + modules_loaded

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