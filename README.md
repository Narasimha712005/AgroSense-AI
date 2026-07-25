# 🌾 AgroSense AI

**Intelligent Crop Recommendation Platform powered by Machine Learning**

AgroSense AI helps farmers and agronomists choose the best crop to grow based on soil nutrients (N, P, K), temperature, humidity, pH, and rainfall — using a Random Forest model trained on 2,200+ agricultural data points with **99.8% accuracy** across **22 crops**.

---

## 🌐 Live Demo

🚀 **AgroSense AI Application:**  
https://agro-sense-ai-eta.vercel.app/

---

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- 🤖 **AI Crop Prediction** — Random Forest model (200 estimators, 22 crop classes)
- 📊 **Rich Result Cards** — season, harvest time, water needs, fertilizers, profit estimates, risks
- 🔐 **JWT Authentication** — register, login, secure sessions
- 📜 **Prediction History** — saved per user in the database
- 🌦️ **Weather Dashboard** — current conditions + 5-day forecast
- 📈 **Analytics** — visual insights into predictions
- 💬 **AI Assistant** — farming Q&A chat interface
- 🛠️ **Self-Healing Backend** — auto-retrains the ML model if it's missing, corrupted, or incompatible
- 🎨 **Modern UI** — glassmorphism dark theme, Framer Motion animations

## 🏗️ Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Chart.js, Axios |
| Backend    | FastAPI, SQLAlchemy (async), Pydantic v2, python-jose (JWT), passlib (bcrypt) |
| ML         | scikit-learn (Random Forest), pandas, NumPy, joblib |
| Database   | SQLite (dev) / PostgreSQL (production-ready) |
| Deployment | Vercel (frontend), Render / Railway (backend), Docker, GitHub Actions |

## 📁 Project Structure

```
AgroSense-AI/
├── frontend/                 # React + Vite + TypeScript app
│   ├── src/
│   │   ├── pages/            # Landing, Login, Dashboard, Predict, Weather, ...
│   │   ├── components/       # Layout & UI components
│   │   ├── context/          # Auth context
│   │   └── services/         # Axios API client
│   ├── vercel.json           # Vercel SPA config
│   └── package.json
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── core/             # config, database, security
│   │   ├── models/           # SQLAlchemy models + Pydantic schemas
│   │   ├── routers/          # auth, predictions, weather
│   │   └── services/         # self-healing ML service
│   ├── ml_models/            # crop_model.pkl, feature_stats.pkl, dataset
│   ├── main.py               # app entry point
│   ├── Procfile              # Render/Railway start command
│   └── requirements.txt
├── render.yaml               # Render blueprint
└── docker-compose.yml        # Local Docker orchestration
```

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 20+**

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/AgroSense-AI.git
cd AgroSense-AI
```

### 2. Run the Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
copy .env.example .env         # then edit .env values

python -m uvicorn main:app --reload --port 8000
```

- API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

> 💡 On first start, if no model exists, the backend **automatically trains** the Random Forest model from `ml_models/crop_recommendation.csv`.

### 3. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173 (API calls are proxied to the backend automatically)

### 4. Docker (alternative)

```bash
docker compose up --build
```

## 📡 API Documentation

Interactive docs available at `/docs` (Swagger) and `/redoc`.

| Method | Endpoint             | Auth | Description |
|--------|----------------------|------|-------------|
| POST   | `/api/auth/register` | ❌   | Register a new user, returns JWT |
| POST   | `/api/auth/login`    | ❌   | Login, returns JWT |
| GET    | `/api/auth/me`       | ✅   | Current user profile |
| POST   | `/api/predict`       | 🔓   | Crop prediction (history saved when authenticated) |
| GET    | `/api/history`       | ✅   | User's prediction history |
| GET    | `/api/stats`         | ❌   | Feature statistics (slider ranges) |
| GET    | `/api/model-info`    | ❌   | Model metadata |
| GET    | `/api/weather`       | ❌   | Weather data + 5-day forecast |
| GET    | `/health`            | ❌   | Health check |

**Example prediction request:**

```json
POST /api/predict
{
  "nitrogen": 90, "phosphorus": 42, "potassium": 43,
  "temperature": 20.87, "humidity": 82.0,
  "ph": 6.5, "rainfall": 202.93
}
```

## ☁️ Deployment

### Frontend → Vercel

1. Push the repo to GitHub.
2. In [Vercel](https://vercel.com): **New Project → Import** your repo.
3. Set **Root Directory** to `frontend`.
4. Add environment variable:
   - `VITE_API_URL` = `https://<your-backend>.onrender.com/api`
5. Deploy. Vercel auto-detects Vite and uses `vercel.json`.

### Backend → Render

**Option A — Blueprint (recommended):** Render dashboard → **New → Blueprint** → select this repo (uses `render.yaml`).

**Option B — Manual:**
1. **New → Web Service** → connect the repo.
2. Root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Environment variables:

| Variable | Value |
|----------|-------|
| `SECRET_KEY` | strong random string |
| `DATABASE_URL` | `sqlite+aiosqlite:///./agrosense.db` (or PostgreSQL URL) |
| `FRONTEND_URL` | `https://<your-frontend>.vercel.app` |
| `CORS_ORIGINS` | `https://<your-frontend>.vercel.app` |

### Backend → Railway (alternative)

1. [Railway](https://railway.app) → **New Project → Deploy from GitHub repo**.
2. Set root directory to `backend` (uses the `Procfile` automatically).
3. Add the same environment variables as above.

### ⚠️ Database Note

SQLite works on Render/Railway but the file is **ephemeral** — it resets on redeploy. For persistent production data, migrate to PostgreSQL:

1. Create a PostgreSQL instance (Render/Railway/Neon/Supabase — free tiers available).
2. Add `asyncpg` to `requirements.txt`.
3. Set `DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname`.

No code changes are required — SQLAlchemy handles both.

## 🧠 ML Model

- **Algorithm:** Random Forest Classifier (200 estimators)
- **Features:** N, P, K, temperature, humidity, pH, rainfall
- **Classes:** 22 crops (rice, wheat, maize, cotton, coffee, mango, ...)
- **Accuracy:** ~99.8% on the test set
- **Self-healing:** on startup the backend checks the model's compatibility with the installed scikit-learn/NumPy versions and automatically retrains from the bundled dataset if needed — deployment never breaks because of a stale pickle.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
