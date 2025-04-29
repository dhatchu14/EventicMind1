# backend/config/db.py
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base # Base is created using this
from sqlalchemy.orm import sessionmaker
from .settings import settings # Make sure settings.py is in the same config directory

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = settings.DATABASE_URL # Get URL from settings
logger.info(f"Attempting to connect using DATABASE_URL: {'...' + DATABASE_URL[-20:] if DATABASE_URL else 'None'}") # Log safely

# --- REMOVE THIS LINE ---
# from config.db import Base  # <--- THIS CAUSED THE CIRCULAR IMPORT
# -----------------------

# Define Base HERE using the imported function
Base = declarative_base()
logger.info("SQLAlchemy Base created.")

engine = None
SessionLocal = None

try:
    connect_args = {}
    if DATABASE_URL and DATABASE_URL.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
        logger.info("Using SQLite database. Setting connect_args.")
    elif DATABASE_URL and DATABASE_URL.startswith("postgresql"):
         logger.info("Configuring PostgreSQL engine.")
    elif DATABASE_URL:
        logger.info(f"Configuring engine for DB type: {DATABASE_URL.split(':')[0]}")
    else:
        logger.error("DATABASE_URL is not set in settings!")
        raise ValueError("DATABASE_URL cannot be empty")


    engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False) # echo=True for debug
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    logger.info("Database engine and session configured successfully.")

    # This function will be called from main.py AFTER models are imported
    def init_db():
        if engine is None:
            logger.error("Database engine is not initialized. Cannot create tables.")
            return
        try:
            logger.info("Attempting to create database tables...")
            # Log models known to Base right before creating
            known_table_names = list(Base.metadata.tables.keys())
            logger.info(f"Models known to Base before create_all: {known_table_names}")
            if not known_table_names:
                 logger.warning("No tables found registered with Base.metadata. Ensure models are imported before calling init_db.")

            Base.metadata.create_all(bind=engine)
            logger.info("Database tables check/creation finished.")
        except Exception as e:
            logger.error(f"Error creating database tables: {e}", exc_info=True)
            # Depending on severity, you might want to raise e here

except Exception as e:
    logger.error(f"FATAL: Error configuring database connection: {e}", exc_info=True)
    # Define dummy functions so the app doesn't crash immediately on import if config fails,
    # but relies on later checks (like in get_db)
    def init_db():
        logger.error("Database initialization skipped due to FATAL connection configuration error.")
    def get_db():
         logger.error("Database session factory (SessionLocal) is not available due to FATAL connection configuration error.")
         raise RuntimeError("Database session not available due to configuration errors.")

# Only define get_db properly if SessionLocal was created
if SessionLocal:
    def get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
else:
    # If SessionLocal is None (due to the outer try/except failing), define get_db to raise error
     def get_db():
         logger.error("Database session factory (SessionLocal) is not available due to configuration errors.")
         raise RuntimeError("Database session not available due to configuration errors.")

logger.info("config/db.py loaded.") # Add a log to confirm this file finished loading