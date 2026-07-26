import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email);
      toast.success(res.data.message);
      setSent(true);
    } catch (err: any) {
      if (err?.response?.status === 429) {
        toast.error('Too many requests. Please wait a few minutes.');
      } else {
        toast.error(err?.response?.data?.detail || 'Something went wrong. Try again.');
      }
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
          <h1 className="font-display text-2xl font-bold text-white">Forgot Password</h1>
          <p className="text-gray-400 mt-2">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="glass-card p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-5xl">📬</div>
              <h2 className="text-white font-semibold text-lg">Check your inbox</h2>
              <p className="text-gray-400 text-sm">
                If an account exists for <span className="text-white">{email}</span>, a password
                reset link is on its way. The link expires in 1 hour.
              </p>
              <Link to="/login" className="btn-primary inline-block mt-2">
                Back to Sign In
              </Link>
            </div>
          ) : (
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
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}

          {!sent && (
            <p className="text-center text-gray-400 text-sm mt-6">
              Remembered your password?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
