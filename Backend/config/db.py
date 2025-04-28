# backend/config/db.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .settings import settings
import logging

DATABASE_URL = settings.DATABASE_URL # Get URL from settings
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Add this line ---
logger.info(f"Attempting to connect using DATABASE_URL: {DATABASE_URL}")
# --------------------

engine = None
SessionLocal = None
Base = declarative_base() # Define Base here

try:
    connect_args = {}
    if DATABASE_URL.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
        logger.info("Using SQLite database.")
    # Add elif for postgresql if needed for specific args/logs
    elif DATABASE_URL.startswith("postgresql"):
         logger.info("Configuring PostgreSQL engine.")
    else:
        logger.info(f"Configuring engine for DB type: {DATABASE_URL.split(':')[0]}")


    engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False) # echo=True can be useful for debugging SQL too
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    logger.info("Database engine and session configured successfully.")

    def init_db():
        if engine is None:
            logger.error("Database engine is not initialized. Cannot create tables.")
            return
        try:
            logger.info("Attempting to create database tables...")
            # --- Add log before create_all ---
            logger.info(f"Models known to Base before create_all: {list(Base.metadata.tables.keys())}")
            # --------------------------------
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables checked/created successfully.")
        except Exception as e:
            # --- Enhance error logging ---
            logger.error(f"Error creating database tables: {e}", exc_info=True) # Add exc_info=True
            # raise e # Consider uncommenting this during debug to halt on error
            # ----------------------------

except Exception as e:
    logger.error(f"FATAL: Error configuring database connection: {e}", exc_info=True) # Add exc_info=True
    def init_db():
        logger.error("Database initialization skipped due to connection error.")

def get_db():
    if SessionLocal is None:
         logger.error("Database session factory (SessionLocal) is not available.")
         raise RuntimeError("Database session not available due to connection errors.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()