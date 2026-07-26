import { useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  return null;
}

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordError = useMemo(
    () => (password ? validatePassword(password) : null),
    [password]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validatePassword(password);
    if (error) {
      toast.error(error);
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.resetPassword(token || '', password);
      toast.success(res.data.message);
      navigate('/login');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
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
          <h1 className="font-display text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-gray-400 mt-2">Choose a new password for your account</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
              {passwordError && (
                <p className="text-xs text-amber-400 mt-1.5">{passwordError}</p>
              )}
              <p className="text-xs text-gray-500 mt-1.5">
                Min 8 characters with uppercase, lowercase and a number
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
              {confirm && confirm !== password && (
                <p className="text-xs text-red-400 mt-1.5">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !!passwordError || password !== confirm}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Back to Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
