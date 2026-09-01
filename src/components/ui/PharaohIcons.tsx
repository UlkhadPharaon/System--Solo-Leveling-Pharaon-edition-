import React from 'react';

interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  size?: number | string;
  color?: string;
  className?: string;
}

/**
 * Pharaoh Icon Library — Solo Leveling themed SVG icons
 * Replaces lucide-react with custom designed icons matching the aesthetic
 */
const createIcon = (paths: React.ReactNode) =>
  React.forwardRef<SVGSVGElement, IconProps>(
    ({ size = 24, color = 'currentColor', className = '', style, ...props }, ref) => (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={{ ...style, flexShrink: 0 }}
        {...props}
      >
        {paths}
      </svg>
    )
  );

/** Type of every exported icon — accepts full SVG props (style, onClick, …). */
export type PharaohIcon = ReturnType<typeof createIcon>;

// ── Navigation / Core Icons ──

export const Crown = createIcon((
  <>
    <path d="M12 2L9 9h6l-3 9-4-9H3l3-7z" />
    <path d="M12 2v7" />
    <circle cx="12" cy="12" r="2" />
  </>
));

export const Sword = createIcon((
  <>
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
    <path d="M13 19l6-6" />
    <path d="M16 16l4 4" />
    <path d="M19 21l2-2" />
  </>
));

export const Shield = createIcon((
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
));

export const Orb = createIcon((
  <>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </>
));

export const Portal = createIcon((
  <>
    <ellipse cx="12" cy="12" rx="9" ry="6" />
    <ellipse cx="12" cy="12" rx="5" ry="3" />
    <path d="M12 6v12M6 12h12" strokeWidth="1" opacity="0.5" />
  </>
));

// ── Domain Category Icons ──

export const Dumbbell = createIcon((
  <>
    <path d="M6 18v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <path d="M6 14h12" />
    <path d="M10 4v4M14 4v4" />
  </>
));

export const Film = createIcon((
  <>
    <rect x="2" y="2" width="20" height="20" rx="2" />
    <path d="M8 8h8v8H8z" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </>
));

export const GraduationCap = createIcon((
  <>
    <path d="M3 17h18M8 17V7l4-4 4 4v10" />
    <path d="M12 7v10" />
  </>
));

export const Code = createIcon((
  <>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </>
));

export const BookOpen = createIcon((
  <>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a2 2 0 0 1-2 2H4" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a2 2 0 0 0 2 2h4" />
    <path d="M12 3v18" />
  </>
));

export const Briefcase = createIcon((
  <>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M6 7V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" />
    <path d="M10 11v6M14 11v6" />
  </>
));

export const Wallet = createIcon((
  <>
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h14v-4" />
    <path d="M9 11h6M9 15h4" />
  </>
));

export const Users = createIcon((
  <>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>
));

export const Flame = createIcon((
  <>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </>
));

export const Sparkles = createIcon((
  <>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </>
));

export const Zap = createIcon((
  <>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </>
));

export const Target = createIcon((
  <>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </>
));

export const Trophy = createIcon((
  <>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5h15a2.5 2.5 0 0 1 0 5H18" />
    <path d="M18 9a2 2 0 0 0 0 4h-2.5" />
    <path d="M4 22h16" />
    <path d="M8 14h8" />
    <path d="M10 18h4" />
  </>
));

export const Calendar = createIcon((
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <path d="M8 14h.01M12 14h.01M16 14h.01" />
  </>
));

export const FileText = createIcon((
  <>
    <path d="M14 2v6h6" />
    <path d="M16 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M10 12h6M10 16h4M10 20h2" />
  </>
));

export const Clock = createIcon((
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </>
));

export const Eye = createIcon((
  <>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </>
));

export const EyeOff = createIcon((
  <>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 2.88-2.23M9.88 9.88A10.07 10.07 0 0 0 12 4c7 0 11 8 11 8a18.45 18.45 0 0 1-2.88 2.23" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </>
));

// ── Action Icons ──

