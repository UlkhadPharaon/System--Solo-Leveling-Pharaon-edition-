import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X } from './ui/PharaohIcons';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 max-w-sm bg-glass-strong rounded-2xl p-4 shadow-gold backdrop-blur-md animate-bounce-subtle">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-gold/20 text-gold-bright border border-gold/40 flex-shrink-0">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div className="flex-1">
          <h4 className="font-display text-sm tracking-wide text-gold-bright mb-1">Installer le Système PWA</h4>
          <p className="text-xs text-pharaoh-muted mb-3">
            Installez l'application sur votre appareil pour un accès instantané hors-ligne et une expérience en plein écran.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="btn-press px-3 py-1.5 rounded-lg bg-gradient-to-r from-gold to-gold-bright hover:shadow-gold text-inverse text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Installer</span>
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="btn-press px-3 py-1.5 rounded-lg bg-lapis hover:bg-lapis-light text-pharaoh-muted hover:text-pharaoh text-xs transition-all"
            >
              Plus tard
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowInstallBanner(false)}
          className="text-pharaoh-subtle hover:text-pharaoh-muted p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
