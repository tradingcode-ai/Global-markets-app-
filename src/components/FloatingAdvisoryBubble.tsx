import React, { useState } from 'react';
import { MessageCircle, X, Sparkles, Send, ShieldCheck } from 'lucide-react';

interface FloatingAdvisoryBubbleProps {
  onOpenConsultation?: () => void;
}

export const FloatingAdvisoryBubble: React.FC<FloatingAdvisoryBubbleProps> = ({
  onOpenConsultation
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [chatLog, setChatLog] = useState<Array<{ sender: 'user' | 'advisor'; text: string }>>([
    {
      sender: 'advisor',
      text: 'Welcome to the Corporate Strategy & Market Advisory Desk. Ask me about hyperscaler CapEx, semiconductor supply bottlenecks, or energy grid constraints.'
    }
  ]);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const handleSend = () => {
    if (!message.trim()) return;
    const userMsg = message;
    setMessage('');
    setChatLog(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsTyping(true);

    setTimeout(() => {
      let reply = "Our strategic perspective indicates that tech megacaps with integrated vertical architectures (such as NVIDIA, ASML, and Microsoft) maintain superior ROIC leverage. However, baseload energy procurement (Dutch TTF natural gas contracts and nuclear SMRs) remains the dominant bottleneck for 2026-2028 data center energization.";
      
      const lower = userMsg.toLowerCase();
      if (lower.includes('power') || lower.includes('energy') || lower.includes('ttf') || lower.includes('gas')) {
        reply = "Energy analysis: European natural gas (Dutch TTF) and US Gulf liquefaction feedgas are facing structural tightness. Hyperscalers are contracting behind-the-meter nuclear and combined-cycle gas generation to bypass 4-7 year public utility grid interconnection queues.";
      } else if (lower.includes('asml') || lower.includes('lithography') || lower.includes('europe')) {
        reply = "European tech analysis: ASML maintains a 100% global monopoly on High-NA EUV lithography systems (€350M each). Transatlantic semiconductor sovereignty acts as a major defensive valuation moat for European tech leaders.";
      } else if (lower.includes('nvidia') || lower.includes('capex') || lower.includes('ai')) {
        reply = "CapEx analysis: Hyperscaler capital expenditure is on track to surpass $340B in 2026. While hardware procurement remains robust, market multiples increasingly reward companies demonstrating enterprise software margin accretion.";
      }

      setChatLog(prev => [...prev, { sender: 'advisor', text: reply }]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <>
      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[480px] animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-[#051c2c] text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-tight font-mono-code uppercase">
                  Strategic Advisory Desk
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] text-cyan-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>McKinsey & Institutional Framework</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 text-xs">
            {chatLog.map((c, i) => (
              <div
                key={i}
                className={`flex ${c.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl p-3 leading-relaxed ${
                    c.sender === 'user'
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-2xs'
                  }`}
                >
                  {c.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-400 border border-slate-200 rounded-xl p-3 text-xs italic">
                  Advisor analyzing corporate data...
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="p-2 bg-slate-100/80 border-t border-slate-200 flex gap-1.5 overflow-x-auto text-[10px]">
            <button
              onClick={() => { setMessage('What is the CapEx outlook?'); }}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 shrink-0 cursor-pointer"
            >
              CapEx Outlook
            </button>
            <button
              onClick={() => { setMessage('How do power grids constrain AI?'); }}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 shrink-0 cursor-pointer"
            >
              Grid Bottlenecks
            </button>
            <button
              onClick={() => { setMessage('ASML European moat?'); }}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 shrink-0 cursor-pointer"
            >
              ASML Moat
            </button>
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask strategic advisory desk..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-slate-50"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button Matching Screenshot 2 Bottom Right Chat Bubble */}
      <button
        id="btn-mckinsey-floating-advisory"
        onClick={() => {
          setIsOpen(prev => !prev);
          if (onOpenConsultation) onOpenConsultation();
        }}
        aria-label="Open Strategic Advisory"
        className="fixed bottom-6 right-6 z-40 w-13 h-13 rounded-full bg-[#1b5be4] hover:bg-[#1548b8] text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer border-2 border-white/20"
      >
        <MessageCircle className="w-7 h-7 text-white fill-white" />
      </button>
    </>
  );
};