export const Plus = createIcon(<path d="M12 5v14M5 12h14" />);
export const Minus = createIcon(<path d="M5 12h14" />);
export const X = createIcon(<path d="M18 6L6 18M6 6l12 12" />);
export const Check = createIcon(<polyline points="20 6 9 17 4 12" />);
export const CheckCircle = createIcon((
  <>
    <circle cx="12" cy="12" r="10" />
    <polyline points="16 8 12 12 8 10" />
  </>
));
export const Circle = createIcon(<circle cx="12" cy="12" r="10" />);
export const Trash = createIcon((
  <>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </>
));
export const Download = createIcon((
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </>
));
export const Upload = createIcon((
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </>
));
export const Refresh = createIcon((
  <>
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </>
));
export const ArrowLeft = createIcon(<path d="M19 12H5M12 19l-7-7 7-7" />);
export const ArrowRight = createIcon(<path d="M5 12h14M12 5l7 7-7 7" />);
export const ChevronLeft = createIcon(<polyline points="15 18 9 12 15 6" />);
export const ChevronRight = createIcon(<polyline points="9 18 15 12 9 6" />);
export const ChevronDown = createIcon(<polyline points="6 9 12 15 18 9" />);
export const ChevronUp = createIcon(<polyline points="18 15 12 9 6 15" />);

export const Settings = createIcon((
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </>
));

export const Menu = createIcon(<path d="M3 12h18M3 6h18M3 18h18" />);
export const Search = createIcon((
  <>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </>
));

export const Filter = createIcon((
  <>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </>
));

export const Layers = createIcon((
  <>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </>
));

export const MapPin = createIcon((
  <>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </>
));

export const Volume = createIcon((
  <>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </>
));
export const VolumeX = createIcon((
  <>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </>
));

export const ListMusic = createIcon((
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 9h10M9 15h6" />
    <path d="M5 9v6" />
  </>
));

export const SkipForward = createIcon((
  <>
    <polygon points="5 4 15 12 5 20" />
    <line x1="19" y1="5" x2="19" y2="19" />
  </>
));
export const SkipBack = createIcon((
  <>
    <polygon points="19 20 9 12 19 4" />
    <line x1="5" y1="5" x2="5" y2="19" />
  </>
));
export const Play = createIcon(<polygon points="5 3 19 12 5 21" />);
export const Pause = createIcon((
  <>
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </>
));

export const PartyPopper = createIcon((
  <>
    <path d="M5.5 20.5a3.5 3.5 0 0 1-3-5.5V11" />
    <path d="M18.5 20.5a3.5 3.5 0 0 0 3-5.5V11" />
    <path d="M4 11a8 8 0 0 1 16 0" />
    <path d="M9 15v-5M15 15v-5" />
    <circle cx="12" cy="11" r="1" fill="currentColor" />
  </>
));

export const Gift = createIcon((
  <>
    <rect x="3" y="8" width="18" height="12" rx="2" />
    <path d="M12 8v12M3 12h18" />
    <path d="M7 8V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4" />
  </>
));

export const Coins = createIcon((
  <>
    <circle cx="8" cy="8" r="6" />
    <circle cx="16" cy="16" r="6" />
    <path d="M12 12h.01M12 16h.01" />
  </>
));

export const Wand = createIcon((
  <>
    <path d="M15 4V2M15 16v-2M8 9l7-7M20 9l-7-7M3.5 20.5L18 6" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </>
));

export const Cloud = createIcon((
  <>
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </>
));

// ── Status Icons ──

export const TrendingUp = createIcon(<polyline points="23 6 13.5 15.5 8.5 10.5" />);
export const TrendingDown = createIcon(<polyline points="1 18 10.5 9.5 15.5 14.5" />);
export const AlertTriangle = createIcon((
  <>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </>
));

export const Info = createIcon((
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </>
));

export const HelpCircle = createIcon((
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </>
));

// ── Rank / Progression Icons ──

export const Star = createIcon((
  <>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </>
));

export const Medal = createIcon((
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 4v8M8 12h8" />
    <path d="M8 16h8" />
  </>
));

export const Skull = createIcon((
  <>
    <path d="M12 2a2 2 0 0 0-2 2v2H8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2V4a2 2 0 0 0-2-2z" />
    <circle cx="9" cy="10" r="1" fill="currentColor" />
    <circle cx="15" cy="10" r="1" fill="currentColor" />
    <path d="M9 14h6" strokeWidth="2" strokeLinecap="round" />
  </>
));

export const Dragon = createIcon((
  <>
    <path d="M21 12c0 4-3 7-7 7s-7-3-7-7 3-7 7-7 7 3 7 7z" />
    <path d="M12 5v7M9 9h6" />
    <path d="M18 18c0-2-2-3-4-3s-4 1-4 3" />
  </>
));

