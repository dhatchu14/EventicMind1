# backend/config/db.py
# (Keep the code exactly as provided in the *second* previous answer - the one with init_db)
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .settings import settings
import logging

DATABASE_URL = settings.DATABASE_URL
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

engine = None
SessionLocal = None
Base = declarative_base() # Define Base here

try:
    connect_args = {}
    if DATABASE_URL.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
        logger.info("Using SQLite database.")
    # ... (other DB type logs) ...

    engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    logger.info("Database engine and session configured successfully.")

    def init_db():
        if engine is None:
            logger.error("Database engine is not initialized. Cannot create tables.")
            return
        try:
            logger.info("Attempting to create database tables...")
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables checked/created successfully.")
        except Exception as e:
            logger.error(f"Error creating database tables: {e}")
            # raise e

except Exception as e:
    logger.error(f"FATAL: Error configuring database connection: {e}")
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