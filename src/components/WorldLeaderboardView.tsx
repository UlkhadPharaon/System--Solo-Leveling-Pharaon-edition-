import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, ShieldAlert, Sparkles, User, HelpCircle, Check, RefreshCw } from './ui/PharaohIcons';
import { getSupabase } from '../lib/supabaseSync';
import { PlayerProfile, LeaderboardEntry, HunterRank } from '../types';

interface WorldLeaderboardViewProps {
  player: PlayerProfile;
  isOffline: boolean;
}

const LEGENDARY_HUNTERS: LeaderboardEntry[] = [
  {
    userId: 'leg_1',
    userName: 'Sung Jin-Woo',
    level: 120,
    rank: 'S' as HunterRank,
    hunterClass: 'Commandant des Ombres',
    totalXp: 180000,
    avatar: { skinTone: '#1a1a1a', auraColor: 'purple', crownType: 'none', eyeColor: '#7B3FE4' }
  },
  {
    userId: 'leg_2',
    userName: 'Thomas Andre',
    level: 95,
    rank: 'S' as HunterRank,
    hunterClass: 'Commandant des Ombres',
    totalXp: 120000,
    avatar: { skinTone: '#8D5B4C', auraColor: 'gold', crownType: 'khepresh', eyeColor: '#D4A81E' }
  },
  {
    userId: 'leg_3',
    userName: 'Cha Hae-In',
    level: 82,
    rank: 'S' as HunterRank,
    hunterClass: 'Guerrier Agile',
    totalXp: 88000,
    avatar: { skinTone: '#F4EAD4', auraColor: 'gold', crownType: 'none', eyeColor: '#D4A81E' }
  },
  {
    userId: 'leg_4',
    userName: 'Ryuji Goto',
    level: 75,
    rank: 'S' as HunterRank,
    hunterClass: 'Assassin Vorace',
    totalXp: 72000,
    avatar: { skinTone: '#D4A81E', auraColor: 'cyan', crownType: 'pschent', eyeColor: '#1D6FA5' }
  },
  {
    userId: 'leg_5',
    userName: 'Akari Shimizu',
    level: 54,
    rank: 'A' as HunterRank,
    hunterClass: 'Mage des Éléments',
    totalXp: 45000,
    avatar: { skinTone: '#F4EAD4', auraColor: 'emerald', crownType: 'none', eyeColor: '#1E8A49' }
  }
];

