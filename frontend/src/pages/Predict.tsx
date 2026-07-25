import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { predictionAPI, PredictionResponse } from '../services/api';
import toast from 'react-hot-toast';

export default function Predict() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const [inputs, setInputs] = useState({
    nitrogen: 50,
    phosphorus: 50,
    potassium: 50,
    temperature: 25,
    humidity: 70,
    ph: 6.5,
    rainfall: 200
  });

  const handleChange = (key: string, value: number) => {
    setInputs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePredict = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await predictionAPI.predict(inputs);
      setResult(res.data);
      toast.success('Prediction complete!');
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || 'Prediction failed'
      );
    } finally {
      setLoading(false);
    }
  };


  const soilParams = [
    {
      key: 'nitrogen',
      label: 'Nitrogen (N)',
      unit: 'kg/ha',
      min: 0,
      max: 140,
      step: 1,
      icon: '🧪'
    },
    {
      key: 'phosphorus',
      label: 'Phosphorus (P)',
      unit: 'kg/ha',
      min: 5,
      max: 145,
      step: 1,
      icon: '🧪'
    },
    {
      key: 'potassium',
      label: 'Potassium (K)',
      unit: 'kg/ha',
      min: 5,
      max: 205,
      step: 1,
      icon: '🧪'
    },
    {
      key: 'ph',
      label: 'Soil pH',
      unit: 'pH',
      min: 3.5,
      max: 10,
      step: 0.1,
      icon: '⚗️'
    }
  ];


  const climateParams = [
    {
      key: 'temperature',
      label: 'Temperature',
      unit: '°C',
      min: 8,
      max: 44,
      step: 1,
      icon: '🌡️'
    },
    {
      key: 'humidity',
      label: 'Humidity',
      unit: '%',
      min: 14,
      max: 100,
      step: 1,
      icon: '💧'
    },
    {
      key: 'rainfall',
      label: 'Rainfall',
      unit: 'mm',
      min: 20,
      max: 300,
      step: 1,
      icon: '🌧️'
    }
  ];


  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-2xl font-bold text-white mb-1">
          Crop Recommendation
        </h1>

        <p className="text-gray-400">
          Enter your soil and climate parameters for AI-powered crop prediction
        </p>
      </motion.div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


        {/* Soil Parameters */}

        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >

          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
              🧪
            </div>

            <div>
              <h3 className="font-display font-bold text-white">
                Soil Parameters
              </h3>

              <p className="text-xs text-gray-400">
                Nutrient composition and acidity
              </p>
            </div>
          </div>


          <div className="space-y-5">

            {soilParams.map((p) => (

              <div key={p.key}>

                <div className="flex justify-between mb-2">

                  <label className="text-sm text-gray-300 font-medium">
                    {p.icon} {p.label}
                  </label>


                  <span className="text-sm text-primary-400 font-semibold">
                    {inputs[p.key as keyof typeof inputs]} {p.unit}
                  </span>

                </div>


                <input
                  type="range"
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  value={inputs[p.key as keyof typeof inputs]}
                  onChange={(e) =>
                    handleChange(
                      p.key,
                      Number(e.target.value)
                    )
                  }
                  className="w-full h-2 bg-white/[0.06] rounded-lg appearance-none cursor-pointer accent-primary-500"
                />

              </div>

            ))}

          </div>

        </motion.div>
                {/* Climate Parameters */}

        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >

          <div className="flex items-center gap-3 mb-5">

            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              🌦️
            </div>

            <div>

              <h3 className="font-display font-bold text-white">
                Climate Conditions
              </h3>

              <p className="text-xs text-gray-400">
                Temperature, humidity and rainfall
              </p>

            </div>

          </div>


          <div className="space-y-5">

            {climateParams.map((p) => (

              <div key={p.key}>

                <div className="flex justify-between mb-2">

                  <label className="text-sm text-gray-300 font-medium">
                    {p.icon} {p.label}
                  </label>


                  <span className="text-sm text-blue-400 font-semibold">
                    {inputs[p.key as keyof typeof inputs]} {p.unit}
                  </span>

                </div>


                <input
                  type="range"
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  value={inputs[p.key as keyof typeof inputs]}
                  onChange={(e) =>
                    handleChange(
                      p.key,
                      Number(e.target.value)
                    )
                  }
                  className="w-full h-2 bg-white/[0.06] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />

              </div>

            ))}

          </div>


        </motion.div>


      </div>



      <motion.button

        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}

        onClick={handlePredict}

        disabled={loading}

        className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3"

      >

        {loading ? (

          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analyzing...
          </>

        ) : (

          <>
            🚀 Get Crop Recommendation
          </>

        )}

      </motion.button>



      <AnimatePresence>

        {result && (

          <motion.div

            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}

            className="space-y-6"

          >


            <div className="glass-card p-8 text-center bg-gradient-to-br from-primary-900/30 to-emerald-900/20">

              <p className="text-primary-300 text-xs font-bold tracking-widest">
                AI RECOMMENDATION
              </p>


              <h2 className="font-display text-4xl font-bold text-white mt-3">

                🌾 {
                  result.predicted_crop.charAt(0).toUpperCase()
                  +
                  result.predicted_crop.slice(1)
                }

              </h2>


              <p className="text-gray-300 mt-2">
                Recommended based on your soil and climate conditions
              </p>


              <div className="mt-4 inline-flex px-4 py-2 rounded-full bg-primary-500/10">

                <span className="text-primary-300 font-bold">

                  {result.confidence.toFixed(1)}% Confidence

                </span>

              </div>


            </div>



            {result.crop_info && (

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


                {[
                  ['Growing Season', result.crop_info.season, '📅'],
                  ['Harvest Time', result.crop_info.harvest_time, '⏱️'],
                  ['Water Requirement', result.crop_info.water_requirement, '💧'],
                  ['Temperature Range', result.crop_info.temperature_range, '🌡️'],
                  ['Market Demand', result.crop_info.market_demand, '📈'],
                  ['Expected Yield', result.crop_info.expected_yield, '🌾'],
                  ['Suitable States', result.crop_info.suitable_states, '📍'],
                  ['Ideal pH', result.crop_info.ideal_ph, '⚗️'],
                  ['Profit Estimate', result.crop_info.profit_estimate, '💰']

                ].map((item) => (

                  <div key={item[0]} className="glass-card p-4">

                    <p className="text-xs text-gray-400">
                      {item[2]} {item[0]}
                    </p>

                    <p className="text-white text-sm mt-2">
                      {item[1]}
                    </p>

                  </div>

                ))}


              </div>

            )}



            {result.top_crops && result.top_crops.length > 1 && (

              <div className="glass-card p-6">

                <h3 className="font-display font-bold text-white mb-4">
                  🏆 Top Recommendations
                </h3>


                {result.top_crops.map((crop, index) => (

                  <div
                    key={crop.crop}
                    className="flex justify-between py-2"
                  >

                    <span className="text-white capitalize">

                      {index + 1}. {crop.crop}

                    </span>


                    <span className="text-primary-400">

                      {crop.confidence.toFixed(1)}%

                    </span>


                  </div>

                ))}


              </div>

            )}



          </motion.div>

        )}

      </AnimatePresence>


    </div>
  );
}