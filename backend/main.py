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
# LIFESPAN (startup / shutdown)
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - initialize DB and validate ML model."""
    logger.info("=" * 60)
    logger.info("  AgroSense AI - Starting Backend")
    logger.info("=" * 60)

    # --- Database ---
    logger.info("Initializing database...")
    try:
        await init_db()
        logger.info("Database ready.")
    except Exception as e:
        logger.error("Database initialization failed: %s", e)
        raise

    # --- ML Model (self-healing) ---
    logger.info("Initializing ML model service...")
    try:
        from app.services.ml_service import predictor
        # Force model load at startup so errors surface immediately
        _ = predictor.model
        logger.info("ML model loaded and validated. Classes: %d", len(predictor.model.classes_))
    except Exception as e:
        logger.error("ML model initialization failed: %s", e)
        logger.error("The /api/predict endpoint will be unavailable.")

    logger.info("=" * 60)
    logger.info("  Backend started successfully!")
    logger.info("  Docs: http://localhost:8000/docs")
    logger.info("=" * 60)

    yield

    logger.info("AgroSense AI - Shutting down.")


# ============================================================
# APP INSTANCE
# ============================================================

app = FastAPI(
    title="AgroSense AI",
    description="Intelligent Crop Recommendation Platform powered by Machine Learning",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware - origins configurable via FRONTEND_URL / CORS_ORIGINS env vars
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from app.routers import auth, predictions, weather  # noqa: E402

app.include_router(auth.router)
app.include_router(predictions.router)
app.include_router(weather.router)


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
    return {"status": "healthy", "service": "AgroSense AI Backend"}
