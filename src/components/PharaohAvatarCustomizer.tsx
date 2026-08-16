import React from 'react';
import { Sparkles, Palette, Crown, Eye } from './ui/PharaohIcons';
import { motion } from 'motion/react';
import { AvatarCustomization } from '../types';

interface PharaohAvatarCustomizerProps {
  customization: AvatarCustomization;
  equippedWeaponName?: string;
  equippedArmorName?: string;
  onUpdateCustomization: (update: Partial<AvatarCustomization>) => void;
}

const SKIN_TONES = [
  { value: '#D4AF37', label: 'Or Royal', desc: 'Une peau imprégnée d’énergie divine.' },
  { value: '#1a1a1a', label: 'Obsidienne', desc: 'Une ombre solide et mystérieuse.' },
  { value: '#F4EAD4', label: 'Albâtre', desc: 'Une pierre pure sculptée par le Temps.' },
  { value: '#8D5B4C', label: 'Bronze Sacré', desc: 'La force des bâtisseurs d’empire.' },
];

const AURAS = [
  { value: 'cyan', label: 'Volonté d’Anubis', color: '#1D6FA5', shadow: 'rgba(29, 111, 165, 0.4)' },
  { value: 'gold', label: 'Bénédiction de Râ', color: '#D4A81E', shadow: 'rgba(212, 168, 30, 0.4)' },
  { value: 'purple', label: 'Souverain des Ombres', color: '#7B3FE4', shadow: 'rgba(123, 63, 228, 0.4)' },
  { value: 'emerald', label: 'Renaissance d’Osiris', color: '#1E8A49', shadow: 'rgba(30, 138, 73, 0.4)' },
];

const CROWNS = [
  { value: 'none', label: 'Chevelure Royale', desc: 'Sans parure.' },
  { value: 'nemes', label: 'Némès Divin', desc: 'La coiffe légendaire rayée d’or et de lapis.' },
  { value: 'pschent', label: 'Double Couronne (Pschent)', desc: 'Souverain absolu des deux mondes.' },
  { value: 'khepresh', label: 'Khépesh d’Assaut', desc: 'Le casque bleu de guerre impériale.' },
];

const EYES = [
  { value: '#1D6FA5', label: 'Lueur Azur', shadow: 'rgba(29,111,165,0.9)' },
  { value: '#F0C42D', label: 'Lueur Dorée', shadow: 'rgba(240,196,45,0.9)' },
  { value: '#7B3FE4', label: 'Lueur Améthyste', shadow: 'rgba(123,63,228,0.9)' },
  { value: '#C0392B', label: 'Lueur Rubis', shadow: 'rgba(192,57,43,0.9)' },
];

const DEFAULT_CUSTOMIZATION: AvatarCustomization = {
  skinTone: '#D4AF37',
  auraColor: 'cyan',
  crownType: 'nemes',
  eyeColor: '#1D6FA5',
};

