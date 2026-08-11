import React, { useState } from 'react';
import { User, Target, Zap, Check } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (data: { userName: string; mainGoal: string; intensity: string }) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [mainGoal, setMainGoal] = useState('');
  const [intensity, setIntensity] = useState('moderate');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#051428] backdrop-blur-sm">
      <div className="bg-[#051428] border border-cyan-500/30 rounded-2xl p-8 w-full max-w-lg shadow-2xl space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <User className="text-cyan-400" /> Bienvenue Chasseur
            </h2>
            <p className="text-slate-300">Comment le Système doit-il vous appeler ?</p>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Entrez votre nom..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
            />
            <button
              disabled={!userName}
              onClick={() => setStep(2)}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl p-3 font-bold disabled:opacity-50"
            >
              Continuer
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Target className="text-cyan-400" /> Votre Objectif
            </h2>
            <p className="text-slate-300">Quelle est votre quête principale ?</p>
            <input
              type="text"
              value={mainGoal}
              onChange={(e) => setMainGoal(e.target.value)}
              placeholder="Ex: Devenir développeur, Musculation..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
            />
            <button
              disabled={!mainGoal}
              onClick={() => setStep(3)}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl p-3 font-bold disabled:opacity-50"
            >
              Continuer
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="text-cyan-400" /> Intensité du Système
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {['débutant', 'modéré', 'avancé'].map((level) => (
                <button
                  key={level}
                  onClick={() => setIntensity(level)}
                  className={`p-4 rounded-xl border ${
                    intensity === level ? 'bg-cyan-950 border-cyan-500' : 'bg-slate-900 border-slate-700'
                  } text-white capitalize`}
                >
                  {level}
                </button>
              ))}
            </div>
            <button
              onClick={() => onComplete({ userName, mainGoal, intensity })}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl p-3 font-bold flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" /> Démarrer la Quête
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
