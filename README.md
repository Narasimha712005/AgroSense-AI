# 🌾 AgroSense AI

**Intelligent Crop Recommendation Platform powered by Machine Learning**

AgroSense AI helps farmers and agronomists choose the best crop to grow based on soil nutrients (N, P, K), temperature, humidity, pH, and rainfall — using a Random Forest model trained on 2,200+ agricultural data points with **99.8% accuracy** across **22 crops**.

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🌐 Live Demo

| Service  | URL |
|----------|-----|
| Frontend (Vercel) | https://agro-sense-ai-eta.vercel.app |
| Backend API (Render) | https://agrosense-ai-x1wv.onrender.com |
| API Docs (Swagger) | https://agrosense-ai-x1wv.onrender.com/docs |

> ⏳ The free Render instance sleeps after inactivity — the first request may take ~50 seconds.

---

## ✨ Features

- 🤖 **AI Crop Prediction** — Random Forest model (200 estimators, 22 crop classes)
- 📊 **Rich Result Cards** — season, harvest time, water needs, fertilizers, profit estimates, risks
- 🔐 **Production Authentication** — JWT + refresh tokens, email verification, Google OAuth, password reset
- 📜 **Prediction History** — saved per user in PostgreSQL
- 🌦️ **Weather Dashboard** — current conditions + 5-day forecast
- 📈 **Analytics** — visual insights into predictions
- 💬 **AI Assistant** — farming Q&A chat interface
- 🛠️ **Self-Healing Backend** — auto-retrains the ML model if it's missing, corrupted, or incompatible
- 🎨 **Modern UI** — glassmorphism dark theme, Framer Motion animations

## 🔐 Authentication System

- **JWT authentication** — short-lived access tokens (60 min) + long-lived refresh tokens (30 days) with automatic renewal in the frontend
- **Email verification** — secure token sent on registration ("Verify your AgroSense AI account"); supports SendGrid, Gmail SMTP, or console mode for development
- **Google OAuth login** — "Continue with Google"; auto-creates accounts on first login and links Google to existing accounts by email
- **Password reset** — forgot-password flow with expiring (1 hour), single-use reset tokens
- **Password policy** — bcrypt hashing; minimum 8 characters with uppercase, lowercase and a number (validated in backend + live strength meter in frontend)
- **Hardening** — rate limiting on auth endpoints, anti user-enumeration responses, strict CORS, input validation via Pydantic

## 🗄️ Database

- **PostgreSQL** in production (async via `asyncpg`), SQLite for quick local development
- **Alembic migrations** — versioned schema, run automatically on deploy (`alembic upgrade head`)
- Tables: `users` (with verification/reset/OAuth fields), `predictions`, `feedback`

## 🏗️ Architecture

```
        User
         |
  Vercel React Frontend        (React 19 + Vite + Tailwind)
         |
   FastAPI Backend             (Render, JWT + OAuth + rate limiting)
         |
  PostgreSQL Database          (async SQLAlchemy + Alembic)
         |
  Machine Learning Model       (Random Forest, self-healing)
```

## 🧰 Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Chart.js, Axios |
| Backend    | FastAPI, SQLAlchemy (async), Pydantic v2, python-jose (JWT), passlib (bcrypt), Alembic |
| ML         | scikit-learn (Random Forest), pandas, NumPy, joblib |
| Database   | PostgreSQL (production) / SQLite (dev) |
| Deployment | Vercel (frontend), Render (backend + PostgreSQL), Docker |

## 📁 Project Structure

```
AgroSense-AI/
├── frontend/                 # React + Vite + TypeScript app
│   ├── src/
│   │   ├── pages/            # Landing, Login, Register, ForgotPassword, ResetPassword,
│   │   │                     # VerifyEmail, AuthCallback, Dashboard, Predict, Weather, ...
│   │   ├── components/       # Layout & UI components
│   │   ├── context/          # Auth context (JWT + refresh + Google)
│   │   └── services/         # Axios API client with auto token refresh
│   ├── vercel.json           # Vercel SPA config
│   └── package.json
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── core/             # config, database, security (JWT, rate limiting)
│   │   ├── models/           # SQLAlchemy models + Pydantic schemas
│   │   ├── routers/          # auth, predictions, weather
│   │   └── services/         # self-healing ML service, email service
│   ├── alembic/              # database migrations
│   ├── tests/                # pytest suite (auth + predictions)
│   ├── ml_models/            # crop_model.pkl, feature_stats.pkl, dataset
│   ├── main.py               # app entry point
│   └── requirements.txt
├── render.yaml               # Render blueprint (web service + PostgreSQL)
└── docker-compose.yml        # Local production stack (frontend + backend + postgres)
```

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 20+**

### 1. Clone the repository

