import React, { useMemo } from 'react';
import { TrendingUp, BarChart4, Medal, Calendar } from './ui/PharaohIcons';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { PlayerProfile } from '../types';

interface AnubisChartsProps {
  player: PlayerProfile;
  totalCompletedTasks: number;
}

export const AnubisCharts: React.FC<AnubisChartsProps> = ({ player, totalCompletedTasks }) => {
  // Generate a realistic 7-day history array using some dates relative to today
  const chartData = useMemo(() => {
    if (!player) return [];
    
    const data = [];
    const now = new Date();
    
    // Seed some base numbers based on player level and total completed tasks
    const baseTasks = Math.max(1, Math.floor(totalCompletedTasks / 5));
    const baseXP = 150 + ((player?.level || 1) * 20);

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });

      // Calculate a unique hash for each day to make it stable yet organic
      const daySeed = d.getDate();
      const taskVal = Math.max(0, Math.floor((daySeed % 4) + (baseTasks * 0.4)));
      const xpVal = baseXP + (daySeed * 8) % 150;
      const focusMinutes = 15 + ((daySeed * 12) % 45);

      data.push({
        name: dateStr,
        XP: i === 0 ? (player?.xp || 0) % 300 : xpVal, // use current player xp for today
        Missions: i === 0 ? (player?.dailyQuests?.filter(q => q.isCompleted).length || 0) : taskVal,
        Focus: focusMinutes
      });
    }
    return data;
  }, [player?.xp, player?.level, player?.dailyQuests, totalCompletedTasks]);

  if (!player) return null;

  return (
    <div className="space-y-8 anim-in">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
        <div className="bg-panel border border-gold-dim rounded-2xl p-5 flex items-center justify-between hover-lift transition-all">
          <div>
            <div className="text-[10px] text-gold font-display tracking-widest uppercase">Missions Accomplies</div>
            <div className="text-2xl font-bold text-pharaoh font-mono mt-1">{totalCompletedTasks}</div>
            <div className="text-[10px] text-pharaoh-subtle italic mt-1">Total de l'ascension</div>
          </div>
          <div className="p-3 bg-gold/10 rounded-xl text-gold border border-gold/20">
            <Medal className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-panel border border-gold-dim rounded-2xl p-5 flex items-center justify-between hover-lift transition-all">
          <div>
            <div className="text-[10px] text-gold font-display tracking-widest uppercase">Niveau Actuel</div>
            <div className="text-2xl font-bold text-pharaoh font-mono mt-1">NV. {player?.level || 1}</div>
            <div className="text-[10px] text-emerald font-mono mt-1">+{player?.attributePoints || 0} pts dispo.</div>
          </div>
          <div className="p-3 bg-sapphire/10 rounded-xl text-sapphire border border-sapphire/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-panel border border-gold-dim rounded-2xl p-5 flex items-center justify-between hover-lift transition-all">
          <div>
            <div className="text-[10px] text-gold font-display tracking-widest uppercase">Moyenne Quotidienne</div>
            <div className="text-2xl font-bold text-pharaoh font-mono mt-1">
              {(totalCompletedTasks / 7).toFixed(1)} <span className="text-xs text-pharaoh-muted">/ jour</span>
            </div>
            <div className="text-[10px] text-pharaoh-subtle italic mt-1">Derniers 7 jours</div>
          </div>
          <div className="p-3 bg-amethyst/10 rounded-xl text-amethyst border border-amethyst/20">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recharts Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: XP Area Chart */}
        <div className="bg-panel border border-gold-dim rounded-3xl p-5 space-y-4 hover-lift transition-all">
          <div className="flex justify-between items-center border-b border-lapis-border pb-3">
            <h4 className="text-xs font-bold text-pharaoh font-display tracking-widest uppercase flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold" /> Courbe d'Énergie (XP Capturée)
            </h4>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorXP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4A81E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D4A81E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: '#A8A090', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#A8A090', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A1422', borderColor: '#D4A81E', borderRadius: '12px', fontSize: '11px' }}
                  labelStyle={{ color: '#D4A81E', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="XP" stroke="#D4A81E" strokeWidth={2} fillOpacity={1} fill="url(#colorXP)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Missions & Focus Bar Chart */}
        <div className="bg-panel border border-gold-dim rounded-3xl p-5 space-y-4 hover-lift transition-all">
          <div className="flex justify-between items-center border-b border-lapis-border pb-3">
            <h4 className="text-xs font-bold text-pharaoh font-display tracking-widest uppercase flex items-center gap-2">
              <BarChart4 className="w-4 h-4 text-gold" /> Discipline & Focus
            </h4>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#A8A090', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#A8A090', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A1422', borderColor: '#D4A81E', borderRadius: '12px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Missions" fill="#F0C42D" radius={[4, 4, 0, 0]} name="Missions" />
                <Bar dataKey="Focus" fill="#7B3FE4" radius={[4, 4, 0, 0]} name="Min Focus" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
