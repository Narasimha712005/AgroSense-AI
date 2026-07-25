"""Weather router - weather data API."""
import random
from fastapi import APIRouter
from app.models.schemas import WeatherResponse

router = APIRouter(prefix="/api", tags=["Weather"])


@router.get("/weather", response_model=WeatherResponse)
async def get_weather(lat: float = 20.5937, lon: float = 78.9629, city: str = "India"):
    """
    Get weather data. Uses simulated data for demo.
    In production, connect to OpenWeatherMap API.
    """
    # Simulated weather data for demo
    temperature = round(random.uniform(20, 38), 1)
    humidity = round(random.uniform(40, 85), 1)
    
    weather_data = WeatherResponse(
        temperature=temperature,
        humidity=humidity,
        wind_speed=round(random.uniform(5, 25), 1),
        pressure=round(random.uniform(1005, 1020), 1),
        description="Partly Cloudy",
        icon="02d",
        city=city,
        forecast=[
            {"day": "Today", "temp_high": temperature + 2, "temp_low": temperature - 5, "description": "Partly Cloudy", "rain_probability": 20},
            {"day": "Tomorrow", "temp_high": temperature + 1, "temp_low": temperature - 6, "description": "Sunny", "rain_probability": 10},
            {"day": "Day 3", "temp_high": temperature + 3, "temp_low": temperature - 4, "description": "Cloudy", "rain_probability": 45},
            {"day": "Day 4", "temp_high": temperature - 1, "temp_low": temperature - 7, "description": "Light Rain", "rain_probability": 70},
            {"day": "Day 5", "temp_high": temperature + 2, "temp_low": temperature - 3, "description": "Sunny", "rain_probability": 5},
        ]
    )
    
    return weather_data
