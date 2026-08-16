import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, User, RefreshCw } from './ui/PharaohIcons';

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
      text: (() => {
        const doms: any[] = contextData?.domains || [];
        return doms.length > 0
          ? `Salutations ! Je suis votre Mentor IA. Parlez-moi de ${doms.map((d) => d.label).join(', ')} — emploi du temps, objectifs, blocages.`
          : "Salutations ! Je suis votre Mentor IA de Routine & Performance. Comment puis-je vous aider aujourd'hui concernant votre emploi du temps, vos objectifs Bangre Neo Lab, l'écriture de scénario ou vos cours de SVT/Maths/PC ?";
      })(),
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
          // Replay recent turns so the mentor keeps the conversation's thread
          // (server-side providers are stateless).
          history: messages.slice(-10).map((m) => ({ role: m.role, text: m.text })),
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
            text: data.error || 'Impossible de se connecter au Mentor IA. Vérifiez la configuration du serveur (GEMINI_API_KEY ou NVIDIA NIM).',
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

  const quickPrompts = (() => {
    const doms: any[] = contextData?.domains || [];
    if (doms.length > 0) {
      return [
        `Analyser mes heures hebdomadaires & objectifs sur ${doms.map((d) => d.label).join(', ')}`,
        'Générer un plan de travail pour le domaine le plus en retard',
        'Réorganiser mon emploi du temps pour tenir mes budgets hebdomadaires',
        'Me remotiver quand une quête est difficile',
      ];
    }
    return [
      'Analyser mes heures hebdomadaires & me conseiller pour atteindre 15-20h sur Bangre Neo',
      'Générer un plan de révision de 45 min pour les Mathématiques et la SVT',
      'Conseils de dialogue de scénario pour une scène de film intense',
      'Comment maintenir une énergie physique élevée après ma musculation du matin ?',
    ];
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-glass-strong rounded-2xl max-w-2xl w-full h-[600px] flex flex-col justify-between shadow-card-hover overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-lapis flex items-center justify-between bg-obsidian/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gold/10 text-gold-bright border border-gold/40 shadow-gold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-xl font-light tracking-wide text-gradient-gold">Mentor IA Routine & Études</h3>
              <p className="font-mono text-[10px] uppercase tracking-widest text-pharaoh-subtle">Moteur IA du Système — Gemini / NIM</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-press p-2 rounded-xl text-pharaoh-muted hover:text-pharaoh hover:bg-gold/10 transition-all"
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
                <div className="w-8 h-8 rounded-xl bg-panel text-gold-bright border border-gold/40 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-4 rounded-xl max-w-[80%] text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-gold/10 text-gold-bright border border-gold/30 font-mono'
                    : 'bg-panel border-lapis text-pharaoh font-sans'
                }`}
              >
                {m.text}
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-gold/10 text-gold-bright border border-gold/40 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 font-mono text-xs text-gold-bright animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Le Mentor IA synthétise vos conseils...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestions & Input Form */}
        <div className="p-4 border-t border-lapis bg-obsidian/40 space-y-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                className="btn-press px-2.5 py-1 rounded-xl bg-lapis/40 border border-lapis font-mono text-[10px] text-pharaoh-muted hover:border-gold hover:text-gold-bright transition-all whitespace-nowrap"
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
              className="flex-1 bg-lapis/40 border border-lapis rounded-xl px-4 py-2.5 text-xs text-pharaoh placeholder:text-pharaoh-subtle focus:outline-none focus:border-gold"
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="btn-press p-2.5 rounded-xl bg-gradient-to-r from-gold-dim via-gold to-gold-bright hover:shadow-gold disabled:opacity-50 text-inverse border border-gold font-semibold transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
