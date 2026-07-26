import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { motion } from 'framer-motion';

type Status = 'verifying' | 'success' | 'error';

export default function VerifyEmail() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('');
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true; // avoid double request in React StrictMode

    authAPI.verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err?.response?.data?.detail || 'Verification failed. The link may have expired.');
      });
  }, [token]);

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
        </div>

        <div className="glass-card p-8 text-center space-y-4">
          {status === 'verifying' && (
            <>
              <div className="w-10 h-10 mx-auto border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              <h1 className="font-display text-xl font-bold text-white">Verifying your email…</h1>
              <p className="text-gray-400 text-sm">This will only take a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-5xl">✅</div>
              <h1 className="font-display text-xl font-bold text-white">Email Verified!</h1>
              <p className="text-gray-400 text-sm">{message}</p>
              <Link to="/login?verified=true" className="btn-primary inline-block mt-2">
                Sign In
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-5xl">❌</div>
              <h1 className="font-display text-xl font-bold text-white">Verification Failed</h1>
              <p className="text-gray-400 text-sm">{message}</p>
              <Link to="/login" className="btn-primary inline-block mt-2">
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
