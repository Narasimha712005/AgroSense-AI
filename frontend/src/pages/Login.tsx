import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('error') === 'google_auth_failed') {
      toast.error('Google sign-in failed. Please try again.');
    }
    if (searchParams.get('verified') === 'true') {
      toast.success('Email verified! You can now sign in.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowResend(false);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 429) {
        toast.error('Too many attempts. Please wait a minute and try again.');
      } else if (typeof detail === 'string' && detail.toLowerCase().includes('verify')) {
        toast.error(detail);
        setShowResend(true);
      } else {
        toast.error(detail || 'Login failed. Check your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Enter your email first');
      return;
    }
    try {
      const res = await authAPI.resendVerification(email);
      toast.success(res.data.message);
      setShowResend(false);
    } catch {
      toast.error('Could not resend verification email');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = authAPI.googleLoginUrl();
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-xl flex items-center justify-center text-xl">🌱</div>
            <span className="font-display font-bold text-xl text-white">AgroSense AI</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-gray-400 mt-2">Sign in to your account</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300 block">Password</label>
                <Link to="/forgot-password" className="text-sm text-primary-400 hover:text-primary-300">
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            {showResend && (
              <button
                type="button"
                onClick={handleResendVerification}
                className="w-full text-sm text-amber-400 hover:text-amber-300 underline"
              >
                Resend verification email
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-500 text-xs uppercase">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-gray-800 font-medium hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.97 10.97 0 001 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-gray-400 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
