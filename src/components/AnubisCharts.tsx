import React, { useMemo } from 'react';
import { TrendingUp, BarChart4, Award, Calendar } from 'lucide-react';
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
    const baseXP = 150 + (player?.level * 20 || 0);

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
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-sl-primary/50 border border-sl-gold/15 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-sl-gold font-display tracking-widest uppercase">Missions Accomplies</div>
            <div className="text-2xl font-bold text-white font-mono mt-1">{totalCompletedTasks}</div>
            <div className="text-[10px] text-slate-500 italic mt-1">Total de l'ascension</div>
          </div>
          <div className="p-3 bg-sl-gold/10 rounded-xl text-sl-gold border border-sl-gold/20">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-sl-primary/50 border border-sl-gold/15 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-sl-gold font-display tracking-widest uppercase">Niveau Actuel</div>
            <div className="text-2xl font-bold text-white font-mono mt-1">NV. {player.level}</div>
            <div className="text-[10px] text-emerald-400 font-mono mt-1">+{player.attributePoints} pts dispo.</div>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-sl-primary/50 border border-sl-gold/15 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-sl-gold font-display tracking-widest uppercase">Moyenne Quotidienne</div>
            <div className="text-2xl font-bold text-white font-mono mt-1">
              {(totalCompletedTasks / 7).toFixed(1)} <span className="text-xs text-slate-400">/ jour</span>
            </div>
            <div className="text-[10px] text-slate-500 italic mt-1">Derniers 7 jours</div>
          </div>
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recharts Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: XP Area Chart */}
        <div className="bg-sl-primary/30 border border-sl-gold/15 rounded-3xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-sl-gold/10 pb-3">
            <h4 className="text-xs font-bold text-white font-display tracking-widest uppercase flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sl-gold" /> Courbe d'Énergie (XP Capturée)
            </h4>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorXP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#040d1a', borderColor: '#D4AF37', borderRadius: '12px', fontSize: '11px' }}
                  labelStyle={{ color: '#D4AF37', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="XP" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorXP)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Missions & Focus Bar Chart */}
        <div className="bg-sl-primary/30 border border-sl-gold/15 rounded-3xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-sl-gold/10 pb-3">
            <h4 className="text-xs font-bold text-white font-display tracking-widest uppercase flex items-center gap-2">
              <BarChart4 className="w-4 h-4 text-sl-gold" /> Discipline & Focus
            </h4>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#040d1a', borderColor: '#D4AF37', borderRadius: '12px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Missions" fill="#00F0FF" radius={[4, 4, 0, 0]} name="Missions" />
                <Bar dataKey="Focus" fill="#A855F7" radius={[4, 4, 0, 0]} name="Min Focus" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