export const PharaohAvatarCustomizer: React.FC<PharaohAvatarCustomizerProps> = ({
  customization = DEFAULT_CUSTOMIZATION,
  equippedWeaponName,
  equippedArmorName,
  onUpdateCustomization,
}) => {
  const safeCustomization = customization || DEFAULT_CUSTOMIZATION;
  const currentAura = AURAS.find(a => a.value === safeCustomization.auraColor) || AURAS[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 anim-in">
      {/* Visual Avatar Display */}
      <div className="lg:col-span-5 bg-panel border border-gold-dim rounded-3xl p-6 flex flex-col items-center justify-center relative min-h-[350px] shadow-gold overflow-hidden">
        {/* Dynamic Glowing Aura Background */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: '240px',
            height: '240px',
            background: `radial-gradient(circle, ${currentAura.color} 0%, transparent 70%)`,
            opacity: 0.25,
            filter: 'blur(30px)',
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            repeat: Infinity,
            duration: 4,
            ease: "easeInOut",
          }}
        />

        {/* Vector SVG Avatar */}
        <div className="relative w-56 h-56 z-10 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(212,168,30,0.15)]">
            <defs>
              {/* Metallic gold gradient for mask/crown details */}
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F3E5AB" />
                <stop offset="50%" stopColor="#D4A81E" />
                <stop offset="100%" stopColor="#AA7C11" />
              </linearGradient>
              <linearGradient id="lapisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#152D52" />
                <stop offset="100%" stopColor="#0E1F3A" />
              </linearGradient>
            </defs>

            {/* Aura Particles / Rays */}
            <g stroke={currentAura.color} strokeWidth="0.5" opacity="0.4">
              <line x1="50" y1="50" x2="20" y2="20" strokeDasharray="2" />
              <line x1="50" y1="50" x2="80" y2="20" strokeDasharray="2" />
              <line x1="50" y1="50" x2="15" y2="50" strokeDasharray="2" />
              <line x1="50" y1="50" x2="85" y2="50" strokeDasharray="2" />
              <line x1="50" y1="50" x2="50" y2="10" strokeDasharray="2" />
            </g>

            {/* Base Body / Shoulders */}
            <path
              d="M30 85 C30 70, 70 70, 70 85 Z"
              fill={equippedArmorName ? '#0F1C2E' : '#0E1F3A'}
              stroke="url(#goldGrad)"
              strokeWidth="1"
            />
            {/* Chest Plate / Armor Piece */}
            {equippedArmorName && (
              <path
                d="M38 78 C38 72, 62 72, 62 78 L58 85 L42 85 Z"
                fill="url(#goldGrad)"
                opacity="0.9"
              />
            )}

            {/* Head Shape */}
            <circle cx="50" cy="50" r="18" fill={safeCustomization.skinTone} stroke="url(#goldGrad)" strokeWidth="0.75" />

            {/* Eyes Glow Effect */}
            <circle cx="43" cy="48" r="1.5" fill={safeCustomization.eyeColor} filter={`drop-shadow(0 0 2px ${safeCustomization.eyeColor})`} />
            <circle cx="57" cy="48" r="1.5" fill={safeCustomization.eyeColor} filter={`drop-shadow(0 0 2px ${safeCustomization.eyeColor})`} />

            {/* Egyptian Eye Makeup details */}
            <path d="M39 48 L46 48 M41 46 L45 47" stroke="#000000" strokeWidth="0.5" strokeLinecap="round" />
            <path d="M54 48 L61 48 M55 46 L59 47" stroke="#000000" strokeWidth="0.5" strokeLinecap="round" />

            {/* Royal Beard of the Pharaoh */}
            <path d="M48 64 L52 64 L51 74 L49 74 Z" fill="#040810" stroke="url(#goldGrad)" strokeWidth="0.5" />

            {/* CROWNS */}
            {safeCustomization.crownType === 'nemes' && (
              <g>
                {/* Nemes stripes/side folds */}
                <path d="M30 38 L32 58 L24 64 L30 36 Z" fill="url(#goldGrad)" />
                <path d="M70 38 L68 58 L76 64 L70 36 Z" fill="url(#goldGrad)" />
                {/* Nemes Hoodtop */}
                <path d="M32 38 C32 24, 68 24, 68 38 Z" fill="url(#lapisGrad)" stroke="url(#goldGrad)" strokeWidth="0.75" />
                {/* Horizontal Stripes on Nemes */}
                <path d="M36 30 C42 27, 58 27, 64 30" stroke="url(#goldGrad)" strokeWidth="1.5" fill="none" />
                <path d="M33 34 C41 31, 59 31, 67 34" stroke="url(#goldGrad)" strokeWidth="1.5" fill="none" />
                {/* Cobra (Uraeus) on Nemes front */}
                <path d="M49 26 C49 22, 51 22, 51 26 L50 29" stroke="#C0392B" strokeWidth="0.75" fill="none" />
              </g>
            )}

            {safeCustomization.crownType === 'pschent' && (
              <g>
                {/* Pschent Double Crown */}
                <path d="M35 34 L50 12 L65 34 Z" fill="url(#goldGrad)" />
                {/* Red crown base part */}
                <path d="M32 34 C32 25, 68 25, 68 34" fill="none" stroke="#C0392B" strokeWidth="4" />
                {/* Crown spire */}
                <line x1="50" y1="12" x2="50" y2="8" stroke="url(#goldGrad)" strokeWidth="1" />
                <circle cx="50" cy="7" r="1" fill="#FFF8DC" />
              </g>
            )}

            {safeCustomization.crownType === 'khepresh' && (
              <g>
                {/* Khepresh War Crown */}
                <path d="M33 34 C31 20, 69 20, 67 34 C64 40, 36 40, 33 34 Z" fill="url(#lapisGrad)" stroke="url(#goldGrad)" strokeWidth="0.75" />
                {/* Golden disks on the blue war crown */}
                <circle cx="42" cy="27" r="1" fill="url(#goldGrad)" />
                <circle cx="58" cy="27" r="1" fill="url(#goldGrad)" />
                <circle cx="50" cy="31" r="1" fill="url(#goldGrad)" />
                {/* Front cobra */}
                <circle cx="50" cy="23" r="1" fill="#C0392B" />
              </g>
            )}

            {/* Visual Equipped Weapon Overlay */}
            {equippedWeaponName && (
              <g transform="translate(18, 60) rotate(-15)">
                {/* Sacred Spear / Scepter */}
                <line x1="0" y1="25" x2="0" y2="-25" stroke="url(#goldGrad)" strokeWidth="1.5" />
                <path d="M-3 -25 L0 -35 L3 -25 Z" fill={currentAura.color} />
                <circle cx="0" cy="-24" r="1.5" fill="#FFF8DC" />
              </g>
            )}
          </svg>
        </div>

        {/* Dynamic Display of Stats/Titles */}
        <div className="mt-4 text-center z-10 space-y-1">
          <div className="font-display text-xs text-gold tracking-widest uppercase">AURA SOUVERAINE</div>
          <div className="font-display text-base font-bold text-pharaoh tracking-wide flex items-center justify-center gap-1.5">
            <Sparkles style={{ color: currentAura.color }} size={16} />
            {currentAura.label}
          </div>
          {equippedWeaponName && (
            <div className="font-mono text-[10px] text-emerald">
              [Arme] {equippedWeaponName}
            </div>
          )}
          {equippedArmorName && (
            <div className="font-mono text-[10px] text-emerald">
              [Armure] {equippedArmorName}
            </div>
          )}
        </div>
      </div>

      {/* Customization Options Panels */}
      <div className="lg:col-span-7 space-y-6">
        {/* Skin Selection */}
        <div className="space-y-3">
          <h4 className="font-display text-xs font-bold text-pharaoh tracking-widest uppercase flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" /> Couleur de l'Aura
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {AURAS.map((a) => (
              <button
                key={a.value}
                onClick={() => onUpdateCustomization({ auraColor: a.value })}
                className={`btn-press p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                  safeCustomization.auraColor === a.value
                    ? 'bg-lapis/50 border-gold text-pharaoh shadow-gold'
                    : 'bg-obsidian-elevated border-gold-dim/40 text-pharaoh-muted hover:border-gold/30 hover:text-pharaoh'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color, boxShadow: `0 0 8px ${a.color}` }} />
                  <span className="font-display text-xs font-bold tracking-wide">{a.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Crown Selection */}
        <div className="space-y-3">
          <h4 className="font-display text-xs font-bold text-pharaoh tracking-widest uppercase flex items-center gap-2">
            <Crown className="w-4 h-4 text-gold" /> Coiffes & Couronnes Divines
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CROWNS.map((c) => (
              <button
                key={c.value}
                onClick={() => onUpdateCustomization({ crownType: c.value as any })}
                className={`btn-press p-3.5 rounded-xl border text-left transition-all ${
                  safeCustomization.crownType === c.value
                    ? 'bg-lapis/50 border-gold text-pharaoh shadow-gold'
                    : 'bg-obsidian-elevated border-gold-dim/40 text-pharaoh-muted hover:border-gold/30 hover:text-pharaoh'
                }`}
              >
                <div className="font-display text-xs font-bold tracking-wide mb-1">{c.label}</div>
                <div className="text-[10px] text-pharaoh-subtle italic">{c.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Eyes Customization */}
        <div className="space-y-3">
          <h4 className="font-display text-xs font-bold text-pharaoh tracking-widest uppercase flex items-center gap-2">
            <Eye className="w-4 h-4 text-gold" /> Lueur des Yeux
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {EYES.map((e) => (
              <button
                key={e.value}
                onClick={() => onUpdateCustomization({ eyeColor: e.value })}
                className={`btn-press p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                  customization.eyeColor === e.value
                    ? 'bg-lapis/50 border-gold text-pharaoh shadow-gold'
                    : 'bg-obsidian-elevated border-gold-dim/40 text-pharaoh-muted hover:border-gold/30 hover:text-pharaoh'
                }`}
              >
                <div className="w-4 h-4 rounded-full border border-gold-dim/40" style={{ backgroundColor: e.value, boxShadow: `0 0 6px ${e.value}` }} />
                <span className="font-display text-[10px] font-bold">{e.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Skin Tone Customization */}
        <div className="space-y-3">
          <h4 className="font-display text-xs font-bold text-pharaoh tracking-widest uppercase flex items-center gap-2">
            <Palette className="w-4 h-4 text-gold" /> Teint de la Peau
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SKIN_TONES.map((s) => (
              <button
                key={s.value}
                onClick={() => onUpdateCustomization({ skinTone: s.value })}
                className={`btn-press p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                  customization.skinTone === s.value
                    ? 'bg-lapis/50 border-gold text-pharaoh shadow-gold'
                    : 'bg-obsidian-elevated border-gold-dim/40 text-pharaoh-muted hover:border-gold/30'
                }`}
              >
                <div className="w-8 h-4 rounded" style={{ backgroundColor: s.value }} />
                <span className="font-display text-[10px] font-bold text-center leading-none">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
