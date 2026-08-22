import React, { useState, useEffect, useRef } from 'react';
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
  // Scroll container ref — mobile keyboards + dvh heights make the browser
  // fail to reveal the newest bubble on its own.
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message whenever the thread changes or the
  // typing indicator toggles.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

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
        `Analyser mes heures sur ${doms.map((d) => d.label).join(', ')}`,
        'Plan pour le domaine le plus en retard',
        'Réorganiser mon emploi du temps',
        'Me remotiver quand une quête est difficile',
      ];
    }
    return [
      'Analyser mes heures hebdomadaires',
      'Générer un plan de révision de 45 min',
      'Conseils de dialogue de scénario',
      'Garder de l’énergie après la musculation ?',
    ];
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4">
      {/* h-dvh on phones: the keyboard shrinks the visual viewport, so a fixed
          600px modal left its input row under the keyboard. */}
      <div className="bg-glass-strong rounded-2xl max-w-2xl w-full h-[100dvh] sm:h-[min(600px,90dvh)] flex flex-col justify-between shadow-card-hover overflow-hidden">
        {/* Modal Header */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-lapis flex items-center justify-between gap-2 bg-obsidian/40">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-gold/10 text-gold-bright border border-gold/40 shadow-gold shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              {/* Shorter label on narrow screens instead of truncating mid-word. */}
              <h3 className="font-display text-base sm:text-xl font-light tracking-wide text-gradient-gold truncate">
                Mentor IA<span className="hidden sm:inline"> Routine &amp; Études</span>
              </h3>
              <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-pharaoh-subtle truncate">
                Moteur IA du Système — Gemini / NIM
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fermer le Mentor IA"
            className="btn-press p-2 rounded-xl text-pharaoh-muted hover:text-pharaoh hover:bg-gold/10 transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div ref={scrollRef} className="flex-1 min-h-0 px-3 py-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2 sm:gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-panel text-gold-bright border border-gold/40 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`px-3.5 py-3 sm:p-4 rounded-xl max-w-[85%] sm:max-w-[80%] text-xs leading-relaxed break-words ${
                  m.role === 'user'
                    ? 'bg-gold/10 text-gold-bright border border-gold/30 font-sans'
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
        <div className="p-3 sm:p-4 border-t border-lapis bg-obsidian/40 space-y-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-4">
          {/* Chips wrap into rows — a horizontal rail printed labels over each
              other at ~360px (beta screenshot #6). */}
          <div className="flex flex-wrap items-center gap-1.5">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                disabled={isLoading}
                className={`tap-compact px-2.5 py-1 rounded-xl bg-lapis/40 border border-lapis font-mono text-[10px] text-pharaoh-muted hover:border-gold hover:text-gold-bright transition-all whitespace-normal text-left ${
                  isLoading ? 'opacity-50 pointer-events-none' : ''
                }`}
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
              placeholder="Demandez conseil au Mentor IA..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              enterKeyHint="send"
              autoComplete="off"
              className="min-h-[44px] flex-1 min-w-0 bg-lapis/40 border border-lapis rounded-xl px-4 py-2.5 text-xs text-pharaoh placeholder:text-pharaoh-subtle focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
            />
            <button
              type="submit"
              aria-label="Envoyer le message"
              disabled={isLoading || !prompt.trim()}
              className="btn-press shrink-0 w-11 h-11 rounded-xl bg-gradient-to-r from-gold-dim via-gold to-gold-bright hover:shadow-gold disabled:opacity-50 disabled:cursor-not-allowed text-inverse border border-gold font-semibold transition-all flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
