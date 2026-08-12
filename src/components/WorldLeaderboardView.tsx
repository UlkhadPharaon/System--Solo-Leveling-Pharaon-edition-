import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, ShieldAlert, Sparkles, User, HelpCircle, Check, RefreshCw } from 'lucide-react';
import { doc, setDoc, getDocs, collection, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase'; // we'll create a lightweight firebase.ts helper
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
    avatar: { skinTone: '#1a1a1a', auraColor: 'purple', crownType: 'none', eyeColor: '#A855F7' }
  },
  {
    userId: 'leg_2',
    userName: 'Thomas Andre',
    level: 95,
    rank: 'S' as HunterRank,
    hunterClass: 'Commandant des Ombres',
    totalXp: 120000,
    avatar: { skinTone: '#8D5B4C', auraColor: 'gold', crownType: 'khepresh', eyeColor: '#D4AF37' }
  },
  {
    userId: 'leg_3',
    userName: 'Cha Hae-In',
    level: 82,
    rank: 'S' as HunterRank,
    hunterClass: 'Guerrier Agile',
    totalXp: 88000,
    avatar: { skinTone: '#F4EAD4', auraColor: 'gold', crownType: 'none', eyeColor: '#D4AF37' }
  },
  {
    userId: 'leg_4',
    userName: 'Ryuji Goto',
    level: 75,
    rank: 'S' as HunterRank,
    hunterClass: 'Assassin Vorace',
    totalXp: 72000,
    avatar: { skinTone: '#D4AF37', auraColor: 'cyan', crownType: 'pschent', eyeColor: '#00F0FF' }
  },
  {
    userId: 'leg_5',
    userName: 'Akari Shimizu',
    level: 54,
    rank: 'A' as HunterRank,
    hunterClass: 'Mage des Éléments',
    totalXp: 45000,
    avatar: { skinTone: '#F4EAD4', auraColor: 'emerald', crownType: 'none', eyeColor: '#10B981' }
  }
];

