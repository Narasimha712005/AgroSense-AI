import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Password strength scoring: length, upper, lower, number, symbol
function scorePassword(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
const STRENGTH_COLORS = [
  'bg-red-500',
  'bg-red-500',
  'bg-amber-500',
  'bg-yellow-400',
  'bg-emerald-500',
  'bg-emerald-400',
];

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  return null;
}

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const strength = useMemo(() => scorePassword(password), [password]);
  const passwordError = useMemo(
    () => (password ? validatePassword(password) : null),
    [password]
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const error = validatePassword(password);
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);
    try {
      await register(email, username, password, fullName);
      toast.success('Account created! Check your email to verify your account.', {
        duration: 6000,
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as any;
      const detail = error?.response?.data?.detail;
      if (error?.response?.status === 429) {
        toast.error('Too many attempts. Please wait a minute and try again.');
      } else {
        toast.error(detail || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = authAPI.googleLoginUrl();
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
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
          <h1 className="font-display text-2xl font-bold text-white">Create Account</h1>
          <p className="text-gray-400 mt-2">Start your smart farming journey</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="farmer_john"
                required
              />
            </div>

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
              <label className="text-sm font-medium text-gray-300 mb-2 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />

              {password && (
                <div className="mt-2">
                  {/* Strength meter */}
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i < strength ? STRENGTH_COLORS[strength] : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-gray-400">{STRENGTH_LABELS[strength]}</span>
                    {passwordError && (
                      <span className="text-xs text-amber-400">{passwordError}</span>
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-1.5">
                Min 8 characters with uppercase, lowercase and a number
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !!passwordError}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-6 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Create Account'
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
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
