"""Prediction router - crop recommendation API."""
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.database_models import User, Prediction
from app.models.schemas import PredictionRequest, PredictionResponse, PredictionHistoryItem, CropResult
from app.services.ml_service import predictor

logger = logging.getLogger("agrosense.predictions")

router = APIRouter(prefix="/api", tags=["Predictions"])


async def get_optional_user(authorization: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)):
    """Get user from token if provided."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    result = await db.execute(select(User).where(User.id == int(user_id)))
    return result.scalar_one_or_none()


@router.post("/predict", response_model=PredictionResponse)
async def predict_crop(
    data: PredictionRequest,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Predict the best crop based on soil and climate parameters.
    Uses the existing Random Forest model (crop_model.pkl).
    """
    try:
        result = predictor.predict(
            nitrogen=data.nitrogen,
            phosphorus=data.phosphorus,
            potassium=data.potassium,
            temperature=data.temperature,
            humidity=data.humidity,
            ph=data.ph,
            rainfall=data.rainfall
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    # Save to history if user is authenticated
    prediction_id = None
    created_at = None
    user = await get_optional_user(authorization, db)
    
    if user:
        prediction = Prediction(
            user_id=user.id,
            nitrogen=data.nitrogen,
            phosphorus=data.phosphorus,
            potassium=data.potassium,
            temperature=data.temperature,
            humidity=data.humidity,
            ph=data.ph,
            rainfall=data.rainfall,
            predicted_crop=result["predicted_crop"],
            confidence=result["confidence"],
            top_crops=json.dumps(result["top_crops"])
        )
        db.add(prediction)
        await db.commit()
        await db.refresh(prediction)
        prediction_id = prediction.id
        created_at = prediction.created_at

    return PredictionResponse(
        predicted_crop=result["predicted_crop"],
        confidence=result["confidence"],
        top_crops=[CropResult(**c) for c in result["top_crops"]],
        crop_info=result["crop_info"],
        input_data=data,
        id=prediction_id,
        created_at=created_at
    )


@router.get("/history")
async def get_prediction_history(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """Get prediction history for authenticated user."""
    user = await get_optional_user(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = await db.execute(
        select(Prediction)
        .where(Prediction.user_id == user.id)
        .order_by(desc(Prediction.created_at))
        .limit(50)
    )
    predictions = result.scalars().all()
    
    return [PredictionHistoryItem.model_validate(p) for p in predictions]


@router.get("/stats")
async def get_feature_stats():
    """Get feature statistics for frontend input ranges."""
    return predictor.get_feature_stats()


@router.get("/model-info")
async def get_model_info():
    """Get model information."""
    try:
        model = predictor.model
        return {
            "algorithm": "Random Forest Classifier",
            "n_estimators": getattr(model, "n_estimators", 200),
            "features": predictor.features,
            "n_classes": len(model.classes_),
            "classes": [str(c) for c in model.classes_],
            "sklearn_version": __import__("sklearn").__version__,
        }
    except Exception as e:
        logger.error("Failed to get model info: %s", e)
        raise HTTPException(status_code=503, detail="Model not available")