export const WorldLeaderboardView: React.FC<WorldLeaderboardViewProps> = ({ player, isOffline }) => {
  const [onlineEntries, setOnlineEntries] = useState<LeaderboardEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Compute player's estimated total cumulative XP
  const playerTotalXp = useMemo(() => {
    if (!player) return 0;
    let total = 0;
    // accumulate XP from level definitions
    for (let i = 1; i < player.level; i++) {
      total += Math.floor(100 * Math.pow(1.5, i - 1));
    }
    total += player.xp;
    return total;
  }, [player?.level, player?.xp]);

  // Combine local legendary data with player score
  const localLeaderboard = useMemo(() => {
    if (!player) return LEGENDARY_HUNTERS;
    const playerEntry: LeaderboardEntry = {
      userId: 'current_user',
      userName: `${player.name} (Vous)`,
      level: player.level,
      rank: player.rank,
      hunterClass: player.hunterClass,
      totalXp: playerTotalXp,
      avatar: player.avatar
    };

    const combined = [...LEGENDARY_HUNTERS, playerEntry];
    return combined.sort((a, b) => b.totalXp - a.totalXp);
  }, [player, playerTotalXp]);

  const playerPosition = useMemo(() => {
    return localLeaderboard.findIndex(e => e.userId === 'current_user') + 1;
  }, [localLeaderboard]);

  // Sync to Firestore if online
  const syncScoreToCloud = async () => {
    if (isOffline || !db || !player) return;
    setIsSyncing(true);
    try {
      const uId = auth?.currentUser?.uid || 'anonymous_user';
      const uName = player.name || 'Souverain anonyme';
      
      const entry: LeaderboardEntry = {
        userId: uId,
        userName: uName,
        level: player.level,
        rank: player.rank,
        hunterClass: player.hunterClass,
        totalXp: playerTotalXp,
        avatar: player.avatar
      };

      await setDoc(doc(db, 'leaderboard', uId), entry);
      
      // Fetch top 10 from Firestore
      const q = query(collection(db, 'leaderboard'), orderBy('totalXp', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      const entries: LeaderboardEntry[] = [];
      querySnapshot.forEach((doc) => {
        entries.push(doc.data() as LeaderboardEntry);
      });
      
      if (entries.length > 0) {
        setOnlineEntries(entries);
      }
    } catch (err) {
      console.warn('Leaderboard cloud sync failed or ignored due to Firestore rules:', err);
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-sl-gold/15 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sl-gold/10 rounded-xl border border-sl-gold/30">
            <Trophy className="w-6 h-6 text-sl-gold" />
          </div>
          <div>
            <h3 className="text-md font-bold text-white font-display tracking-widest uppercase">
              CLASSEMENT MONDIAL DES CHASSEURS
            </h3>
            <p className="text-[10px] text-slate-500 font-serif italic">
              Mesurez vos progrès face aux chasseurs de légende de l'association.
            </p>
          </div>
        </div>

        {!isOffline && (
          <button
            onClick={syncScoreToCloud}
            disabled={isSyncing}
            className="px-4 py-2 bg-sl-gold/10 hover:bg-sl-gold/20 text-sl-gold border border-sl-gold/30 rounded-xl font-display text-[10px] tracking-widest uppercase flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            SYNCHRONISER SCORE
          </button>
        )}
      </div>

      {/* Real-time calculated placement banner */}
      <div className="bg-sl-lapis/30 border border-sl-gold/30 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-gold-sm">
        <div className="space-y-1 text-center md:text-left">
          <div className="text-[10px] text-sl-gold font-display tracking-widest uppercase">VOTRE CLASSEMENT ESTIMÉ</div>
          <h4 className="text-xl font-bold text-white font-display">
            Rang Mondial : <span className="text-sl-gold-light">#{playerPosition}</span> sur l'Alliance
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-900/40">
            {playerTotalXp} XP CUMULÉE
          </span>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="bg-sl-primary/40 border border-sl-gold/10 rounded-3xl overflow-hidden">
        <div className="grid grid-cols-12 bg-sl-lapis/20 p-4 border-b border-sl-gold/10 text-[10px] font-display text-sl-gold tracking-wider uppercase font-bold">
          <div className="col-span-2 text-center">Rang</div>
          <div className="col-span-5 md:col-span-6">Chasseur</div>
          <div className="col-span-3 md:col-span-2 text-center">Classe</div>
          <div className="col-span-2 text-right">XP Totale</div>
        </div>

        <div className="divide-y divide-sl-gold/10">
          {finalDisplayList.map((entry, idx) => {
            const isSelf = entry.userId === 'current_user' || (auth?.currentUser?.uid && entry.userId === auth.currentUser.uid);
            return (
              <div 
                key={entry.userId} 
                className={`grid grid-cols-12 p-4 items-center transition-all ${
                  isSelf 
                    ? 'bg-sl-gold/10 border-l-4 border-sl-gold' 
                    : 'hover:bg-sl-primary/60'
                }`}
              >
                {/* Placement Rank */}
                <div className="col-span-2 text-center font-display font-bold text-sm">
                  {idx === 0 ? (
                    <span className="text-xl">👑</span>
                  ) : idx === 1 ? (
                    <span className="text-yellow-500 text-lg">🥈</span>
                  ) : idx === 2 ? (
                    <span className="text-amber-600 text-lg">🥉</span>
                  ) : (
                    <span className="text-slate-400 font-mono">#{idx + 1}</span>
                  )}
                </div>

                {/* Name / Badge */}
                <div className="col-span-5 md:col-span-6 flex items-center gap-3">
                  <div 
                    className="w-7 h-7 rounded-full border flex items-center justify-center shrink-0 text-white font-mono text-[10px]"
                    style={{ 
                      backgroundColor: entry.avatar?.skinTone || '#D4AF37',
                      borderColor: '#D4AF37',
                      boxShadow: `0 0 6px ${entry.avatar?.auraColor === 'purple' ? '#A855F7' : entry.avatar?.auraColor === 'cyan' ? '#00F0FF' : '#D4AF37'}`
                    }}
                  >
                    {isSelf ? <User className="w-3.5 h-3.5 text-sl-primary" /> : entry.userName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-bold font-display ${isSelf ? 'text-sl-gold-light font-bold' : 'text-white'}`}>
                        {entry.userName}
                      </span>
                      <span className="text-[8px] font-mono font-bold bg-sl-primary/60 px-1.5 py-0.5 rounded border border-sl-gold/20 text-slate-400">
                        RANG {entry.rank}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Niveau {entry.level}</div>
                  </div>
                </div>

                {/* Class */}
                <div className="col-span-3 md:col-span-2 text-center text-[10px] font-display text-slate-400">
                  {entry.hunterClass}
                </div>

                {/* XP */}
                <div className="col-span-2 text-right font-mono text-xs font-bold text-slate-300">
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
