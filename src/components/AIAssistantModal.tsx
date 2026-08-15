import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, User, RefreshCw } from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextData: any;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  contextData,
}) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: "Salutations ! Je suis votre Mentor IA de Routine & Performance. Comment puis-je vous aider aujourd'hui concernant votre emploi du temps, vos objectifs Bangre Neo Lab, l'écriture de scénario ou vos cours de SVT/Maths/PC ?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (userPromptStr?: string) => {
    const textToSend = userPromptStr || prompt;
    if (!textToSend.trim() || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', text: textToSend }]);
    if (!userPromptStr) setPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          context: contextData,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data.error || 'Impossible de se connecter au Coach IA. Veuillez vérifier votre clé GEMINI_API_KEY.',
          },
        ]);
      }
    } catch (err: unknown) {
      console.error('Error querying AI coach:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Erreur réseau lors de la communication avec le Mentor IA.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Analyser mes heures hebdomadaires & me conseiller pour atteindre 15-20h sur Bangre Neo',
    'Générer un plan de révision de 45 min pour les Mathématiques et la SVT',
    'Conseils de dialogue de scénario pour une scène de film intense',
    'Comment maintenir une énergie physique élevée après ma musculation du matin ?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#051428] border border-cyan/50 rounded-xl max-w-2xl w-full h-[600px] flex flex-col justify-between shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-soft flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/40 text-cyan-400 border border-cyan">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="serif text-xl font-light italic text-white tracking-tight">Mentor IA Routine & Études</h3>
              <p className="mono text-[10px] uppercase opacity-60">Propulsé par le Moteur Gemini AI</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-cyan-950/40 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-cyan-950/40 text-cyan-400 border border-cyan flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-4 rounded-xl max-w-[80%] text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-card text-cyan-400 border border-cyan font-mono'
                    : 'bg-cyan-950/40 border border-soft text-white font-sans'
                }`}
              >
                {m.text}
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-card text-cyan-400 border border-cyan flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 mono text-xs text-cyan-400 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Le Mentor IA synthétise vos conseils...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestions & Input Form */}
        <div className="p-4 border-t border-soft bg-black/40 space-y-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                className="px-2.5 py-1 rounded-xl bg-cyan-950/40 border border-soft mono text-[10px] text-slate-300 hover:border-cyan hover:text-cyan-400 transition-all whitespace-nowrap"
              >
                {qp}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Demandez au Coach IA des conseils d'emploi du temps, de scénario, de révision..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 bg-cyan-950/40 border border-soft rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan"
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="p-2.5 rounded-xl bg-card hover:bg-card-hover disabled:opacity-50 text-cyan-400 border border-cyan font-semibold transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
