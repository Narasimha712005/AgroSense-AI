"""
AgroSense AI - Backend Application
FastAPI server with ML prediction, authentication, and weather services.
Self-healing startup: model is validated and retrained if necessary.
"""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import init_db
from app.core.config import get_settings


# ============================================================
# LOGGING SETUP
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-20s | %(levelname)-7s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger("agrosense")

settings = get_settings()


# ============================================================
# LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown handling.
    """

    logger.info("=" * 60)
    logger.info("  AgroSense AI - Starting Backend")
    logger.info("=" * 60)


    # ---------------- DATABASE ----------------

    logger.info("Initializing database...")

    try:
        await init_db()
        logger.info("Database ready.")

    except Exception as e:
        logger.error("Database initialization failed: %s", e)
        raise


    # ---------------- ML MODEL ----------------

    logger.info("Initializing ML model service...")

    try:
        from app.services.ml_service import predictor

        # Force model loading
        _ = predictor.model

        logger.info(
            "ML model loaded and validated. Classes: %d",
            len(predictor.model.classes_)
        )

    except Exception as e:
        logger.error("ML model initialization failed: %s", e)
        logger.error("Prediction service may be unavailable.")


    logger.info("=" * 60)
    logger.info("  Backend started successfully!")
    logger.info("  Docs: /docs")
    logger.info("=" * 60)


    yield


    logger.info("AgroSense AI - Shutting down.")



# ============================================================
# FASTAPI INSTANCE
# ============================================================

app = FastAPI(
    title="AgroSense AI",
    description="Intelligent Crop Recommendation Platform powered by Machine Learning",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)



# ============================================================
# CORS CONFIGURATION
# ============================================================

# Allowed frontend URLs

allowed_origins = [
    "https://agro-sense-ai-eta.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
]


# Add extra origins from environment variables

if settings.CORS_ORIGINS:
    extra_origins = [
        origin.strip()
        for origin in settings.CORS_ORIGINS.split(",")
        if origin.strip()
    ]

    allowed_origins.extend(extra_origins)


# Remove duplicates

allowed_origins = list(set(allowed_origins))


app.add_middleware(
    CORSMiddleware,

    allow_origins=allowed_origins,

    allow_credentials=True,

    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],

    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
    ],

)



# ============================================================
# ROUTERS
# ============================================================

from app.routers import auth, predictions, weather


app.include_router(auth.router)
app.include_router(predictions.router)
app.include_router(weather.router)



# ============================================================
# ROOT ENDPOINTS
# ============================================================


@app.get("/")
async def root():

    return {
        "name": "AgroSense AI",
        "version": "1.0.0",
        "description": "Intelligent Crop Recommendation Platform",
        "docs": "/docs",
    }



@app.get("/health")
async def health_check():

    return {
        "status": "healthy",
        "service": "AgroSense AI Backend"
    }