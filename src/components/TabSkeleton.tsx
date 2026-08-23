/**
 * TabSkeleton — layout-stable loading placeholder per tab (M4 fluidity).
 * A silhouette of the incoming view kills the "layout jump" when a lazy
 * chunk lands, which reads as instant even on slow 3G.
 */
import React from 'react';

const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`rounded-xl bg-lapis/40 animate-pulse ${className}`} />
);

export const TabSkeleton: React.FC<{ tab: string }> = ({ tab }) => {
  const hero = <Shimmer className="h-28 w-full" />;
  const rows = (n: number, h = 'h-20') => (
    <div className="space-y-3">
      {Array.from({ length: n }).map((_, i) => <Shimmer key={i} className={`${h} w-full`} />)}
    </div>
  );

  let body: React.ReactNode;
  switch (tab) {
    case 'system_solo':
      body = (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {hero}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{rows(4, 'h-16')}</div>
          </div>
          <div className="space-y-4">{hero}{rows(2, 'h-14')}</div>
        </div>
      );
      break;
    case 'dashboard':
      body = (
        <div className="space-y-5">
          {hero}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{rows(4, 'h-12')}</div>
          {rows(4)}
        </div>
      );
      break;
    case 'workout':
      body = <div className="space-y-5">{hero}{rows(3)}<Shimmer className="h-40 w-full" /></div>;
      break;
    case 'budget':
      body = (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">{hero}{rows(3)}</div>
          <div className="space-y-4">{rows(4)}</div>
        </div>
      );
      break;
    default:
      body = <div className="space-y-5">{hero}{rows(4)}</div>;
  }

  return (
    <div role="status" aria-label="Chargement du module" className="space-y-6">
      {body}
      <p className="font-mono text-[10px] tracking-widest uppercase text-pharaoh-subtle text-center animate-pulse">
        Invocation du module...
      </p>
    </div>
  );
};
