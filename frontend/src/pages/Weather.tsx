import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { weatherAPI, WeatherData } from '../services/api';
import { FiWind, FiDroplet, FiThermometer, FiCloud } from 'react-icons/fi';

export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await weatherAPI.getWeather();
        setWeather(res.data);
      } catch {
        // Use default data
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Weather Dashboard</h1>
        <p className="text-gray-400">Current weather conditions for agricultural planning</p>
      </motion.div>

      {weather && (
        <>
          {/* Current Weather */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8 bg-gradient-to-br from-blue-900/20 to-cyan-900/10 border-blue-500/10">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">{weather.city}</p>
                <div className="flex items-end gap-2">
                  <span className="font-display text-5xl font-bold text-white">{weather.temperature}°</span>
                  <span className="text-gray-400 mb-2">C</span>
                </div>
                <p className="text-gray-300 mt-2">{weather.description}</p>
              </div>
              <div className="text-6xl">☀️</div>
            </div>
          </motion.div>

          {/* Weather Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: FiThermometer, label: 'Temperature', value: `${weather.temperature}°C`, color: 'text-orange-400' },
              { icon: FiDroplet, label: 'Humidity', value: `${weather.humidity}%`, color: 'text-blue-400' },
              { icon: FiWind, label: 'Wind Speed', value: `${weather.wind_speed} km/h`, color: 'text-cyan-400' },
              { icon: FiCloud, label: 'Pressure', value: `${weather.pressure} hPa`, color: 'text-purple-400' },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="glass-card p-5">
                <stat.icon className={`w-6 h-6 ${stat.color} mb-3`} />
                <p className="text-xs text-gray-400">{stat.label}</p>
                <p className="font-display font-bold text-white text-lg">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Forecast */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
            <h3 className="font-display font-bold text-white mb-4">5-Day Forecast</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {weather.forecast.map((day, i) => (
                <div key={i} className="text-center p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <p className="text-xs text-gray-400 mb-2">{day.day}</p>
                  <p className="text-2xl mb-2">
                    {day.rain_probability > 50 ? '🌧️' : day.rain_probability > 30 ? '⛅' : '☀️'}
                  </p>
                  <p className="text-sm font-medium text-white">{day.temp_high?.toFixed(0)}° / {day.temp_low?.toFixed(0)}°</p>
                  <p className="text-xs text-blue-400 mt-1">💧 {day.rain_probability}%</p>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
