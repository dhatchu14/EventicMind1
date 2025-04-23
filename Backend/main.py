# backend/main.py
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import db, settings
# Updated import: Import the router objects from the endpoints file
from domain.authentication.endpoints import auth_router, user_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Database (create tables)
# Make sure models are imported (via endpoints import) before calling this
db.init_db()

app = FastAPI(
    title="My Authentication API",
    description="API for user authentication using FastAPI and DDD (Updated Structure).",
    version="0.1.1",
)

# CORS Middleware (Keep as before)
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router) # Includes /auth/signup, /auth/login
app.include_router(user_router) # Includes /users/me

@app.get("/")
async def root():
    return {"message": "Welcome to the Authentication API!"}

# Optional: Run with uvicorn if needed for specific cases
# if __name__ == "__main__":
#     import uvicorn
#     logger.info("Starting Uvicorn server...")
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)