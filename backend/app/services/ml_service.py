"""
AgroSense AI - Self-Healing ML Service
=======================================
Handles model loading, compatibility checks, and automatic retraining.
Uses joblib for serialization. Never crashes on startup.
"""
import logging
import threading
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import sklearn

logger = logging.getLogger("agrosense.ml")

# ============================================================
# PATHS
# ============================================================

ML_MODELS_DIR = Path(__file__).parent.parent.parent / "ml_models"
MODEL_PATH = ML_MODELS_DIR / "crop_model.pkl"
STATS_PATH = ML_MODELS_DIR / "feature_stats.pkl"
DATASET_PATH = ML_MODELS_DIR / "crop_recommendation.csv"

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
TARGET = "Crop"


# ============================================================
# TRAINING MODULE
# ============================================================

def train_model() -> tuple:
    """
    Train a Random Forest model from the dataset.
    Returns (model, stats_dict).
    """
    logger.info("Loading dataset from %s", DATASET_PATH)

    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)

    # Normalize column names
    if "label" in df.columns:
        df.rename(columns={"label": TARGET}, inplace=True)

    df = df.dropna()

    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=0
    )

    logger.info("Training Random Forest (n_estimators=200)...")
    model = RandomForestClassifier(random_state=1, n_estimators=200, n_jobs=-1)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)
    logger.info("Training complete. Test accuracy: %.2f%%", acc * 100)

    # Feature statistics for frontend slider ranges
    stats = X.describe().to_dict()

    return model, stats


def save_model(model, stats) -> None:
    """Save model and stats using joblib."""
    ML_MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(stats, STATS_PATH)
    logger.info("Saved model to %s", MODEL_PATH)
    logger.info("Saved feature_stats to %s", STATS_PATH)


# ============================================================
# COMPATIBILITY CHECKER
# ============================================================

def check_model_compatibility(model) -> bool:
    """Verify the loaded model is compatible with current sklearn/numpy."""
    try:
        # Test a dummy prediction to catch numpy._core errors
        dummy = pd.DataFrame(
            [[50, 50, 50, 25, 70, 6.5, 200]],
            columns=FEATURES
        )
        model.predict(dummy)
        if hasattr(model, "predict_proba"):
            model.predict_proba(dummy)
        return True
    except Exception as e:
        logger.warning("Model compatibility check failed: %s", e)
        return False


# ============================================================
# MODEL LOADER (Self-Healing)
# ============================================================

def load_or_train_model() -> tuple:
    """
    Attempt to load existing model. If it fails or is incompatible,
    automatically retrain from the dataset.
    """
    model = None
    stats = None

    # --- Attempt load ---
    if MODEL_PATH.exists() and STATS_PATH.exists():
        logger.info("Loading model from %s", MODEL_PATH)
        try:
            model = joblib.load(MODEL_PATH)
            stats = joblib.load(STATS_PATH)
            logger.info("Model loaded. Checking compatibility...")

            if not check_model_compatibility(model):
                logger.warning("Model incompatible with current libraries. Retraining...")
                model, stats = None, None
            else:
                logger.info("Model compatible. sklearn=%s, numpy=%s", sklearn.__version__, np.__version__)
        except Exception as e:
            logger.warning("Failed to load model: %s. Will retrain.", e)
            model, stats = None, None
    else:
        logger.info("Model files not found. Will train from scratch.")

    # --- Retrain if needed ---
    if model is None or stats is None:
        if not DATASET_PATH.exists():
            raise RuntimeError(
                f"Cannot train model: dataset not found at {DATASET_PATH}. "
                "Please place crop_recommendation.csv in the ml_models directory."
            )
        logger.info("Retraining model...")
        model, stats = train_model()
        save_model(model, stats)
        logger.info("Model retrained and saved successfully.")

    return model, stats


# ============================================================
# CROP INFORMATION DATABASE
# ============================================================

