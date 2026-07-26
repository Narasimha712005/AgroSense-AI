import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Landing page for the Google OAuth redirect:
// /auth/callback?access_token=...&refresh_token=...
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { loginWithTokens } = useAuth();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token') || undefined;

    if (!accessToken) {
      setFailed(true);
      return;
    }

    loginWithTokens(accessToken, refreshToken)
      .then(() => {
        toast.success('Signed in with Google!');
        navigate('/dashboard', { replace: true });
      })
      .catch(() => setFailed(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card p-8 text-center space-y-4">
          {failed ? (
            <>
              <div className="text-5xl">❌</div>
              <h1 className="font-display text-xl font-bold text-white">Sign-in Failed</h1>
              <p className="text-gray-400 text-sm">We couldn't complete the Google sign-in.</p>
              <Link to="/login" className="btn-primary inline-block mt-2">
                Back to Sign In
              </Link>
            </>
          ) : (
            <>
              <div className="w-10 h-10 mx-auto border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              <h1 className="font-display text-xl font-bold text-white">Signing you in…</h1>
              <p className="text-gray-400 text-sm">Completing Google authentication.</p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
