
import React, { useState, useRef, useEffect } from 'react';
import { getClimateRiskAssessment } from '../services/geminiService';
import { ChatMessage } from '../types';

const ClimateChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello, I am EcoGuard Expert. How can I help you understand local climate risks or sustainability today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const result = await getClimateRiskAssessment(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          input
        );
        const modelMsg: ChatMessage = { 
          role: 'model', 
          text: result.text, 
          sources: result.sources,
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, modelMsg]);
        setIsTyping(false);
      }, () => {
        // Fallback if no geo
        setIsTyping(false);
      });
    } catch (e) {
      console.error(e);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] max-h-[800px] bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white">
            <i className="fa-solid fa-robot"></i>
          </div>
          <div>
            <h3 className="font-bold text-emerald-900 text-sm">Climate Strategy Expert</h3>
            <p className="text-[10px] text-emerald-600 font-medium">REAL-TIME SEARCH ENABLED</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 ${
              m.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-tr-none shadow-md' 
                : 'bg-gray-100 text-gray-800 rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-200 text-xs">
                  <p className="font-bold text-gray-400 mb-1 uppercase tracking-wider">Citations</p>
                  <div className="flex flex-col gap-1">
                    {m.sources.map((s, idx) => (
                      <a key={idx} href={s.uri} target="_blank" rel="noreferrer" className="text-emerald-600 underline truncate">
                        {s.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4 flex space-x-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about local wildfire risks, drought, or heatwaves..."
            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center hover:bg-emerald-700 transition disabled:opacity-50"
          >
            <i className="fa-solid fa-arrow-up"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClimateChat;