export const Wolf = createIcon((
  <>
    <path d="M12 2C8 2 5 5 5 9c0 4 3 7 7 7s7-3 7-7c0-4-3-7-7-7z" />
    <path d="M9 9h6M9 12h6" />
    <circle cx="9" cy="9" r="1" fill="currentColor" />
    <circle cx="15" cy="9" r="1" fill="currentColor" />
  </>
));

// ── UI / Layout ──

export const Grid = createIcon((
  <>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </>
));

export const Columns = createIcon((
  <>
    <rect x="3" y="3" width="5" height="18" rx="1" />
    <rect x="11" y="3" width="5" height="18" rx="1" />
    <rect x="19" y="3" width="2" height="18" rx="1" />
  </>
));

export const Rows = createIcon((
  <>
    <rect x="3" y="3" width="18" height="5" rx="1" />
    <rect x="3" y="11" width="18" height="5" rx="1" />
    <rect x="3" y="19" width="18" height="2" rx="1" />
  </>
));

export const Layout = createIcon((
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9" />
  </>
));

export const Sidebar = createIcon((
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
  </>
));

export const Expand = createIcon((
  <>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <polyline points="3.27 17.04 12 12.01 20.73 17.04" />
  </>
));

export const Minimize = createIcon((
  <>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <line x1="12" y1="8" x2="12" y2="16" />
  </>
));

// ── Extended Icon Set (completes the lucide replacement) ──

export const Activity = createIcon((
  <>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </>
));

export const ShoppingCart = createIcon((
  <>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </>
));

export const History = createIcon((
  <>
    <path d="M3 3v5h5" />
    <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
    <path d="M12 7v5l4 2" />
  </>
));

export const Camera = createIcon((
  <>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </>
));

export const Music = createIcon((
  <>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </>
));

export const Lock = createIcon((
  <>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </>
));

export const Heart = createIcon((
  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
));

export const Brain = createIcon((
  <>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z" />
  </>
));

export const Hammer = createIcon((
  <>
    <path d="M15 12l-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9" />
    <path d="M17.64 15L22 10.64 13.36 2 9 6.36 17.64 15z" />
  </>
));

export const Timer = createIcon((
  <>
    <line x1="10" y1="2" x2="14" y2="2" />
    <line x1="12" y1="14" x2="15" y2="11" />
    <circle cx="12" cy="14" r="8" />
  </>
));

export const BarChart3 = createIcon((
  <>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </>
));

export const BarChart4 = createIcon((
  <>
    <line x1="8" y1="20" x2="8" y2="14" />
    <line x1="12" y1="20" x2="12" y2="8" />
    <line x1="16" y1="20" x2="16" y2="12" />
    <line x1="4" y1="20" x2="20" y2="20" />
  </>
));

export const Pie = createIcon((
  <>
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
  </>
));

export const Save = createIcon((
  <>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </>
));

export const RotateCcw = createIcon((
  <>
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </>
));

export const Scale = createIcon((
  <>
    <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
    <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
  </>
));

export const User = createIcon((
  <>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>
));

export const Sliders = createIcon((
  <>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </>
));

export const Bell = createIcon((
  <>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </>
));

export const BellOff = createIcon((
  <>
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
    <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
    <path d="M18 8a6 6 0 0 0-9.33-5" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </>
));

export const Mic = createIcon((
  <>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </>
));

export const Utensils = createIcon((
  <>
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
  </>
));

export const Moon = createIcon(<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />);

export const Smile = createIcon((
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </>
));

export const Pin = createIcon((
  <>
    <line x1="12" y1="17" x2="12" y2="22" />
    <path d="M5 17h14l-1.5-5.5L21 9l-4-4-2.5 4.5H9.5L7 5 3 9l3.5 2.5L5 17z" />
  </>
));

export const Share2 = createIcon((
  <>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </>
));

export const Send = createIcon((
  <>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </>
));

export const Bot = createIcon((
  <>
    <rect x="3" y="8" width="18" height="12" rx="2" />
    <path d="M12 8V4" />
    <circle cx="12" cy="3" r="1" />
    <circle cx="8" cy="13" r="1" fill="currentColor" />
    <circle cx="16" cy="13" r="1" fill="currentColor" />
    <path d="M8 17h8" />
  </>
));

export const ScrollText = createIcon((
  <>
    <path d="M6 3h12v18H6z" />
    <path d="M9 7h6M9 11h6M9 15h4" />
    <path d="M3 5v14" strokeWidth="1" opacity="0.5" />
  </>
));