export const WorldLeaderboardView: React.FC<WorldLeaderboardViewProps> = ({ player, isOffline }) => {
  const [onlineEntries, setOnlineEntries] = useState<LeaderboardEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selfUid, setSelfUid] = useState<string | null>(null);

  // Compute player's estimated total cumulative XP
  const playerTotalXp = useMemo(() => {
    if (!player) return 0;
    let total = 0;
    // accumulate XP from level definitions
    for (let i = 1; i < (player?.level || 1); i++) {
      total += Math.floor(100 * Math.pow(1.5, i - 1));
    }
    total += player?.xp || 0;
    return total;
  }, [player?.level, player?.xp]);

  // Combine local legendary data with player score
  const localLeaderboard = useMemo(() => {
    if (!player) return LEGENDARY_HUNTERS;
    const playerEntry: LeaderboardEntry = {
      userId: 'current_user',
      userName: `${player?.name || 'Souverain'} (Vous)`,
      level: player?.level || 1,
      rank: player?.rank || 'E',
      hunterClass: player?.hunterClass || 'Chasseur Débutant',
      totalXp: playerTotalXp,
      avatar: player?.avatar
    };

    const combined = [...LEGENDARY_HUNTERS, playerEntry];
    return combined.sort((a, b) => b.totalXp - a.totalXp);
  }, [player, playerTotalXp]);

  const playerPosition = useMemo(() => {
    return localLeaderboard.findIndex(e => e.userId === 'current_user') + 1;
  }, [localLeaderboard]);

  // Sync to Supabase if online
  const syncScoreToCloud = async () => {
    const supabase = getSupabase();
    if (isOffline || !supabase || !player) return;
    setIsSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setSelfUid(user?.id ?? null);
      const uId = user?.id || 'anonymous_user';
      const uName = (player as any)?.name || 'Souverain anonyme';

      const entry: LeaderboardEntry = {
        userId: uId,
        userName: uName,
        level: player?.level || 1,
        rank: player?.rank || 'E',
        hunterClass: player?.hunterClass || 'Chasseur Débutant',
        totalXp: playerTotalXp,
        avatar: player?.avatar || { skinTone: '#D4A81E', auraColor: 'cyan', crownType: 'none', eyeColor: '#1D6FA5' }
      };

      await supabase.from('leaderboard').upsert(entry, { onConflict: 'user_id' });

      // Fetch top 10 from Supabase
      const { data: rows } = await supabase
        .from('leaderboard')
        .select('user_id, user_name, level, rank, hunter_class, total_xp, avatar')
        .order('total_xp', { ascending: false })
        .limit(10);
      const entries: LeaderboardEntry[] = (rows || []).map((r: any) => ({
        userId: r.user_id,
        userName: r.user_name,
        level: r.level,
        rank: r.rank,
        hunterClass: r.hunter_class,
        totalXp: r.total_xp,
        avatar: r.avatar,
      }));

      if (entries.length > 0) {
        setOnlineEntries(entries);
      }
    } catch (err) {
      console.warn('Leaderboard cloud sync failed or ignored due to Supabase RLS:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    syncScoreToCloud();
  }, [playerTotalXp, isOffline, player]);

  if (!player) return null;

  const finalDisplayList = onlineEntries.length > 0 ? onlineEntries : localLeaderboard;

  return (
    <div className="space-y-6 anim-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gold-dim pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gold/10 rounded-xl border border-gold/30">
            <Trophy className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h3 className="font-display text-md font-bold text-pharaoh tracking-widest uppercase">
              CLASSEMENT MONDIAL DES CHASSEURS
            </h3>
            <p className="text-[10px] text-pharaoh-subtle italic">
              Mesurez vos progrès face aux chasseurs de légende de l'association.
            </p>
          </div>
        </div>

        {!isOffline && (
          <button
            onClick={syncScoreToCloud}
            disabled={isSyncing}
            className="btn-press px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded-xl font-display font-mono text-[10px] tracking-widest uppercase flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            SYNCHRONISER SCORE
          </button>
        )}
      </div>

      {/* Real-time calculated placement banner */}
      <div className="bg-lapis/40 border border-gold/30 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-gold">
        <div className="space-y-1 text-center md:text-left">
          <div className="font-mono text-[10px] text-gold font-display tracking-widest uppercase">VOTRE CLASSEMENT ESTIMÉ</div>
          <h4 className="font-display text-xl font-bold text-pharaoh tracking-wide">
            Rang Mondial : <span className="text-gradient-gold">#{playerPosition}</span> sur l'Alliance
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-emerald font-bold bg-emerald/10 px-3 py-1.5 rounded-xl border border-emerald/40">
            {playerTotalXp} XP CUMULÉE
          </span>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="bg-panel border border-gold-dim rounded-3xl overflow-hidden">
        <div className="grid grid-cols-12 bg-lapis/30 p-4 border-b border-gold-dim font-mono text-[10px] font-display text-gold tracking-wider uppercase font-bold">
          <div className="col-span-2 text-center">Rang</div>
          <div className="col-span-5 md:col-span-6">Chasseur</div>
          <div className="col-span-3 md:col-span-2 text-center">Classe</div>
          <div className="col-span-2 text-right">XP Totale</div>
        </div>

        <div className="divide-y divide-gold-dim/50 stagger">
          {finalDisplayList.map((entry, idx) => {
            const isSelf = entry.userId === 'current_user' || (selfUid && entry.userId === selfUid);
            return (
              <div 
                key={entry.userId} 
                className={`grid grid-cols-12 p-4 items-center transition-all ${
                  isSelf 
                    ? 'bg-gold/10 border-l-4 border-gold' 
                    : 'hover:bg-obsidian-elevated/60'
                }`}
              >
                {/* Placement Rank */}
                <div className="col-span-2 text-center font-display font-bold text-sm">
                  {idx === 0 ? (
                    <span className="text-xl">👑</span>
                  ) : idx === 1 ? (
                    <span className="text-gold-bright text-lg">🥈</span>
                  ) : idx === 2 ? (
                    <span className="text-gold-dim text-lg">🥉</span>
                  ) : (
                    <span className="font-mono text-pharaoh-muted">#{idx + 1}</span>
                  )}
                </div>

                {/* Name / Badge */}
                <div className="col-span-5 md:col-span-6 flex items-center gap-3">
                  <div 
                    className="w-7 h-7 rounded-full border flex items-center justify-center shrink-0 text-pharaoh font-mono text-[10px]"
                    style={{ 
                      backgroundColor: entry.avatar?.skinTone || '#D4A81E',
                      borderColor: '#D4A81E',
                      boxShadow: `0 0 6px ${entry.avatar?.auraColor === 'purple' ? '#7B3FE4' : entry.avatar?.auraColor === 'cyan' ? '#1D6FA5' : '#D4A81E'}`
                    }}
                  >
                    {isSelf ? <User className="w-3.5 h-3.5 text-obsidian" /> : entry.userName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-bold font-display tracking-wide ${isSelf ? 'text-gold-bright' : 'text-pharaoh'}`}>
                        {entry.userName}
                      </span>
                      <span className="font-mono text-[8px] font-bold bg-obsidian-elevated px-1.5 py-0.5 rounded border border-gold/20 text-pharaoh-muted">
                        RANG {entry.rank}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-pharaoh-subtle">Niveau {entry.level}</div>
                  </div>
                </div>

                {/* Class */}
                <div className="col-span-3 md:col-span-2 text-center font-mono text-[10px] font-display text-pharaoh-muted tracking-wide">
                  {entry.hunterClass}
                </div>

                {/* XP */}
                <div className="col-span-2 text-right font-mono text-xs font-bold text-pharaoh-muted">
                  {entry.totalXp.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
