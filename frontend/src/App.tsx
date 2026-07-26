import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import Predict from './pages/Predict'
import Weather from './pages/Weather'
import Analytics from './pages/Analytics'
import Assistant from './pages/Assistant'
import AppLayout from './components/layout/AppLayout'

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify/:token" element={<VerifyEmail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/predict" element={<Predict />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/assistant" element={<Assistant />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
