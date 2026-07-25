import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { predictionAPI, PredictionResponse } from '../services/api';
import toast from 'react-hot-toast';

export default function Predict() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [inputs, setInputs] = useState({
    nitrogen: 50, phosphorus: 50, potassium: 50,
    temperature: 25, humidity: 70, ph: 6.5, rainfall: 200
  });

  const handleChange = (key: string, value: number) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const handlePredict = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await predictionAPI.predict(inputs);
      setResult(res.data);
      toast.success('Prediction complete!');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const soilParams = [
    { key: 'nitrogen', label: 'Nitrogen (N)', unit: 'kg/ha', min: 0, max: 140, icon: '🧪' },
    { key: 'phosphorus', label: 'Phosphorus (P)', unit: 'kg/ha', min: 5, max: 145, icon: '🧪' },
    { key: 'potassium', label: 'Potassium (K)', unit: 'kg/ha', min: 5, max: 205, icon: '🧪' },
    { key: 'ph', label: 'Soil pH', unit: 'pH', min: 3.5, max: 10, icon: '⚗️', step: 0.1 },
  ];

  const climateParams = [
    { key: 'temperature', label: 'Temperature', unit: '°C', min: 8, max: 44, icon: '🌡️' },
    { key: 'humidity', label: 'Humidity', unit: '%', min: 14, max: 100, icon: '💧' },
    { key: 'rainfall', label: 'Rainfall', unit: 'mm', min: 20, max: 300, icon: '🌧️' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Crop Recommendation</h1>
        <p className="text-gray-400">Enter your soil and climate parameters for AI-powered crop prediction</p>
      </motion.div>

      {/* Input Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Soil Parameters */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">🧪</div>
            <div>
              <h3 className="font-display font-bold text-white">Soil Parameters</h3>
              <p className="text-xs text-gray-400">Nutrient composition and acidity</p>
            </div>
          </div>
          <div className="space-y-5">
            {soilParams.map(p => (
              <div key={p.key}>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-gray-300 font-medium">{p.icon} {p.label}</label>
                  <span className="text-sm text-primary-400 font-semibold">{inputs[p.key as keyof typeof inputs]} {p.unit}</span>
                </div>
                <input
                  type="range"
                  min={p.min} max={p.max} step={p.step || 1}
                  value={inputs[p.key as keyof typeof inputs]}
                  onChange={e => handleChange(p.key, parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/[0.06] rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Climate Parameters */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">🌦️</div>
            <div>
              <h3 className="font-display font-bold text-white">Climate Conditions</h3>
              <p className="text-xs text-gray-400">Temperature, humidity and rainfall</p>
            </div>
          </div>
          <div className="space-y-5">
            {climateParams.map(p => (
              <div key={p.key}>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-gray-300 font-medium">{p.icon} {p.label}</label>
                  <span className="text-sm text-blue-400 font-semibold">{inputs[p.key as keyof typeof inputs]} {p.unit}</span>
                </div>
                <input
                  type="range"
                  min={p.min} max={p.max} step={p.step || 1}
                  value={inputs[p.key as keyof typeof inputs]}
                  onChange={e => handleChange(p.key, parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/[0.06] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Predict Button */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <button onClick={handlePredict} disabled={loading} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3">
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>🚀 Get Crop Recommendation</>
          )}
        </button>
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Main Result Card */}
            <div className="glass-card p-8 bg-gradient-to-br from-primary-900/30 to-emerald-900/20 border-primary-500/20 text-center">
              <p className="text-primary-300 text-xs font-bold tracking-widest mb-2">AI RECOMMENDATION</p>
              <h2 className="font-display text-4xl font-bold text-white mb-2">🌾 {result.predicted_crop.charAt(0).toUpperCase() + result.predicted_crop.slice(1)}</h2>
              <p className="text-gray-300">Recommended based on your soil and climate conditions</p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20">
                <span className="text-primary-300 font-bold">{result.confidence.toFixed(1)}% Confidence</span>
              </div>
            </div>

            {/* Crop Info Grid */}
            {result.crop_info && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Growing Season', value: result.crop_info.season, icon: '📅' },
                  { label: 'Harvest Time', value: result.crop_info.harvest_time, icon: '⏱️' },
                  { label: 'Water Requirement', value: result.crop_info.water_requirement, icon: '💧' },
                  { label: 'Temperature Range', value: result.crop_info.temperature_range, icon: '🌡️' },
                  { label: 'Market Demand', value: result.crop_info.market_demand, icon: '📈' },
                  { label: 'Expected Yield', value: result.crop_info.expected_yield, icon: '🌾' },
                  { label: 'Suitable States', value: result.crop_info.suitable_states, icon: '📍' },
                  { label: 'Ideal pH', value: result.crop_info.ideal_ph, icon: '⚗️' },
                  { label: 'Profit Estimate', value: result.crop_info.profit_estimate, icon: '💰' },
                ].map(item => (
                  <div key={item.label} className="glass-card p-4">
                    <p className="text-xs text-gray-400 mb-1">{item.icon} {item.label}</p>
                    <p className="text-sm text-white font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Top 5 Crops */}
            {result.top_crops && result.top_crops.length > 1 && (
              <div className="glass-card p-6">
                <h3 className="font-display font-bold text-white mb-4">🏆 Top Recommendations</h3>
                <div className="space-y-3">
                  {result.top_crops.map((crop, i) => (
                    <div key={crop.crop} className="flex items-center gap-4">
                      <span className="text-sm font-bold text-gray-400 w-6">{i + 1}.</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-white capitalize">{crop.crop}</span>
                          <span className="text-sm text-primary-400 font-semibold">{crop.confidence.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(crop.confidence, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fertilizers & Risks */}
            {result.crop_info && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                  <h3 className="font-display font-bold text-white mb-3">🌿 Recommended Fertilizers</h3>
                  <div className="space-y-2">
                    {result.crop_info.fertilizers?.map(f => (
                      <div key={f} className="px-3 py-2 rounded-lg bg-primary-500/10 text-sm text-primary-200">{f}</div>
                    ))}
                  </div>
                  <h4 className="font-bold text-white mt-4 mb-2 text-sm">Organic Alternatives</h4>
                  <div className="space-y-2">
                    {result.crop_info.organic_alternatives?.map(f => (
                      <div key={f} className="px-3 py-2 rounded-lg bg-emerald-500/10 text-sm text-emerald-200">{f}</div>
                    ))}
                  </div>
                </div>
                <div className="glass-card p-6">
                  <h3 className="font-display font-bold text-white mb-3">✅ Advantages</h3>
                  <div className="space-y-2 mb-4">
                    {result.crop_info.advantages?.map(a => (
                      <div key={a} className="px-3 py-2 rounded-lg bg-green-500/10 text-sm text-green-200">✓ {a}</div>
                    ))}
                  </div>
                  <h3 className="font-display font-bold text-white mb-3">⚠️ Possible Risks</h3>
                  <div className="space-y-2">
                    {result.crop_info.risks?.map(r => (
                      <div key={r} className="px-3 py-2 rounded-lg bg-red-500/10 text-sm text-red-200">⚠ {r}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
