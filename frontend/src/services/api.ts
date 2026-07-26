import axios from 'axios';

// Production Backend URL (Render)
// Development fallback: Vite proxy to localhost backend
const API_BASE =
  import.meta.env.VITE_API_URL ||
  'https://agrosense-ai-backend.onrender.com/api';
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrosense_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


// Auto-refresh expired access tokens (single retry per request)
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('agrosense_refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await axios.post(`${API_BASE}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    localStorage.setItem('agrosense_token', res.data.access_token);
    if (res.data.refresh_token) {
      localStorage.setItem('agrosense_refresh_token', res.data.refresh_token);
    }
    return res.data.access_token;
  } catch {
    localStorage.removeItem('agrosense_token');
    localStorage.removeItem('agrosense_refresh_token');
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      refreshing = refreshing || refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;

      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }

    return Promise.reject(error);
  }
);


// =====================
// Prediction Interfaces
// =====================

export interface PredictionRequest {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
}


export interface CropResult {
  crop: string;
  confidence: number;
}


export interface CropInfo {
  season: string;
  harvest_time: string;
  water_requirement: string;
  temperature_range: string;
  humidity_range: string;
  ideal_ph: string;
  market_demand: string;
  expected_yield: string;
  suitable_states: string;
  fertilizers: string[];
  organic_alternatives: string[];
  advantages: string[];
  risks: string[];
  profit_estimate: string;
}


export interface PredictionResponse {
  predicted_crop: string;
  confidence: number;
  top_crops: CropResult[];
  crop_info: CropInfo;
  input_data: PredictionRequest;
  id?: number;
  created_at?: string;
}


// =====================
// Weather Interface
// =====================

export interface WeatherData {
  temperature: number;
  humidity: number;
  wind_speed: number;
  pressure: number;
  description: string;
  icon: string;
  city: string;

  forecast: Array<{
    day: string;
    temp_high: number;
    temp_low: number;
    description: string;
    rain_probability: number;
  }>;
}


// =====================
// User Interface
// =====================

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  is_verified: boolean;
  auth_provider: string;
  created_at: string;
}


export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: User;
}


export interface MessageResponse {
  message: string;
}


// =====================
// Authentication APIs
// =====================

export const authAPI = {

  login: (
    email: string,
    password: string
  ) =>
    api.post<AuthResponse>(
      '/auth/login',
      {
        email,
        password,
      }
    ),


  register: (
    email: string,
    username: string,
    password: string,
    full_name: string
  ) =>
    api.post<AuthResponse>(
      '/auth/register',
      {
        email,
        username,
        password,
        full_name,
      }
    ),


  getProfile: (
    token: string
  ) =>
    api.get<User>(
      '/auth/me',
      {
        params: {
          token,
        },
      }
    ),


  refresh: (refresh_token: string) =>
    api.post<AuthResponse>('/auth/refresh', { refresh_token }),


  verifyEmail: (token: string) =>
    api.get<MessageResponse>(`/auth/verify-email/${token}`),


  verifyOTP: (email: string, otp: string) =>
    api.post<MessageResponse>('/auth/verify-otp', { email, otp }),


  resendVerification: (email: string) =>
    api.post<MessageResponse>('/auth/resend-verification', { email }),


  forgotPassword: (email: string) =>
    api.post<MessageResponse>('/auth/forgot-password', { email }),


  resetPassword: (token: string, password: string) =>
    api.post<MessageResponse>(`/auth/reset-password/${token}`, { password }),


  // Full-page redirect to backend Google OAuth flow
  googleLoginUrl: () => `${API_BASE}/auth/google/login`,
};


// =====================
// Prediction APIs
// =====================

export const predictionAPI = {

  predict: (
    data: PredictionRequest
  ) =>
    api.post<PredictionResponse>(
      '/predict',
      data
    ),


  getHistory: () =>
    api.get('/history'),


  getStats: () =>
    api.get('/stats'),


  getModelInfo: () =>
    api.get('/model-info'),

};


// =====================
// Weather APIs
// =====================

export const weatherAPI = {

  getWeather: (
    lat?: number,
    lon?: number,
    city?: string
  ) =>
    api.get<WeatherData>(
      '/weather',
      {
        params: {
          lat,
          lon,
          city,
        },
      }
    ),

};


export default api;