CROP_INFO = {
    "rice": {
        "season": "Kharif (June - November)", "harvest_time": "120-150 days",
        "water_requirement": "High (1200-2000 mm)", "temperature_range": "20-35°C",
        "humidity_range": "60-80%", "ideal_ph": "5.0-6.5", "market_demand": "Very High",
        "expected_yield": "3-6 tons/hectare",
        "suitable_states": "West Bengal, Punjab, UP, Tamil Nadu, Andhra Pradesh",
        "fertilizers": ["Urea", "DAP", "MOP"],
        "organic_alternatives": ["Vermicompost", "Green Manure", "Neem Cake"],
        "advantages": ["Staple food crop", "High market demand", "Government support"],
        "risks": ["Water intensive", "Pest attacks", "Climate sensitive"],
        "profit_estimate": "₹40,000 - ₹80,000 per hectare"
    },
    "wheat": {
        "season": "Rabi (November - April)", "harvest_time": "120-150 days",
        "water_requirement": "Medium (450-650 mm)", "temperature_range": "10-25°C",
        "humidity_range": "50-70%", "ideal_ph": "6.0-7.5", "market_demand": "Very High",
        "expected_yield": "3-5 tons/hectare",
        "suitable_states": "Punjab, Haryana, UP, MP, Rajasthan",
        "fertilizers": ["Urea", "DAP", "Zinc Sulphate"],
        "organic_alternatives": ["FYM", "Bone Meal", "Rock Phosphate"],
        "advantages": ["Stable prices", "Low water need", "Long storage"],
        "risks": ["Rust disease", "Terminal heat stress", "Lodging"],
        "profit_estimate": "₹35,000 - ₹70,000 per hectare"
    },
    "maize": {
        "season": "Kharif & Rabi", "harvest_time": "90-120 days",
        "water_requirement": "Medium (500-800 mm)", "temperature_range": "21-30°C",
        "humidity_range": "50-75%", "ideal_ph": "5.5-7.0", "market_demand": "High",
        "expected_yield": "4-8 tons/hectare",
        "suitable_states": "Karnataka, MP, Bihar, Rajasthan, UP",
        "fertilizers": ["Urea", "SSP", "MOP"],
        "organic_alternatives": ["Compost", "Bio-fertilizers", "Green Manure"],
        "advantages": ["Short duration", "Multiple uses", "Good returns"],
        "risks": ["Fall armyworm", "Drought sensitivity", "Storage pests"],
        "profit_estimate": "₹30,000 - ₹60,000 per hectare"
    },
    "cotton": {
        "season": "Kharif (April - October)", "harvest_time": "150-180 days",
        "water_requirement": "Medium-High (700-1300 mm)", "temperature_range": "21-35°C",
        "humidity_range": "40-65%", "ideal_ph": "6.0-8.0", "market_demand": "High",
        "expected_yield": "1.5-3 tons/hectare",
        "suitable_states": "Gujarat, Maharashtra, Telangana, MP, Rajasthan",
        "fertilizers": ["Urea", "DAP", "MOP", "Zinc"],
        "organic_alternatives": ["Neem Cake", "Castor Cake", "Vermicompost"],
        "advantages": ["Cash crop", "Industrial demand", "Export potential"],
        "risks": ["Bollworm", "High input cost", "Price volatility"],
        "profit_estimate": "₹50,000 - ₹1,00,000 per hectare"
    },
    "jute": {
        "season": "Kharif (March - July)", "harvest_time": "120-150 days",
        "water_requirement": "High (1000-1500 mm)", "temperature_range": "24-37°C",
        "humidity_range": "70-90%", "ideal_ph": "6.0-7.5", "market_demand": "Medium",
        "expected_yield": "2-3 tons/hectare",
        "suitable_states": "West Bengal, Bihar, Assam, Odisha",
        "fertilizers": ["Urea", "SSP", "MOP"],
        "organic_alternatives": ["FYM", "Compost", "Bio-fertilizers"],
        "advantages": ["Eco-friendly", "Government support", "Low input cost"],
        "risks": ["Limited market", "Labor intensive", "Retting issues"],
        "profit_estimate": "₹30,000 - ₹50,000 per hectare"
    },
    "coffee": {
        "season": "Perennial (Harvest: Nov - Feb)", "harvest_time": "3-4 years for first harvest",
        "water_requirement": "Medium (1500-2500 mm rainfall)", "temperature_range": "15-28°C",
        "humidity_range": "70-80%", "ideal_ph": "6.0-6.5", "market_demand": "Very High",
        "expected_yield": "1-2 tons/hectare",
        "suitable_states": "Karnataka, Kerala, Tamil Nadu",
        "fertilizers": ["NPK Complex", "Urea", "Lime"],
        "organic_alternatives": ["Coffee Pulp Compost", "Vermicompost", "Bone Meal"],
        "advantages": ["High value crop", "Export demand", "Shade grown"],
        "risks": ["Long gestation", "White stem borer", "Price fluctuation"],
        "profit_estimate": "₹1,00,000 - ₹3,00,000 per hectare"
    },
    "coconut": {
        "season": "Perennial", "harvest_time": "5-6 years for first harvest",
        "water_requirement": "Medium (1500-2500 mm)", "temperature_range": "20-32°C",
        "humidity_range": "70-80%", "ideal_ph": "5.5-7.0", "market_demand": "High",
        "expected_yield": "80-120 nuts/palm/year",
        "suitable_states": "Kerala, Karnataka, Tamil Nadu, Andhra Pradesh",
        "fertilizers": ["NPK", "Borax", "Magnesium Sulphate"],
        "organic_alternatives": ["Coir Pith Compost", "Green Manure", "Fish Meal"],
        "advantages": ["Multiple products", "Steady income", "Long productive life"],
        "risks": ["Long gestation", "Rhinoceros beetle", "Root wilt"],
        "profit_estimate": "₹80,000 - ₹1,50,000 per hectare"
    },
    "apple": {
        "season": "Temperate (Harvest: Aug - Oct)", "harvest_time": "4-8 years for full bearing",
        "water_requirement": "Medium (1000-1500 mm)", "temperature_range": "5-24°C",
        "humidity_range": "60-80%", "ideal_ph": "5.5-6.5", "market_demand": "Very High",
        "expected_yield": "10-20 tons/hectare",
        "suitable_states": "Jammu & Kashmir, Himachal Pradesh, Uttarakhand",
        "fertilizers": ["NPK", "Calcium Nitrate", "Boron"],
        "organic_alternatives": ["FYM", "Vermicompost", "Bone Meal"],
        "advantages": ["High value", "Storage potential", "Export quality"],
        "risks": ["Frost damage", "Scab disease", "High initial investment"],
        "profit_estimate": "₹3,00,000 - ₹8,00,000 per hectare"
    },
    "mango": {
        "season": "Summer (Harvest: May - July)", "harvest_time": "5-8 years for bearing",
        "water_requirement": "Low-Medium (500-1000 mm)", "temperature_range": "24-30°C",
        "humidity_range": "50-60%", "ideal_ph": "5.5-7.5", "market_demand": "Very High",
        "expected_yield": "8-15 tons/hectare",
        "suitable_states": "UP, AP, Karnataka, Maharashtra, Gujarat",
        "fertilizers": ["NPK", "Zinc Sulphate", "Borax"],
        "organic_alternatives": ["FYM", "Neem Cake", "Vermicompost"],
        "advantages": ["King of fruits", "Export potential", "Processing value"],
        "risks": ["Alternate bearing", "Mango hopper", "Anthracnose"],
        "profit_estimate": "₹2,00,000 - ₹5,00,000 per hectare"
    },
    "grapes": {
        "season": "Perennial (Harvest: Feb - May)", "harvest_time": "2-3 years for bearing",
        "water_requirement": "Low-Medium (500-800 mm)", "temperature_range": "15-35°C",
        "humidity_range": "40-60%", "ideal_ph": "6.0-7.5", "market_demand": "Very High",
        "expected_yield": "20-30 tons/hectare",
        "suitable_states": "Maharashtra, Karnataka, AP, Tamil Nadu",
        "fertilizers": ["NPK", "Micronutrients", "Potash"],
        "organic_alternatives": ["FYM", "Vermicompost", "Seaweed Extract"],
        "advantages": ["High returns", "Export quality", "Wine industry"],
        "risks": ["Downy mildew", "High investment", "Labor intensive"],
        "profit_estimate": "₹4,00,000 - ₹10,00,000 per hectare"
    },
    "banana": {
        "season": "Year-round", "harvest_time": "12-14 months",
        "water_requirement": "High (1500-2500 mm)", "temperature_range": "20-35°C",
        "humidity_range": "75-85%", "ideal_ph": "6.0-7.5", "market_demand": "Very High",
        "expected_yield": "40-60 tons/hectare",
        "suitable_states": "Tamil Nadu, Maharashtra, Gujarat, AP, Karnataka",
        "fertilizers": ["Urea", "MOP", "Magnesium Sulphate"],
        "organic_alternatives": ["FYM", "Vermicompost", "Banana Pseudostem"],
        "advantages": ["Quick returns", "High demand", "Multiple uses"],
        "risks": ["Panama disease", "Wind damage", "Nematodes"],
        "profit_estimate": "₹2,00,000 - ₹4,00,000 per hectare"
    },
    "chickpea": {
        "season": "Rabi (October - March)", "harvest_time": "90-120 days",
        "water_requirement": "Low (300-500 mm)", "temperature_range": "15-30°C",
        "humidity_range": "40-60%", "ideal_ph": "6.0-8.0", "market_demand": "High",
        "expected_yield": "1-2 tons/hectare",
        "suitable_states": "MP, Rajasthan, Maharashtra, UP, Karnataka",
        "fertilizers": ["DAP", "Rhizobium", "PSB"],
        "organic_alternatives": ["Rhizobium Inoculant", "FYM", "Rock Phosphate"],
        "advantages": ["Low water need", "Fixes nitrogen", "High protein"],
        "risks": ["Pod borer", "Wilt disease", "Frost sensitive"],
        "profit_estimate": "₹25,000 - ₹50,000 per hectare"
    },
    "lentil": {
        "season": "Rabi (October - March)", "harvest_time": "100-120 days",
        "water_requirement": "Low (300-450 mm)", "temperature_range": "15-25°C",
        "humidity_range": "40-60%", "ideal_ph": "6.0-7.5", "market_demand": "High",
        "expected_yield": "1-1.5 tons/hectare",
        "suitable_states": "MP, UP, Bihar, West Bengal",
        "fertilizers": ["DAP", "Rhizobium", "Sulphur"],
        "organic_alternatives": ["FYM", "Rhizobium", "Rock Phosphate"],
        "advantages": ["Short duration", "Low input", "Soil improver"],
        "risks": ["Rust", "Wilt", "Aphids"],
        "profit_estimate": "₹25,000 - ₹45,000 per hectare"
    },
    "pomegranate": {
        "season": "Three seasons possible", "harvest_time": "150-180 days after flowering",
        "water_requirement": "Low (500-700 mm)", "temperature_range": "25-35°C",
        "humidity_range": "40-60%", "ideal_ph": "6.5-7.5", "market_demand": "Very High",
        "expected_yield": "10-15 tons/hectare",
        "suitable_states": "Maharashtra, Karnataka, AP, Rajasthan, Gujarat",
        "fertilizers": ["NPK", "Zinc", "Boron"],
        "organic_alternatives": ["FYM", "Vermicompost", "Neem Cake"],
        "advantages": ["High value", "Export demand", "Drought tolerant"],
        "risks": ["Bacterial blight", "Fruit borer", "Oily spot"],
        "profit_estimate": "₹3,00,000 - ₹6,00,000 per hectare"
    },
    "watermelon": {
        "season": "Summer (Feb - May)", "harvest_time": "80-100 days",
        "water_requirement": "Medium (400-600 mm)", "temperature_range": "25-35°C",
        "humidity_range": "60-80%", "ideal_ph": "6.0-7.0", "market_demand": "High (seasonal)",
        "expected_yield": "30-50 tons/hectare",
        "suitable_states": "Rajasthan, Karnataka, UP, MP, Tamil Nadu",
        "fertilizers": ["Urea", "DAP", "MOP"],
        "organic_alternatives": ["FYM", "Vermicompost", "Bio-fertilizers"],
        "advantages": ["Short duration", "High yield", "Good returns"],
        "risks": ["Perishable", "Fruit fly", "Powdery mildew"],
        "profit_estimate": "₹50,000 - ₹1,50,000 per hectare"
    },
    "muskmelon": {
        "season": "Summer (Feb - May)", "harvest_time": "70-90 days",
        "water_requirement": "Medium (400-600 mm)", "temperature_range": "24-32°C",
        "humidity_range": "60-75%", "ideal_ph": "6.0-7.0", "market_demand": "Medium-High",
        "expected_yield": "15-25 tons/hectare",
        "suitable_states": "Punjab, Rajasthan, UP, MP",
        "fertilizers": ["Urea", "DAP", "MOP"],
        "organic_alternatives": ["FYM", "Vermicompost", "Neem Cake"],
        "advantages": ["Short duration", "High demand", "Good taste"],
        "risks": ["Very perishable", "Powdery mildew", "Transport loss"],
        "profit_estimate": "₹40,000 - ₹1,00,000 per hectare"
    },
    "orange": {
        "season": "Winter harvest", "harvest_time": "5-7 years for full bearing",
        "water_requirement": "Medium (900-1200 mm)", "temperature_range": "15-35°C",
        "humidity_range": "50-70%", "ideal_ph": "5.5-7.0", "market_demand": "High",
        "expected_yield": "10-20 tons/hectare",
        "suitable_states": "Maharashtra (Nagpur), MP, Rajasthan, Punjab",
        "fertilizers": ["NPK", "Zinc", "Iron"],
        "organic_alternatives": ["FYM", "Vermicompost", "Neem Cake"],
        "advantages": ["High demand", "Processing value", "Long bearing"],
        "risks": ["Citrus canker", "Greening disease", "Long gestation"],
        "profit_estimate": "₹1,50,000 - ₹3,00,000 per hectare"
    },
    "papaya": {
        "season": "Year-round", "harvest_time": "9-12 months",
        "water_requirement": "Medium (1000-1500 mm)", "temperature_range": "22-33°C",
        "humidity_range": "60-80%", "ideal_ph": "6.0-7.0", "market_demand": "High",
        "expected_yield": "40-60 tons/hectare",
        "suitable_states": "AP, Gujarat, Karnataka, MP, Maharashtra",
        "fertilizers": ["NPK", "Boron", "Zinc"],
        "organic_alternatives": ["FYM", "Vermicompost", "Neem Cake"],
        "advantages": ["Quick returns", "High yield", "Medicinal value"],
        "risks": ["Ring spot virus", "Wind damage", "Short plant life"],
        "profit_estimate": "₹2,00,000 - ₹4,00,000 per hectare"
    },
    "kidneybeans": {
        "season": "Kharif (June - October)", "harvest_time": "90-120 days",
        "water_requirement": "Medium (400-600 mm)", "temperature_range": "15-25°C",
        "humidity_range": "50-70%", "ideal_ph": "5.5-6.8", "market_demand": "High",
        "expected_yield": "1-2 tons/hectare",
        "suitable_states": "Himachal, Uttarakhand, J&K, Maharashtra",
        "fertilizers": ["DAP", "Rhizobium", "MOP"],
        "organic_alternatives": ["FYM", "Rhizobium", "Vermicompost"],
        "advantages": ["High protein", "Good price", "Nitrogen fixation"],
        "risks": ["Anthracnose", "Root rot", "Limited area"],
        "profit_estimate": "₹40,000 - ₹80,000 per hectare"
    },
    "mothbeans": {
        "season": "Kharif (July - October)", "harvest_time": "75-90 days",
        "water_requirement": "Very Low (200-400 mm)", "temperature_range": "25-35°C",
        "humidity_range": "30-60%", "ideal_ph": "7.0-8.5", "market_demand": "Medium",
        "expected_yield": "0.5-1 tons/hectare",
        "suitable_states": "Rajasthan, Gujarat, MP",
        "fertilizers": ["DAP", "Rhizobium", "Gypsum"],
        "organic_alternatives": ["FYM", "Rhizobium", "Rock Phosphate"],
        "advantages": ["Drought tolerant", "Low input", "Nitrogen fixing"],
        "risks": ["Low yield", "Limited market", "Yellow mosaic"],
        "profit_estimate": "₹20,000 - ₹40,000 per hectare"
    },
    "mungbean": {
        "season": "Kharif & Summer", "harvest_time": "60-75 days",
        "water_requirement": "Low (300-500 mm)", "temperature_range": "25-35°C",
        "humidity_range": "50-70%", "ideal_ph": "6.0-7.5", "market_demand": "High",
        "expected_yield": "0.8-1.2 tons/hectare",
        "suitable_states": "Rajasthan, MP, Maharashtra, AP, Karnataka",
        "fertilizers": ["DAP", "Rhizobium", "PSB"],
        "organic_alternatives": ["FYM", "Rhizobium", "Vermicompost"],
        "advantages": ["Short duration", "High protein", "Soil improvement"],
        "risks": ["Yellow mosaic virus", "Powdery mildew", "Pod borer"],
        "profit_estimate": "₹25,000 - ₹50,000 per hectare"
    },
    "blackgram": {
        "season": "Kharif (July - October)", "harvest_time": "80-100 days",
        "water_requirement": "Low (400-600 mm)", "temperature_range": "25-35°C",
        "humidity_range": "60-80%", "ideal_ph": "6.0-7.5", "market_demand": "High",
        "expected_yield": "0.8-1.5 tons/hectare",
        "suitable_states": "MP, UP, Rajasthan, AP, Tamil Nadu",
        "fertilizers": ["DAP", "Rhizobium", "Sulphur"],
        "organic_alternatives": ["FYM", "Rhizobium", "Rock Phosphate"],
        "advantages": ["High demand (dal)", "Short duration", "Nitrogen fixing"],
        "risks": ["Yellow mosaic", "Pod borer", "Powdery mildew"],
        "profit_estimate": "₹30,000 - ₹55,000 per hectare"
    },
    "pigeonpeas": {
        "season": "Kharif (June - February)", "harvest_time": "150-270 days",
        "water_requirement": "Low-Medium (600-1000 mm)", "temperature_range": "20-35°C",
        "humidity_range": "50-70%", "ideal_ph": "6.0-7.5", "market_demand": "Very High",
        "expected_yield": "1-2 tons/hectare",
        "suitable_states": "Maharashtra, Karnataka, MP, UP, Gujarat",
        "fertilizers": ["DAP", "Rhizobium", "Sulphur"],
        "organic_alternatives": ["FYM", "Rhizobium", "PSB"],
        "advantages": ["High protein dal", "Nitrogen fixing", "Intercropping"],
        "risks": ["Pod borer", "Wilt", "Long duration"],
        "profit_estimate": "₹35,000 - ₹70,000 per hectare"
    },
}