export const Palette = createIcon((
  <>
    <circle cx="13.5" cy="6.5" r="1.5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r="1.5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r="1.5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r="1.5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </>
));

export const Square = createIcon(<rect x="5" y="5" width="14" height="14" rx="1" />);

export const ShieldAlert = createIcon((
  <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </>
));

// ── Aliases (1:1 lucide names used across components) ──
export const Trash2 = Trash;
export const Edit2 = createIcon((
  <>
    <path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </>
));
export const Edit3 = Edit2;
export const CheckCircle2 = CheckCircle;
export const RefreshCw = Refresh;
export const Volume2 = Volume;

// ── Push notification icons ───────────────────────────────────────────────
export const Globe = createIcon((
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="6" y1="2" x2="6" y2="6" />
    <line x1="18" y1="2" x2="18" y2="6" />
  </>
));

export const Hourglass = createIcon((
  <>
    <path d="M12 2v6h4l2-8h-4l2 8z" />
    <circle cx="12" cy="12" r="10" />
  </>
));

// ── Final missing set (used by BudgetTracker / DailyRitual / OnboardingModal / ProgressDashboard) ──
export const ArrowUpRight = createIcon(<><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></>);
export const ArrowDownRight = createIcon(<><line x1="7" y1="7" x2="17" y2="17" /><polyline points="17 7 17 17 7 17" /></>);
export const ShieldCheck = createIcon((
  <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </>
));
export const ShoppingBag = createIcon((
  <>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </>
));
export const Tag = createIcon((
  <>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </>
));
export const PiggyBank = createIcon((
  <>
    <path d="M4 12a8 8 0 0 1 8-8c1.3 0 2.54.31 3.63.88L20 4l-1.12 2.37A8 8 0 0 1 20 12v1h2l-2 2v2a2 2 0 0 1-2 2h-1v2h-2v-2H9v2H7v-2a3 3 0 0 1-3-3z" />
    <circle cx="15" cy="11" r="1" fill="currentColor" />
  </>
));
export const Sun = createIcon((
  <>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </>
));
export const Award = createIcon((
  <>
    <circle cx="12" cy="8" r="6" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </>
));
export const ListFilter = Filter;

export const Smartphone = createIcon((
  <>
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </>
));

export const Monitor = createIcon((
  <>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </>
));

// Export all as a namespace for easy importing
export const PharaohIcons = {
  // Navigation
  Crown, Sword, Shield, Orb, Portal,
  // Domains
  Dumbbell, Film, GraduationCap, Code, BookOpen, Briefcase, Wallet, Users, Flame,
  // Actions
  Plus, Minus, X, Check, CheckCircle, Circle, Trash, Download, Upload, Refresh,
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Settings, Menu, Search, Filter, Layers, MapPin,
  // Media
  Volume, VolumeX, ListMusic, SkipForward, SkipBack, Play, Pause,
  // Status
  TrendingUp, TrendingDown, AlertTriangle, Info, HelpCircle,
  // Rewards
  Sparkles, Zap, Target, Trophy, Star, Medal, PartyPopper, Gift, Coins, Wand,
  // Rank
  Skull, Dragon, Wolf,
  // Layout
  Grid, Columns, Rows, Layout, Sidebar, Expand, Minimize,
  // Time/Calendar
  Calendar, Clock, FileText, Eye, EyeOff,
  // Extended set
  Activity, ShoppingCart, History, Camera, Music, Lock, Heart, Brain, Hammer, Timer,
  BarChart3, BarChart4, Pie, Save, RotateCcw, Scale, User, Sliders, Bell, BellOff,
  Mic, Utensils, Moon, Smile, Pin, Share2, Send, Bot, ScrollText, Palette, Square, ShieldAlert,
  // Aliases
  Trash2, Edit2, Edit3, CheckCircle2, RefreshCw, Volume2,
  ArrowUpRight, ArrowDownRight, ShieldCheck, ShoppingBag, Tag, PiggyBank, Sun, Award, ListFilter,
  Smartphone, Monitor,
};

export type PharaohIconName = keyof typeof PharaohIcons;

// Helper to get icon by name (for dynamic rendering)
export function getIcon(name: PharaohIconName): React.ComponentType<IconProps> {
  return PharaohIcons[name] || Crown;
}