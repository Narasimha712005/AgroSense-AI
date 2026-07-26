"""
AgroSense AI - Backend Application

FastAPI server with:
- ML crop prediction
- Authentication
- Email verification
- Weather services
- CORS support for Vercel frontend

"""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import init_db
from app.core.config import get_settings


# ============================================================
# LOGGING
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
# STARTUP / SHUTDOWN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.info("=" * 60)
    logger.info("  AgroSense AI - Starting Backend")
    logger.info("=" * 60)


    # DATABASE

    logger.info("Initializing database...")

    try:
        await init_db()
        logger.info("Database ready.")

    except Exception as e:
        logger.error(
            "Database initialization failed: %s",
            e
        )
        raise



    # ML MODEL

    logger.info("Initializing ML model service...")

    try:

        from app.services.ml_service import predictor

        _ = predictor.model

        logger.info(
            "ML model loaded and validated. Classes: %d",
            len(predictor.model.classes_)
        )


    except Exception as e:

        logger.error(
            "ML model initialization failed: %s",
            e
        )



    logger.info("=" * 60)
    logger.info(" Backend started successfully!")
    logger.info(" Docs available at /docs")
    logger.info("=" * 60)


    yield


    logger.info(
        "AgroSense AI shutting down."
    )




# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(

    title="AgroSense AI",

    description=(
        "Intelligent Crop Recommendation "
        "Platform powered by Machine Learning"
    ),

    version="1.0.0",

    lifespan=lifespan,

    docs_url="/docs",

    redoc_url="/redoc"
)




# ============================================================
# CORS CONFIGURATION
# ============================================================


origins = [

    # Production frontend
    "https://agro-sense-ai-eta.vercel.app",


    # Local development
    "http://localhost:5173",
    "http://localhost:3000",


    # Render backend
    "https://agrosense-ai-backend.onrender.com"

]



# Add environment CORS values

if settings.CORS_ORIGINS:

    origins.extend(

        [
            x.strip()

            for x in settings.CORS_ORIGINS.split(",")

            if x.strip()
        ]

    )



# Remove duplicates

origins = list(set(origins))



logger.info(
    "Allowed CORS origins: %s",
    origins
)



app.add_middleware(

    CORSMiddleware,


    allow_origins=origins,


    allow_credentials=True,


    allow_methods=[
        "*"
    ],


    allow_headers=[
        "*"
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
# ROOT ROUTES
# ============================================================


@app.get("/")
async def root():

    return {

        "name": "AgroSense AI",

        "version": "1.0.0",

        "description":
            "Intelligent Crop Recommendation Platform",

        "docs": "/docs"

    }




@app.get("/health")
async def health_check():

    return {

        "status": "healthy",

        "service": "AgroSense AI Backend"

    }