```bash
git clone https://github.com/Narasimha712005/AgroSense-AI.git
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
> 💡 In development (`EMAIL_MODE=console`) verification and reset links are printed to the backend logs.

### 3. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173 (API calls are proxied to the backend automatically)

### 4. Docker — full production stack locally

```bash
docker compose up --build
```

Starts three containers: **PostgreSQL 16**, **FastAPI backend** (http://localhost:8000) and the **React frontend** (http://localhost:3000).

### 5. Run the tests

```bash
cd backend
pytest
```

## 📡 API Documentation

Interactive docs available at `/docs` (Swagger) and `/redoc`.

| Method | Endpoint                             | Auth | Description |
|--------|--------------------------------------|------|-------------|
| POST   | `/api/auth/register`                 | ❌   | Register (sends verification email), returns access + refresh tokens |
| GET    | `/api/auth/verify-email/{token}`     | ❌   | Verify email address |
| POST   | `/api/auth/resend-verification`      | ❌   | Resend the verification email |
| POST   | `/api/auth/login`                    | ❌   | Login (rate limited), returns access + refresh tokens |
| POST   | `/api/auth/refresh`                  | ❌   | Exchange refresh token for new token pair |
| POST   | `/api/auth/forgot-password`          | ❌   | Send password reset email |
| POST   | `/api/auth/reset-password/{token}`   | ❌   | Reset password with a valid token |
| GET    | `/api/auth/google/login`             | ❌   | Redirect to Google OAuth consent screen |
| GET    | `/api/auth/google/callback`          | ❌   | Google OAuth callback (creates/links account) |
| GET    | `/api/auth/me`                       | ✅   | Current user profile |
| POST   | `/api/predict`                       | 🔓   | Crop prediction (history saved when authenticated) |
| GET    | `/api/history`                       | ✅   | User's prediction history |
| GET    | `/api/stats`                         | ❌   | Feature statistics (slider ranges) |
| GET    | `/api/model-info`                    | ❌   | Model metadata |
| GET    | `/api/weather`                       | ❌   | Weather data + 5-day forecast |
| GET    | `/health`                            | ❌   | Health check |

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

1. In [Vercel](https://vercel.com): **New Project → Import** your repo.
2. Set **Root Directory** to `frontend`.
3. Add environment variable:
   - `VITE_API_URL` = `https://agrosense-ai-x1wv.onrender.com/api`
4. Deploy. Vercel auto-detects Vite and uses `vercel.json`.

### Backend → Render

**Option A — Blueprint (recommended):** Render dashboard → **New → Blueprint** → select this repo (uses `render.yaml`, which also provisions a **free PostgreSQL database** and runs Alembic migrations on start).

**Option B — Manual:**
1. **New → PostgreSQL** → create a free database, copy its Internal Database URL.
2. **New → Web Service** → connect the repo, root directory `backend`.
3. Build command: `pip install -r requirements.txt`
4. Start command: `alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Environment variables:

| Variable | Value |
|----------|-------|
| `SECRET_KEY` | strong random string |
| `DATABASE_URL` | Render PostgreSQL URL (`postgres://...` is auto-converted to asyncpg) |
| `FRONTEND_URL` | `https://agro-sense-ai-eta.vercel.app` |
| `BACKEND_URL` | `https://agrosense-ai-x1wv.onrender.com` |
| `CORS_ORIGINS` | `https://agro-sense-ai-eta.vercel.app` |
| `REQUIRE_EMAIL_VERIFICATION` | `True` (production) / `False` (testing) |
| `EMAIL_MODE` | `sendgrid`, `smtp` or `console` |
| `SENDGRID_API_KEY` | SendGrid key (if `EMAIL_MODE=sendgrid`) |
| `SMTP_USER` / `SMTP_PASSWORD` | Gmail address + app password (if `EMAIL_MODE=smtp`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | from Google Cloud Console |

### Google OAuth setup

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Create OAuth client ID** (Web application).
2. Authorized redirect URI: `https://agrosense-ai-x1wv.onrender.com/api/auth/google/callback`
3. Copy the client ID/secret into the backend environment variables.

## 🧠 ML Model

- **Algorithm:** Random Forest Classifier (200 estimators)
- **Features:** N, P, K, temperature, humidity, pH, rainfall
- **Classes:** 22 crops (rice, wheat, maize, cotton, coffee, mango, ...)
- **Accuracy:** ~99.8% on the test set
- **Self-healing:** on startup the backend checks the model's compatibility with the installed scikit-learn/NumPy versions and automatically retrains from the bundled dataset if needed — deployment never breaks because of a stale pickle.

## 📸 Screenshots

> _Coming soon — add screenshots to `docs/screenshots/` and reference them here._

| Landing | Prediction | Dashboard |
|---------|-----------|-----------|
| _placeholder_ | _placeholder_ | _placeholder_ |

## 📄 License

This project is licensed under the [MIT License](LICENSE).
