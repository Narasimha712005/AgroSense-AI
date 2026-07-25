import { motion } from 'framer-motion';

export default function Analytics() {
  const soilData = [
    { label: 'Nitrogen', value: 78, max: 140, color: 'bg-green-500' },
    { label: 'Phosphorus', value: 52, max: 145, color: 'bg-blue-500' },
    { label: 'Potassium', value: 63, max: 205, color: 'bg-purple-500' },
    { label: 'pH Level', value: 6.5, max: 10, color: 'bg-orange-500' },
  ];

  const cropPopularity = [
    { crop: 'Rice', count: 245, percentage: 85 },
    { crop: 'Wheat', count: 198, percentage: 72 },
    { crop: 'Maize', count: 156, percentage: 58 },
    { crop: 'Cotton', count: 134, percentage: 50 },
    { crop: 'Coffee', count: 98, percentage: 38 },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Analytics Dashboard</h1>
        <p className="text-gray-400">Visualize your agricultural data and prediction trends</p>
      </motion.div>

      {/* Soil Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <h3 className="font-display font-bold text-white mb-4">🧪 Soil Health Overview</h3>
          <div className="space-y-4">
            {soilData.map(item => (
              <div key={item.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-300">{item.label}</span>
                  <span className="text-sm text-gray-400">{item.value} / {item.max}</span>
                </div>
                <div className="w-full h-3 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${(item.value / item.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Crop Popularity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h3 className="font-display font-bold text-white mb-4">🌾 Top Predicted Crops</h3>
          <div className="space-y-3">
            {cropPopularity.map((item, i) => (
              <div key={item.crop} className="flex items-center gap-4">
                <span className="text-sm font-bold text-gray-500 w-5">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-white">{item.crop}</span>
                    <span className="text-xs text-gray-400">{item.count} predictions</span>
                  </div>
                  <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Prediction Trends */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
        <h3 className="font-display font-bold text-white mb-4">📈 Prediction Confidence Trends</h3>
        <div className="grid grid-cols-7 gap-2 h-40 items-end">
          {[85, 92, 78, 95, 88, 91, 96].map((value, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-full bg-gradient-to-t from-primary-600 to-emerald-500 rounded-t-lg transition-all duration-500 hover:opacity-80" style={{ height: `${value}%` }} />
              <span className="text-xs text-gray-500">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Predictions', value: '1,247', icon: '🎯' },
          { label: 'Avg Confidence', value: '92.3%', icon: '📊' },
          { label: 'Unique Crops', value: '18', icon: '🌱' },
          { label: 'Active Users', value: '342', icon: '👥' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="font-display font-bold text-white text-lg">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
