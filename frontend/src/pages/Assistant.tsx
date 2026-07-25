import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend } from 'react-icons/fi';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const suggestedPrompts = [
  'Best crop for rainy season?',
  'How to improve soil health?',
  'How much fertilizer for rice?',
  'What causes yellow leaves?',
  'Best crop for sandy soil?',
  'How to increase yield?',
];

const aiResponses: Record<string, string> = {
  'best crop for rainy season': 'For the rainy (Kharif) season, rice is the top recommendation! It thrives in high humidity (60-80%) and temperatures of 20-35°C. Other excellent options include maize, cotton, and jute. Rice needs abundant water (1200-2000mm), making it perfect for monsoon conditions.',
  'how to improve soil health': 'To improve soil health:\n\n1. **Add organic matter** - Compost, FYM, or vermicompost\n2. **Crop rotation** - Alternate legumes with cereals\n3. **Green manuring** - Grow and plow in cover crops\n4. **Balanced fertilization** - Test soil, apply NPK as needed\n5. **Reduce tillage** - Minimizes soil structure damage\n6. **Maintain pH** - Apply lime for acidic soils, gypsum for alkaline',
  'how much fertilizer for rice': 'Recommended fertilizer for rice (per hectare):\n\n- **Nitrogen**: 120-150 kg/ha (split into 3 doses)\n- **Phosphorus**: 60 kg/ha (basal application)\n- **Potassium**: 60 kg/ha (50% basal + 50% at panicle)\n\n**Schedule:**\n1. Basal: Full P + Half K + 1/3 N\n2. Tillering: 1/3 N\n3. Panicle: 1/3 N + Half K',
  'what causes yellow leaves': 'Yellow leaves in crops can indicate:\n\n1. **Nitrogen deficiency** - Older leaves yellow first\n2. **Iron deficiency** - Young leaves yellow (interveinal)\n3. **Overwatering** - Root rot leading to yellowing\n4. **Magnesium deficiency** - Lower leaf margins yellow\n5. **Disease** - Viral infections can cause yellowing\n\n**Solution:** Test soil nutrients, adjust irrigation, and apply foliar micronutrients.',
  'default': 'I can help you with crop recommendations, soil health, fertilizer guidance, weather planning, and farming best practices. Try asking about specific crops, soil improvement techniques, or pest management strategies!',
};

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, text: 'Hello! I\'m your AgroSense AI assistant. Ask me anything about crops, soil, weather, or farming practices. 🌱', sender: 'ai', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const getAIResponse = (userMessage: string): string => {
    const lower = userMessage.toLowerCase();
    for (const [key, response] of Object.entries(aiResponses)) {
      if (key !== 'default' && lower.includes(key)) return response;
    }
    if (lower.includes('crop') && lower.includes('rain')) return aiResponses['best crop for rainy season'];
    if (lower.includes('soil')) return aiResponses['how to improve soil health'];
    if (lower.includes('fertilizer') || lower.includes('fertiliser')) return aiResponses['how much fertilizer for rice'];
    if (lower.includes('yellow') || lower.includes('leaf') || lower.includes('leaves')) return aiResponses['what causes yellow leaves'];
    return aiResponses['default'];
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMsg: Message = { id: Date.now(), text: messageText, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    // Simulate AI typing delay
    setTimeout(() => {
      const aiMsg: Message = { id: Date.now() + 1, text: getAIResponse(messageText), sender: 'ai', timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      setTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-10rem)] flex flex-col">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <h1 className="font-display text-2xl font-bold text-white mb-1">AI Assistant</h1>
        <p className="text-gray-400">Your smart agriculture advisor powered by AI</p>
      </motion.div>

      {/* Chat Area */}
      <div className="flex-1 glass-card p-4 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.sender === 'user'
                ? 'bg-primary-600/20 border border-primary-500/20 text-white'
                : 'bg-white/[0.04] border border-white/[0.08] text-gray-200'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          </motion.div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-white/[0.04] border border-white/[0.08] p-4 rounded-2xl">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      <div className="flex flex-wrap gap-2 mb-3">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-gray-300 hover:bg-white/[0.08] hover:border-white/[0.12] transition-all"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about crops, soil, weather..."
          className="input-field flex-1"
        />
        <button onClick={() => handleSend()} className="btn-primary px-5">
          <FiSend className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
