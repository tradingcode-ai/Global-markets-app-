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
      text: 'Welcome to the Executive Executive Strategic Advisory Desk. Ask me about hyperscaler CapEx, semiconductor supply bottlenecks, or energy grid constraints.'
    }
  ]);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const handleSend = async () => {
    const userMsg = message.trim();
    if (!userMsg || isTyping) return;

    setMessage('');
    setChatLog(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/analyze-earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Advisory analysis unavailable');
      }

      const analysis = payload.analysis || {};
      const reply = [
        analysis.summaryVerdict,
        Array.isArray(analysis.keyDrivers) && analysis.keyDrivers.length
          ? analysis.keyDrivers.map((item: string) => `• ${item}`).join('\n')
          : '',
        analysis.guidanceAndOutlook || '',
        analysis.marketImplication || ''
      ].filter(Boolean).join('\n\n');

      setChatLog(prev => [...prev, {
        sender: 'advisor',
        text: reply || 'Geen inhoudelijke analyse ontvangen.'
      }]);
    } catch (error) {
      console.error('[Executive Strategic Advisory Desk]', error);
      setChatLog(prev => [...prev, {
        sender: 'advisor',
        text: 'De strategische analyse is momenteel niet beschikbaar. Probeer het opnieuw zodra de analyse-service beschikbaar is.'
      }]);
    } finally {
      setIsTyping(false);
    }
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
                  <span>Institutional Research Framework</span>
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
        id="btn-executive-strategic-advisory"
        onClick={() => {
          setIsOpen(prev => !prev);
          if (onOpenConsultation) onOpenConsultation();
        }}
        aria-label="Open Executive Strategic Advisory Desk"
        className="fixed bottom-6 right-6 z-40 w-13 h-13 rounded-full bg-[#1b5be4] hover:bg-[#1548b8] text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer border-2 border-white/20"
      >
        <MessageCircle className="w-7 h-7 text-white fill-white" />
      </button>
    </>
  );
};
