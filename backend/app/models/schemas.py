"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

_EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


# ============================================================
# AUTH SCHEMAS
# ============================================================

class UserRegister(BaseModel):
    email: str = Field(pattern=_EMAIL_PATTERN, max_length=255)
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_.-]+$")
    password: str = Field(min_length=8, max_length=128)
    full_name: Optional[str] = Field(default="", max_length=200)


class UserLogin(BaseModel):
    email: str = Field(max_length=255)
    password: str = Field(max_length=128)


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    is_active: bool
    is_admin: bool
    is_verified: bool = False
    auth_provider: str = "local"
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserResponse


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: str = Field(max_length=255)


class ResetPasswordRequest(BaseModel):
    password: str = Field(min_length=8, max_length=128)


class MessageResponse(BaseModel):
    message: str


# ============================================================
# PREDICTION SCHEMAS
# ============================================================

class PredictionRequest(BaseModel):
    # Bounds match the agronomic ranges of the training dataset
    nitrogen: float = Field(ge=0, le=300)
    phosphorus: float = Field(ge=0, le=300)
    potassium: float = Field(ge=0, le=300)
    temperature: float = Field(ge=-10, le=60)
    humidity: float = Field(ge=0, le=100)
    ph: float = Field(ge=0, le=14)
    rainfall: float = Field(ge=0, le=1000)


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
