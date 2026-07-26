import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const OTP_LENGTH = 6;

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Email comes from Register redirect state, or ?email= param as fallback
  const email: string =
    (location.state as { email?: string } | null)?.email ||
    searchParams.get('email') ||
    '';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!email) return;
    inputsRef.current[0]?.focus();
  }, [email]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const otp = digits.join('');

  const handleChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      setDigits((d) => d.map((v, i) => (i === index ? '' : v)));
      return;
    }
    // Support pasting the whole OTP into any box
    const next = [...digits];
    let i = index;
    for (const ch of cleaned.slice(0, OTP_LENGTH - index)) {
      next[i] = ch;
      i++;
    }
    setDigits(next);
    inputsRef.current[Math.min(i, OTP_LENGTH - 1)]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== OTP_LENGTH) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.verifyOTP(email, otp);
      toast.success(res.data.message);
      navigate('/login?verified=true');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 429) {
        toast.error('Too many attempts. Please wait a minute and try again.');
      } else {
        toast.error(typeof detail === 'string' ? detail : 'Invalid OTP. Please try again.');
      }
      setDigits(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      const res = await authAPI.resendVerification(email);
      toast.success(res.data.message);
      setResendCooldown(60);
    } catch (err: any) {
      if (err?.response?.status === 429) {
        toast.error('Too many requests. Please wait a few minutes.');
      } else {
        toast.error('Could not resend OTP');
      }
    }
  };

  // No email in navigation state: send the user back to register
  if (!email) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-6">
        <div className="glass-card p-8 text-center max-w-md w-full">
          <p className="text-gray-300 mb-4">We couldn't find your email address.</p>
          <Link to="/register" className="btn-primary inline-block">
            Back to Register
          </Link>
        </div>
      </div>
    );
  }

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
          <h1 className="font-display text-2xl font-bold text-white">Verify your email</h1>
          <p className="text-gray-400 mt-2">
            OTP sent to <span className="text-primary-400 font-medium">{email}</span>
          </p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-center gap-2 sm:gap-3">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  maxLength={OTP_LENGTH}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold text-white
                             bg-white/5 border border-white/10 rounded-xl
                             focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30
                             focus:outline-none transition-colors"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== OTP_LENGTH}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Verify OTP'
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-primary-400 hover:text-primary-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
            </button>
          </p>

          <p className="text-center text-gray-500 text-xs mt-2">
            The OTP expires in 10 minutes.
          </p>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already verified?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
