"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ============================================================
# AUTH SCHEMAS
# ============================================================

class UserRegister(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = ""


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============================================================
# PREDICTION SCHEMAS
# ============================================================

class PredictionRequest(BaseModel):
    nitrogen: float
    phosphorus: float
    potassium: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float


class CropResult(BaseModel):
    crop: str
    confidence: float


class PredictionResponse(BaseModel):
    predicted_crop: str
    confidence: float
    top_crops: List[CropResult]
    crop_info: dict
    input_data: PredictionRequest
    id: Optional[int] = None
    created_at: Optional[datetime] = None


class PredictionHistoryItem(BaseModel):
    id: int
    predicted_crop: str
    confidence: float
    nitrogen: float
    phosphorus: float
    potassium: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# WEATHER SCHEMAS
# ============================================================

class WeatherResponse(BaseModel):
    temperature: float
    humidity: float
    wind_speed: float
    pressure: float
    description: str
    icon: str
    city: str
    forecast: List[dict] = []


# ============================================================
# FEEDBACK SCHEMAS
# ============================================================

class FeedbackRequest(BaseModel):
    prediction_id: Optional[int] = None
    rating: int
    comment: str = ""


class FeedbackResponse(BaseModel):
    id: int
    rating: int
    comment: str
    created_at: datetime

    class Config:
        from_attributes = True
