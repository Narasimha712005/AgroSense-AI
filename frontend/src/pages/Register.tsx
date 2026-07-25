import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/api/auth/register',
        {
          email: email,
          username: username,
          password: password,
          full_name: fullName
        }
      );

      // Save token after successful registration
      localStorage.setItem(
        'token',
        response.data.access_token
      );

      toast.success('Account created successfully!');

      navigate('/dashboard');

    } catch (err) {
      console.log(err);

      toast.error(
        err?.response?.data?.detail ||
        'Registration failed'
      );

    } finally {
      setLoading(false);
    }
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

            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-xl flex items-center justify-center text-xl">
              🌱
            </div>

            <span className="font-display font-bold text-xl text-white">
              AgroSense AI
            </span>

          </Link>


          <h1 className="font-display text-2xl font-bold text-white">
            Create Account
          </h1>

          <p className="text-gray-400 mt-2">
            Start your smart farming journey
          </p>

        </div>


        <div className="glass-card p-8">

          <form onSubmit={handleSubmit} className="space-y-4">


            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Full Name
              </label>

              <input
                type="text"
                value={fullName}
                onChange={(e)=>setFullName(e.target.value)}
                className="input-field"
                placeholder="John Doe"
              />
            </div>



            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e)=>setUsername(e.target.value)}
                className="input-field"
                placeholder="farmer_john"
                required
              />
            </div>



            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>



            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>



            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
            >

              {
                loading
                ?
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                :
                'Create Account'
              }

            </button>


          </form>



          <p className="text-center text-gray-400 text-sm mt-6">

            Already have an account?{' '}

            <Link
              to="/login"
              className="text-primary-400 hover:text-primary-300 font-medium"
            >
              Sign in
            </Link>

          </p>


        </div>

      </motion.div>

    </div>
  );
}