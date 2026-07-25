import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiCloud, FiActivity, FiTrendingUp, FiClock } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();

  const quickStats = [
    { icon: FiActivity, label: 'Predictions Made', value: '12', color: 'text-primary-400' },
    { icon: FiCloud, label: 'Weather Status', value: 'Sunny', color: 'text-yellow-400' },
    { icon: FiTrendingUp, label: 'Model Accuracy', value: '98.6%', color: 'text-emerald-400' },
    { icon: FiClock, label: 'Last Analysis', value: 'Today', color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 bg-gradient-to-br from-primary-900/20 to-emerald-900/10 border-primary-500/10"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-white mb-2">
              Welcome back, {user?.full_name || user?.username || 'Farmer'}! 👋
            </h1>
            <p className="text-gray-400">Your AI agriculture assistant is ready to help you make better farming decisions.</p>
          </div>
          <Link to="/predict" className="btn-primary">
            New Prediction
          </Link>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{stat.label}</p>
                <p className="font-display font-bold text-white text-lg">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="font-display font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { crop: 'Rice', confidence: '94.2%', time: '2 hours ago' },
              { crop: 'Wheat', confidence: '89.7%', time: '5 hours ago' },
              { crop: 'Maize', confidence: '91.3%', time: 'Yesterday' },
            ].map((item) => (
              <div key={item.crop} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-sm">🌾</div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.crop}</p>
                    <p className="text-xs text-gray-500">{item.time}</p>
                  </div>
                </div>
                <span className="text-primary-400 text-sm font-semibold">{item.confidence}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="font-display font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Crop Prediction', icon: '🌾', path: '/predict' },
              { label: 'Weather Check', icon: '🌦️', path: '/weather' },
              { label: 'View Analytics', icon: '📊', path: '/analytics' },
              { label: 'AI Assistant', icon: '🤖', path: '/assistant' },
            ].map((action) => (
              <Link
                key={action.label}
                to={action.path}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-200 text-center"
              >
                <div className="text-2xl mb-2">{action.icon}</div>
                <p className="text-xs text-gray-300 font-medium">{action.label}</p>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