DEFAULT_CROP_INFO = {
    "season": "Varies by region", "harvest_time": "90-150 days",
    "water_requirement": "Medium", "temperature_range": "20-30°C",
    "humidity_range": "50-70%", "ideal_ph": "6.0-7.5", "market_demand": "Medium-High",
    "expected_yield": "Varies",
    "suitable_states": "Multiple states across India",
    "fertilizers": ["NPK Complex", "Urea", "DAP"],
    "organic_alternatives": ["FYM", "Vermicompost", "Bio-fertilizers"],
    "advantages": ["Good nutritional value", "Market demand", "Suitable climate"],
    "risks": ["Weather dependency", "Pest management required", "Market price fluctuation"],
    "profit_estimate": "₹30,000 - ₹80,000 per hectare"
}


# ============================================================
# PREDICTOR CLASS (Thread-safe, lazy-loaded, cached)
# ============================================================

class MLPredictor:
    """Thread-safe ML prediction service with self-healing startup."""

    def __init__(self):
        self._model: Optional[RandomForestClassifier] = None
        self._stats: Optional[dict] = None
        self._lock = threading.Lock()
        self._loaded = False
        self.features = FEATURES

    def _ensure_loaded(self) -> None:
        """Lazy-load model on first access. Thread-safe."""
        if self._loaded:
            return
        with self._lock:
            if self._loaded:
                return
            self._model, self._stats = load_or_train_model()
            self._loaded = True

    @property
    def model(self):
        self._ensure_loaded()
        return self._model

    @property
    def stats(self):
        self._ensure_loaded()
        return self._stats

    def get_feature_stats(self) -> dict:
        """Return feature statistics for frontend slider ranges."""
        return self.stats

    def predict(self, nitrogen: float, phosphorus: float, potassium: float,
                temperature: float, humidity: float, ph: float, rainfall: float) -> dict:
        """Make crop prediction. Returns predicted crop, confidence, top 5."""
        self._ensure_loaded()

        input_df = pd.DataFrame(
            [[nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall]],
            columns=self.features
        )

        prediction = self._model.predict(input_df)[0]

        top_crops = []
        if hasattr(self._model, "predict_proba"):
            probabilities = self._model.predict_proba(input_df)[0]
            top_indices = probabilities.argsort()[::-1][:5]
            top_crops = [
                {
                    "crop": str(self._model.classes_[idx]).lower(),
                    "confidence": round(float(probabilities[idx]) * 100, 2),
                }
                for idx in top_indices
            ]
        else:
            top_crops = [{"crop": str(prediction).lower(), "confidence": 100.0}]

        predicted_crop = str(prediction).lower()
        confidence = top_crops[0]["confidence"] if top_crops else 100.0
        crop_info = CROP_INFO.get(predicted_crop, DEFAULT_CROP_INFO)

        return {
            "predicted_crop": predicted_crop,
            "confidence": confidence,
            "top_crops": top_crops,
            "crop_info": crop_info,
        }


# ============================================================
# SINGLETON (lazy - no work done at import time)
# ============================================================

predictor = MLPredictor()
