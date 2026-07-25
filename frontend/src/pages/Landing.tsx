import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiZap, FiShield, FiTrendingUp, FiGlobe, FiCpu, FiBarChart2 } from 'react-icons/fi';

const features = [
  { icon: FiCpu, title: 'AI-Powered Predictions', description: 'Random Forest ML model trained on extensive agricultural data for precise crop recommendations.' },
  { icon: FiBarChart2, title: 'Advanced Analytics', description: 'Interactive charts and visual insights into soil health, weather patterns, and crop performance.' },
  { icon: FiGlobe, title: 'Weather Integration', description: 'Real-time weather data and forecasts to make informed farming decisions.' },
  { icon: FiShield, title: 'Soil Health Analysis', description: 'Comprehensive NPK analysis with pH monitoring and nutrient recommendations.' },
  { icon: FiTrendingUp, title: 'Market Intelligence', description: 'Profit estimates, market demand analysis, and seasonal crop planning.' },
  { icon: FiZap, title: 'Instant Results', description: 'Get crop recommendations in milliseconds with confidence scores and detailed growing guides.' },
];

const stats = [
  { value: '22+', label: 'Crop Types' },
  { value: '98.6%', label: 'Accuracy' },
  { value: '7', label: 'Parameters' },
  { value: '2200+', label: 'Data Points' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-dark-950 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary-600/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-xl flex items-center justify-center text-xl">
            🌱
          </div>
          <span className="font-display font-bold text-xl text-white">AgroSense AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-gray-400 hover:text-white transition-colors font-medium px-4 py-2">
            Sign In
          </Link>
          <Link to="/register" className="btn-primary text-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8">
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
            <span className="text-primary-300 text-sm font-semibold tracking-wide">AI-POWERED AGRICULTURE PLATFORM</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            Smart Crop<br />
            <span className="gradient-text">Recommendation</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Harness machine learning to analyze soil nutrients and climate conditions.
            Get precise crop recommendations with confidence scores and detailed growing guides.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
              Start Analysis <FiArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="btn-secondary flex items-center gap-2 text-lg px-8 py-4">
              Explore Dashboard
            </Link>
          </div>
        </motion.div>

        {/* Floating glass cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { emoji: '🧪', label: 'Soil Analysis', value: 'NPK + pH' },
            { emoji: '🌦️', label: 'Climate Data', value: 'Temp + Rain' },
            { emoji: '🎯', label: 'AI Prediction', value: '98.6% Accuracy' },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
              className="glass-card p-6 text-center hover:border-primary-500/20 transition-all duration-300"
            >
              <div className="text-3xl mb-3">{card.emoji}</div>
              <p className="text-sm text-gray-400 mb-1">{card.label}</p>
              <p className="font-display font-bold text-white">{card.value}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 bg-white/[0.02] border-y border-white/[0.06] py-16">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-4xl font-bold gradient-text mb-2">{stat.value}</p>
              <p className="text-gray-500 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Everything You Need for<br />Smart Agriculture
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            A complete AI-powered platform for modern farmers and agricultural professionals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card-hover p-6"
            >
              <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary-400" />
              </div>
              <h3 className="font-display font-bold text-white text-lg mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How AI Works */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl font-bold text-white mb-4">How AI Works</h2>
          <p className="text-gray-400">Three simple steps to get your crop recommendation</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Input Parameters', desc: 'Enter your soil nutrients (NPK, pH) and climate conditions (temperature, humidity, rainfall).' },
            { step: '02', title: 'AI Analysis', desc: 'Our Random Forest model analyzes your data against 2200+ agricultural data points.' },
            { step: '03', title: 'Get Results', desc: 'Receive top crop recommendations with confidence scores and detailed growing guides.' },
          ].map((item) => (
            <div key={item.step} className="glass-card p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="font-display font-bold text-sm">{item.step}</span>
              </div>
              <h3 className="font-display font-bold text-white mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24">
        <div className="glass-card p-12 text-center bg-gradient-to-br from-primary-900/30 to-emerald-900/20 border-primary-500/20">
          <h2 className="font-display text-3xl font-bold text-white mb-4">Ready to Transform Your Farming?</h2>
          <p className="text-gray-300 mb-8 max-w-lg mx-auto">
            Join thousands of farmers using AI-powered recommendations to maximize yield and profitability.
          </p>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
            Get Started Free <FiArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌱</span>
            <span className="font-display font-bold text-white">AgroSense AI</span>
          </div>
          <p className="text-gray-500 text-sm">Intelligent Crop Recommendation • Powered by Machine Learning</p>
        </div>
      </footer>
    </div>
  );
}
