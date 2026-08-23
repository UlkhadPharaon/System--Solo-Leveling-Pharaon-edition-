import React, { useState, useMemo } from 'react';
import { 
  Transaction, 
  BudgetBucketGoal, 
  SavingsGoal, 
  MoneyFlowBucket, 
  TransactionType 
} from '../types';
import {
  Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, Plus, Filter, Trash,
  Sparkles, Code, Film, GraduationCap, ShieldCheck, ShoppingBag, Tag, Calendar,
  PiggyBank, Layers, ChevronDown, ChevronUp, Eye, EyeOff, X, Search, ListMusic,
  Pie as PieIcon, Globe, RefreshCw, BarChart3, type PharaohIcon,
} from './ui/PharaohIcons';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid,
  AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { CURRENCIES, useFx, formatInCurrency, formatCompact, formatRateAge, BASE_CURRENCY } from '../lib/fx';
import {
  buildMonthlySeries, buildBucketHealth, currentMonthFlows, netFlowDelta,
} from '../lib/budgetAnalytics';

interface BudgetTrackerProps {
  transactions: Transaction[];
  budgetBuckets: BudgetBucketGoal[];
  savingsGoals: SavingsGoal[];
  onAddTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateBucketAllocation: (bucketKey: MoneyFlowBucket, newLimit: number) => void;
  onAddSavingsGoal: (goal: SavingsGoal) => void;
  onUpdateSavingsGoalAmount: (id: string, delta: number) => void;
  onDeleteSavingsGoal: (id: string) => void;
}

const BucketIconMap: Record<string, PharaohIcon> = {
  bangre_neo_tech: Code,
  cinema_production: Film,
  school_education: GraduationCap,
  savings_investment: ShieldCheck,
  living_essentials: ShoppingBag,
  personal_lifestyle: ShoppingBag,
};

// Pharaoh palette bucket accents (see index.css @theme).
const BucketColorMap: Record<string, string> = {
  bangre_neo_tech: '#7B3FE4',   // amethyst — tech/craft
  cinema_production: '#D4A81E', // gold — creative
  school_education: '#1D6FA5',  // sapphire — intellectual
  savings_investment: '#1E8A49',// emerald — financial
  living_essentials: '#2FA57A', // jade — everyday
  personal_lifestyle: '#C94277',// lotus — personal
};

/** FX-aware tooltip for the monthly trend chart (amounts arrive pre-converted). */
const TrendTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string; currencyCode: string }> = ({
  active, payload, label, currencyCode,
}) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as Record<string, number | string>;
  const colorFor: Record<string, string> = { Revenus: '#D4A81E', 'Dépenses': '#C0392B', Net: '#1E8A49' };
  return (
    <motion.div
      className="bg-panel border border-lapis-border p-3 rounded-xl shadow-card-hover space-y-1 min-w-[170px] z-50"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <p className="font-display text-sm font-light text-pharaoh capitalize">{label}</p>
      {(['Revenus', 'Dépenses', 'Net'] as const).map((k) => (
        <div key={k} className="flex justify-between text-xs font-mono">
          <span className="text-pharaoh-subtle">{k}</span>
          <span style={{ color: colorFor[k] }}>{formatInCurrency(Number(row[k]), currencyCode)}</span>
        </div>
      ))}
    </motion.div>
  );
};

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({
  transactions,
  budgetBuckets,
  savingsGoals,
  onAddTransaction,
  onDeleteTransaction,
  onUpdateBucketAllocation,
  onAddSavingsGoal,
  onUpdateSavingsGoalAmount,
  onDeleteSavingsGoal,
}) => {
  // Display currency is a real FX view over the canonical XOF ledger —
  // switching converts every amount through live rates (lib/fx), not a suffix swap.
  const [displayCurrency, setDisplayCurrency] = useState<string>(BASE_CURRENCY);
  const fx = useFx();
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterBucket, setFilterBucket] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showTransactionModal, setShowTransactionModal] = useState<boolean>(false);
  const [showSavingsModal, setShowSavingsModal] = useState<boolean>(false);
  const [editingSavingsGoal, setEditingSavingsGoal] = useState<SavingsGoal | null>(null);
  // #3 UX audit: deleting a transaction was a single unconfirmed tap — one
  // mistap rewrote the whole budget history (totals, envelopes, savings rate).
  const [pendingDeleteTxId, setPendingDeleteTxId] = useState<string | null>(null);
  const pendingDeleteTx = transactions.find((t) => t.id === pendingDeleteTxId) ?? null;
  // Same guard for savings goals — deleting one silently erased its progress.
  const [pendingDeleteGoalId, setPendingDeleteGoalId] = useState<string | null>(null);
  const pendingDeleteGoal = savingsGoals.find((g) => g.id === pendingDeleteGoalId) ?? null;

  // Allocation drafts for the envelope-management panel (keyed by bucket).
  const [allocDrafts, setAllocDrafts] = useState<Partial<Record<MoneyFlowBucket, string>>>({});

  /** Commit a typed allocation (display currency → canonical XOF ledger). */
  const commitAllocation = (bucket: MoneyFlowBucket) => {
    const draft = allocDrafts[bucket];
    if (draft == null) return;
    const parsed = parseFloat(draft);
    if (Number.isFinite(parsed) && parsed >= 0) {
      onUpdateBucketAllocation(bucket, Math.round(fx.convert(parsed, displayCurrency, BASE_CURRENCY)));
    }
    setAllocDrafts((prev) => {
      const next = { ...prev };
      delete next[bucket];
      return next;
    });
  };

  const [txTitle, setTxTitle] = useState<string>('');
  const [txAmount, setTxAmount] = useState<string>('');
  // Currency the user is typing the amount in — converted to the XOF ledger on save.
  const [txCurrency, setTxCurrency] = useState<string>(BASE_CURRENCY);
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [txBucket, setTxBucket] = useState<MoneyFlowBucket>(
    (budgetBuckets[0]?.bucket as MoneyFlowBucket) || 'bangre_neo_tech'
  );
  const [txSource, setTxSource] = useState<string>('');
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [txIsRecurring, setTxIsRecurring] = useState<boolean>(false);
  const [txNotes, setTxNotes] = useState<string>('');

  const [goalTitle, setGoalTitle] = useState<string>('');
  const [goalTarget, setGoalTarget] = useState<string>('');
  const [goalCurrent, setGoalCurrent] = useState<string>('0');
  const [goalBucket, setGoalBucket] = useState<MoneyFlowBucket>(
    (budgetBuckets[1]?.bucket as MoneyFlowBucket) || budgetBuckets[0]?.bucket as MoneyFlowBucket || 'cinema_production'
  );
  const bucketOptions = budgetBuckets.map((b) => ({ value: b.bucket as string, label: b.label }));
  const [goalTargetDate, setGoalTargetDate] = useState<string>('');

  // ── Aggregations (canonical XOF) + display conversion ──────────────────────
  const convertFromLedger = (amount: number): number => fx.convert(amount, BASE_CURRENCY, displayCurrency);
  const money = (amountInLedger: number): string => formatInCurrency(convertFromLedger(amountInLedger), displayCurrency);

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netCashFlow = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;
  const totalSavedInGoals = savingsGoals.reduce((acc, g) => acc + g.currentAmount, 0);

  // Intelligent processing — monthly trend, envelope pressure ranking,
  // current-month flows and MoM net-flow delta feed the new charts/KPIs.
  const monthlySeries = useMemo(() => buildMonthlySeries(transactions, 6), [transactions]);
  const bucketHealth = useMemo(() => buildBucketHealth(budgetBuckets, transactions), [budgetBuckets, transactions]);
  const monthFlows = useMemo(() => currentMonthFlows(transactions), [transactions]);
  const flowDelta = useMemo(() => netFlowDelta(transactions), [transactions]);

  // Display-currency projection of the 6-month series for the area chart.
  const monthlySeriesDisplay = useMemo(
    () =>
      monthlySeries.map((p) => ({
        month: p.month,
        Revenus: Math.round(convertFromLedger(p.income)),
        Dépenses: Math.round(convertFromLedger(p.expense)),
        Net: Math.round(convertFromLedger(p.income - p.expense)),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [monthlySeries, fx.snapshot.rates, displayCurrency]
  );

  const getSpentByBucket = (bucket: MoneyFlowBucket): number => {
    return transactions.filter((t) => t.type === 'expense' && t.bucket === bucket).reduce((acc, t) => acc + t.amount, 0);
  };

  const getBucketInfo = (bucket: MoneyFlowBucket) => {
    if (typeof bucket === 'string' && bucket.startsWith('domain:')) {
      const goal = budgetBuckets.find((b) => b.bucket === bucket);
      return { label: goal?.label || 'Enveloppe', icon: Wallet, color: goal?.color || '#D4A81E' };
    }
    return {
      label: budgetBuckets.find((b) => b.bucket === bucket)?.label || bucket,
      icon: BucketIconMap[bucket] || Wallet,
      color: BucketColorMap[bucket] || budgetBuckets.find((b) => b.bucket === bucket)?.color || '#D4A81E',
    };
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesBucket = filterBucket === 'all' || t.bucket === filterBucket;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sourceOrVendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesBucket && matchesSearch;
  });

  const chartDataByBucket = budgetBuckets.map((b) => {
    const spent = getSpentByBucket(b.bucket);
    return {
      name: b.label.split(' ')[0],
      Allocation: b.monthlyAllocation,
      Spent: spent,
      color: b.color,
    };
  });

  const pieData = budgetBuckets.map((b) => ({
    name: b.label,
    value: getSpentByBucket(b.bucket) || 10,
    color: b.color,
  }));

  // Type-aware defaults: switching income/expense re-targets the most sensible
  // envelope instead of leaving a stale selection.
  const handleTxTypeChange = (type: TransactionType) => {
    setTxType(type);
    const fallback: MoneyFlowBucket =
      type === 'income' ? 'savings_investment' : ((budgetBuckets[0]?.bucket as MoneyFlowBucket) || 'bangre_neo_tech');
    setTxBucket((prev) => {
      const stillValid = budgetBuckets.some((b) => b.bucket === prev && (type === 'expense' || prev === 'savings_investment'));
      return stillValid ? prev : fallback;
    });
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle || !txAmount) return;
    const rawAmount = parseFloat(txAmount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) return;
    // Convert the typed amount into the canonical XOF ledger at current rates.
    const ledgerAmount = Math.round(fx.convert(rawAmount, txCurrency, BASE_CURRENCY));
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: txTitle,
      amount: ledgerAmount,
      type: txType,
      bucket: txBucket,
      sourceOrVendor: txSource || 'Source Générale',
      date: txDate || new Date().toISOString().split('T')[0],
      isRecurring: txIsRecurring,
      notes: txNotes,
      createdAt: new Date().toISOString(),
      currency: txCurrency,
      originalAmount: rawAmount,
    };
    onAddTransaction(newTx);
    setShowTransactionModal(false);
    setTxTitle(''); setTxAmount(''); setTxSource(''); setTxNotes('');
  };

  const handleCreateSavingsGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTarget) return;
    const newGoal: SavingsGoal = {
      id: `sg-${Date.now()}`,
      title: goalTitle,
      targetAmount: parseFloat(goalTarget),
      currentAmount: parseFloat(goalCurrent) || 0,
      bucket: goalBucket,
      targetDate: goalTargetDate || undefined,
    };
    onAddSavingsGoal(newGoal);
    setShowSavingsModal(false);
    setGoalTitle(''); setGoalTarget(''); setGoalCurrent('0'); setGoalTargetDate('');
  };

  const handleSaveSavingsGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTarget) return;
    if (editingSavingsGoal) {
      onUpdateSavingsGoalAmount(editingSavingsGoal.id, parseFloat(goalTarget) - editingSavingsGoal.targetAmount);
    } else {
      const newGoal: SavingsGoal = {
        id: `sg-${Date.now()}`,
        title: goalTitle,
        targetAmount: parseFloat(goalTarget),
        currentAmount: parseFloat(goalCurrent) || 0,
        bucket: goalBucket,
        targetDate: goalTargetDate || undefined,
      };
      onAddSavingsGoal(newGoal);
    }
    setShowSavingsModal(false);
    setEditingSavingsGoal(null);
    setGoalTitle(''); setGoalTarget(''); setGoalCurrent('0'); setGoalTargetDate('');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <motion.div
          className="bg-panel border border-lapis-border p-3 rounded-xl shadow-card-hover space-y-1 min-w-[180px] z-50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p className="font-display text-sm font-light text-pharaoh">{label}</p>
          <div className="space-y-0.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-pharaoh-subtle">Alloué</span>
              <span className="text-gold-bright">{money(data.Allocation)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-pharaoh-subtle">Dépensé</span>
              <span className="text-blood">{money(data.Spent)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-lapis-border/50">
              <span className="text-pharaoh-subtle">Restant</span>
              <span className={data.Allocation - data.Spent >= 0 ? 'text-emerald' : 'text-blood'}>
                {money(data.Allocation - data.Spent)}
              </span>
            </div>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 anim-in">
      {/* Hero Banner */}
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-panel border border-lapis-border p-6 md:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="deco-corner deco-corner--tl" style={{ background: 'radial-gradient(circle, var(--color-gold) 0%, transparent 70%)' }} />
          <div className="deco-corner deco-corner--br" style={{ background: 'radial-gradient(circle, var(--color-emerald) 0%, transparent 70%)' }} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-xl text-[10px] font-mono tracking-wide font-medium bg-sapphire/10 text-sapphire border border-sapphire/40 flex items-center gap-1.5">
                <Wallet size={14} style={{ color: 'var(--color-sapphire)' }} />
                Moteur de Capital & Flux Financiers
              </span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-light italic text-pharaoh tracking-tight">
              Hub Budgétaire & Allocation Financière
            </h2>
            <p className="text-pharaoh-subtle text-sm mt-2 max-w-2xl leading-relaxed">
              {budgetBuckets.length > 0
                ? `Suivez les flux de revenus, affectez le capital à ${budgetBuckets.slice(0, 3).map((b) => b.label).join(', ')}, et surveillez vos réserves.`
                : 'Suivez vos flux de revenus, créez vos enveloppes budgétaires et surveillez vos réserves.'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap self-start md:self-auto">
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-1 bg-panel border border-lapis-border p-1 rounded-xl text-xs font-mono">
                {Object.values(CURRENCIES).map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setDisplayCurrency(c.code)}
                    title={c.label}
                    className={`px-2.5 py-1 rounded-lg uppercase transition-all ${
                      displayCurrency === c.code
                        ? 'bg-panel-gold text-gold-bright border-gold/50 font-bold'
                        : 'text-pharaoh-muted hover:text-pharaoh'
                    }`}
                  >
                    {c.symbol === 'FCFA' ? 'FCFA' : c.symbol}
                  </button>
                ))}
              </div>
              {/* Live FX status — honest about the data source. */}
              <div className="flex items-center gap-2 text-[10px] font-mono text-pharaoh-subtle pr-1">
                <Globe size={11} className={fx.isLoading ? 'animate-pulse' : ''} />
                <span>
                  {displayCurrency === BASE_CURRENCY
                    ? 'Devise de référence'
                    : `Taux réels ${formatRateAge(fx.snapshot.updatedAt)} · ${fx.snapshot.status === 'fallback' ? 'secours local' : 'open.er-api'}`}
                </span>
                <button
                  onClick={() => void fx.refresh()}
                  disabled={fx.isLoading}
                  aria-label="Actualiser les taux de change"
                  className="btn-press p-0.5 rounded text-pharaoh-subtle hover:text-gold-bright transition-colors disabled:opacity-40"
                >
                  <RefreshCw size={11} className={fx.isLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowTransactionModal(true)}
              className="btn-press flex items-center gap-2 px-4 py-2 rounded-xl bg-panel-gold text-gold-bright border-gold/50 font-mono text-xs tracking-wide hover:shadow-gold"
            >
              <Plus size={18} />
              <span>Nouvelle Transaction</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative overflow-hidden rounded-2xl bg-panel border border-lapis-border p-5 hover-lift hover-glow">
          <div className="absolute inset-0 pointer-events-none opacity-5">
            <div className="deco-corner deco-corner--tl" style={{ background: 'radial-gradient(circle, var(--color-gold) 0%, transparent 70%)' }} />
          </div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-panel-gold">
                <ArrowUpRight size={22} color="var(--color-gold)" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-gold-bright">Revenus</p>
                <p className="font-display text-2xl font-light text-pharaoh">{money(totalIncome)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] text-pharaoh-subtle">Ce mois</p>
              <p className="font-mono text-sm text-emerald">{money(monthFlows.income)}</p>
              {flowDelta != null && (
                <p className={`font-mono text-[10px] ${flowDelta >= 0 ? 'text-emerald' : 'text-blood'}`}>
                  {flowDelta >= 0 ? '▲' : '▼'} {money(Math.abs(flowDelta))} vs M-1
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-panel border border-lapis-border p-5 hover-lift hover-glow">
          <div className="absolute inset-0 pointer-events-none opacity-5">
            <div className="deco-corner deco-corner--br" style={{ background: 'radial-gradient(circle, var(--color-blood) 0%, transparent 70%)' }} />
          </div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #C0392B22, #C0392B00)', border: '1px solid #C0392B44' }}>
                <ArrowDownRight size={22} color="#C0392B" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-blood">Dépenses</p>
                <p className="font-display text-2xl font-light text-pharaoh">{money(totalExpense)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] text-pharaoh-subtle">Ce mois</p>
              <p className="font-mono text-sm text-blood">{money(monthFlows.expense)}</p>
              <p className="font-mono text-[10px] text-pharaoh-muted">{savingsRate}% taux épargne</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-panel border border-lapis-border p-5 hover-lift hover-glow">
          <div className="absolute inset-0 pointer-events-none opacity-5">
            <div className="deco-corner deco-corner--tl" style={{ background: 'radial-gradient(circle, var(--color-emerald) 0%, transparent 70%)' }} />
          </div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #1E8A4922, #1E8A4900)', border: '1px solid #1E8A4944' }}>
                <TrendingUp size={22} color="#1E8A49" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-emerald">Flux Net</p>
                <p className="font-display text-2xl font-light" style={{ color: netCashFlow >= 0 ? '#1E8A49' : '#C0392B' }}>
                  {netCashFlow >= 0 ? '+' : ''}{money(netCashFlow)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] text-pharaoh-subtle">Revenus - Dépenses</p>
              <p className="font-mono text-sm text-pharaoh-muted">{money(totalSavedInGoals)} en épargne</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-panel-gold border-gold/50 p-5 hover-lift shadow-gold">
          <div className="absolute inset-0 pointer-events-none opacity-5">
            <div className="deco-corner deco-corner--br" style={{ background: 'radial-gradient(circle, var(--color-gold) 0%, transparent 70%)' }} />
          </div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-obsidian border border-gold/30">
                <PiggyBank size={22} color="var(--color-gold)" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-gold-bright">Réserves</p>
                <p className="font-display text-2xl font-light text-gold-bright">{money(totalSavedInGoals)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] text-pharaoh-subtle">{savingsGoals.length} objectifs</p>
              <p className="font-mono text-sm text-gold">Objectifs actifs</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 6-Month Flow Trend — full-width professional area chart */}
      <motion.div
        className="bg-panel border border-lapis-border rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-panel-gold">
              <BarChart3 size={20} color="var(--color-gold)" />
            </div>
            <div>
              <h3 className="font-display text-xl font-light text-pharaoh">Flux des 6 Derniers Mois</h3>
              <p className="text-pharaoh-subtle text-sm">Revenus, dépenses et solde net — vue en devise affichée</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono">
            <span className="flex items-center gap-1.5 text-gold-bright"><span className="w-2 h-2 rounded-full bg-[#D4A81E]" /> Revenus</span>
            <span className="flex items-center gap-1.5 text-blood"><span className="w-2 h-2 rounded-full bg-[#C0392B]" /> Dépenses</span>
            <span className="flex items-center gap-1.5 text-emerald"><span className="w-2 h-2 rounded-full bg-[#1E8A49]" /> Net</span>
          </div>
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlySeriesDisplay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4A81E" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#D4A81E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C0392B" stopOpacity={0.30} />
                  <stop offset="100%" stopColor="#C0392B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E8A49" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#1E8A49" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,168,30,0.06)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                axisLine={false} tickLine={false}
                tickFormatter={(v: number) => formatCompact(v)}
                width={54}
              />
              <Tooltip content={<TrendTooltip currencyCode={displayCurrency} />} />
              <Area type="monotone" dataKey="Revenus" stroke="#D4A81E" strokeWidth={2} fill="url(#gradIncome)" animationDuration={900} />
              <Area type="monotone" dataKey="Dépenses" stroke="#C0392B" strokeWidth={2} fill="url(#gradExpense)" animationDuration={1100} />
              <Area type="monotone" dataKey="Net" stroke="#1E8A49" strokeWidth={2} fill="url(#gradNet)" animationDuration={1300} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Charts Row */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Bar Chart: Allocation vs Spent */}
        <div className="bg-panel border border-lapis-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-panel-gold">
                <Layers size={20} color="var(--color-gold)" />
              </div>
              <div>
                <h3 className="font-display text-xl font-light text-pharaoh">Allocation vs Dépenses</h3>
                <p className="text-pharaoh-subtle text-sm">Par enveloppe budgétaire</p>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataByBucket} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,168,30,0.05)" vertical={false} />
                <XAxis
                  type="number"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  axisLine={false} tickLine={false} domain={['dataMin', 'dataMax']}
                />
                <YAxis
                  type="category" dataKey="name" width={100}
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 12, fontFamily: 'var(--font-sans)' }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Allocation" name="Alloué" radius={[0, 4, 4, 0]} barSize={20} maxBarSize={24} fill="rgba(212,168,30,0.2)" stroke="var(--color-gold)" strokeWidth={1} strokeDasharray="4 4" />
                <Bar dataKey="Spent" name="Dépensé" radius={[0, 4, 4, 0]} barSize={20} maxBarSize={24}>
                  {chartDataByBucket.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Expense Distribution */}
        <div className="bg-panel border border-lapis-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-panel-gold">
                <PieIcon size={20} color="var(--color-gold)" />
              </div>
              <div>
                <h3 className="font-display text-xl font-light text-pharaoh">Répartition des Dépenses</h3>
                <p className="text-pharaoh-subtle text-sm">Flux sortants par catégorie</p>
              </div>
            </div>
          </div>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  paddingAngle={2} dataKey="value" nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  stroke="var(--color-obsidian)" strokeWidth={2}
                >
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <motion.div
                          className="bg-panel border border-lapis-border p-3 rounded-xl shadow-card-hover z-50"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <p className="font-display text-sm font-light text-pharaoh">{data.name}</p>
                          <div className="flex justify-between text-xs font-mono mt-1">
                            <span className="text-pharaoh-subtle">Montant</span>
                            <span className="text-gold-bright">{money(data.value)}</span>
                          </div>
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-pharaoh-subtle">Part</span>
                            <span className="text-pharaoh">{((data.value / pieData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%</span>
                          </div>
                        </motion.div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Envelope Management — allocation editing (previously injected but unused) */}
      <motion.div
        className="bg-panel border border-lapis-border rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-panel-gold">
            <Layers size={20} color="var(--color-gold)" />
          </div>
          <div>
            <h3 className="font-display text-xl font-light text-pharaoh">Gestion des Enveloppes</h3>
            <p className="text-pharaoh-subtle text-sm">Ajustez les plafonds mensuels — la pression de dépense est classée automatiquement</p>
          </div>
        </div>
        <div className="space-y-3 mt-5">
          {bucketHealth.map((b) => {
            const over = b.remaining < 0;
            const warn = !over && b.usedPct >= 80;
            const Icon = BucketIconMap[b.bucket as string] || Wallet;
            return (
              <div key={b.bucket} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-obsidian border border-lapis-border/60">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center" style={{ background: `${b.color}22`, border: `1px solid ${b.color}44` }}>
                    <Icon size={17} style={{ color: b.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-sm text-pharaoh truncate">{b.label}</p>
                    <p className={`text-[10px] font-mono ${over ? 'text-blood' : warn ? 'text-gold-bright' : 'text-pharaoh-subtle'}`}>
                      {money(b.spent)} / {money(b.allocated)} · {b.usedPct}%{over && ' — dépassé'}
                    </p>
                  </div>
                </div>
                <div className="flex-1 h-1.5 bg-lapis-border/40 rounded-full overflow-hidden min-w-[80px]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: over ? '#C0392B' : b.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, b.usedPct)}%` }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <label className="flex items-center gap-2 text-[10px] font-mono text-pharaoh-subtle whitespace-nowrap">
                  Plafond
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={allocDrafts[b.bucket] ?? ''}
                    placeholder={String(Math.round(convertFromLedger(b.allocated)))}
                    onChange={(e) => setAllocDrafts((prev) => ({ ...prev, [b.bucket]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitAllocation(b.bucket);
                    }}
                    onBlur={() => {
                      // Commit only when a value was typed; untouched rows stay read-only.
                      if (allocDrafts[b.bucket] != null) commitAllocation(b.bucket);
                    }}
                    aria-label={`Plafond mensuel ${b.label}`}
                    className="w-28 px-2 py-1.5 bg-panel border border-lapis-border rounded-lg text-pharaoh text-xs font-mono tabular-nums focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                  />
                </label>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Savings Goals */}
      {savingsGoals.length > 0 && (
        <motion.div
          className="bg-panel border border-lapis-border rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-panel-gold">
                <ShieldCheck size={20} color="var(--color-gold)" />
              </div>
              <div>
                <h3 className="font-display text-xl font-light text-pharaoh">Objectifs d'Épargne</h3>
                <p className="text-pharaoh-subtle text-sm">{savingsGoals.length} objectifs actifs</p>
              </div>
            </div>
            <button
              onClick={() => { setEditingSavingsGoal(null); setShowSavingsModal(true); }}
              className="btn-press flex items-center gap-2 px-3 py-2 rounded-xl bg-panel-gold text-gold-bright border-gold/50 font-mono text-xs tracking-wide hover:shadow-gold"
            >
              <Plus size={16} />
              <span>Nouvel Objectif</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savingsGoals.map((goal) => {
              const bucketInfo = getBucketInfo(goal.bucket);
              const Icon = bucketInfo.icon;
              const progress = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
              const isComplete = goal.currentAmount >= goal.targetAmount;

              return (
                <motion.div
                  key={goal.id}
                  className="relative overflow-hidden rounded-xl bg-panel border border-lapis-border p-4 hover-lift"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="absolute inset-0 pointer-events-none opacity-5">
                    <div className="deco-corner deco-corner--tl" style={{ background: `radial-gradient(circle, ${bucketInfo.color} 0%, transparent 70%)` }} />
                  </div>
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl" style={{ background: `${bucketInfo.color}22`, border: `1px solid ${bucketInfo.color}44` }}>
                          <Icon size={18} style={{ color: bucketInfo.color }} />
                        </div>
                        <h4 className="font-display text-base font-light text-pharaoh truncate">{goal.title}</h4>
                      </div>
                      {isComplete && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald/20 text-emerald border border-emerald/40">
                          Complété
                        </span>
                      )}
                    </div>
                    <div className="h-2 bg-obsidian rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          width: `${progress}%`,
                          background: isComplete
                            ? 'linear-gradient(90deg, #1E8A49, #1E8A49CC)'
                            : `linear-gradient(90deg, ${bucketInfo.color}, ${bucketInfo.color}aa)`,
                          boxShadow: isComplete ? '0 0 8px rgba(30,138,73,0.6)' : `0 0 8px ${bucketInfo.color}88`,
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-pharaoh-subtle">
                        {money(goal.currentAmount)} / {money(goal.targetAmount)}
                      </span>
                      <span className="text-gold-bright">{Math.round(progress)}%</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingSavingsGoal(goal);
                          setGoalTitle(goal.title);
                          setGoalTarget(goal.targetAmount.toString());
                          setGoalCurrent(goal.currentAmount.toString());
                          setGoalBucket(goal.bucket);
                          setGoalTargetDate(goal.targetDate || '');
                          setShowSavingsModal(true);
                        }}
                        className="btn-press flex-1 py-2 px-3 rounded-xl text-sm font-medium bg-panel-gold text-gold-bright border-gold/50 hover:shadow-gold"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => setPendingDeleteGoalId(goal.id)}
                        className="btn-press flex-1 py-2 px-3 rounded-xl text-sm font-medium bg-panel text-pharaoh-muted hover:bg-panel-hover hover:text-blood border-lapis-border transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Transactions List */}
      <motion.div
        className="bg-panel border border-lapis-border rounded-2xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="p-4 border-b border-lapis-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-panel-gold">
              <ListMusic size={20} color="var(--color-gold)" />
            </div>
            <h3 className="font-display text-xl font-light text-pharaoh">Historique des Transactions</h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-pharaoh-subtle" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-64 pl-10 pr-4 py-2 bg-obsidian border border-lapis-border rounded-xl text-pharaoh text-sm font-mono placeholder-pharaoh-subtle focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
              className="px-3 py-2 bg-obsidian border border-lapis-border rounded-xl text-pharaoh text-sm font-mono appearance-none pr-8 cursor-pointer focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
            >
              <option value="all">Tous</option>
              <option value="income">Revenus</option>
              <option value="expense">Dépenses</option>
            </select>
            <select
              value={filterBucket}
              onChange={(e) => setFilterBucket(e.target.value)}
              className="px-3 py-2 bg-obsidian border border-lapis-border rounded-xl text-pharaoh text-sm font-mono appearance-none pr-8 cursor-pointer focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
            >
              <option value="all">Toutes enveloppes</option>
              {budgetBuckets.map((b) => (
                <option key={b.bucket} value={b.bucket}>{b.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-lapis-border text-[10px] font-mono uppercase tracking-wider text-pharaoh-subtle">
                <th className="p-3">Date</th>
                <th className="p-3">Titre</th>
                <th className="p-3">Enveloppe</th>
                <th className="p-3">Type</th>
                <th className="p-3 text-right">Montant</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="p-3 rounded-2xl bg-panel-gold">
                        <Wallet size={24} color="var(--color-gold)" />
                      </div>
                      <p className="font-display text-lg font-light text-pharaoh">
                        {transactions.length === 0 ? 'Aucune transaction enregistrée' : 'Aucune transaction ne correspond aux filtres'}
                      </p>
                      <p className="text-xs text-pharaoh-subtle max-w-xs">
                        {transactions.length === 0
                          ? 'Enregistrez vos premiers revenus et dépenses pour activer les graphiques et enveloppes.'
                          : 'Essayez de modifier la recherche ou de réinitialiser les filtres ci-dessus.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const bucketInfo = getBucketInfo(tx.bucket);
                  const Icon = bucketInfo.icon;
                  const isIncome = tx.type === 'income';

                  return (
                    <tr key={tx.id} className="border-b border-lapis-border/50 hover:bg-panel-hover transition-colors">
                      <td className="p-3 text-sm font-mono text-pharaoh-muted whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
                            background: `${bucketInfo.color}22`, border: `1px solid ${bucketInfo.color}44`
                          }}>
                            <Icon size={16} style={{ color: bucketInfo.color }} />
                          </div>
                          <div>
                            <p className="font-display text-sm text-pharaoh truncate max-w-xs">{tx.title}</p>
                            {tx.sourceOrVendor && (
                              <p className="text-[10px] text-pharaoh-subtle truncate max-w-xs">{tx.sourceOrVendor}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium" style={{
                          background: `${bucketInfo.color}22`, color: bucketInfo.color, border: `1px solid ${bucketInfo.color}44`
                        }}>
                          {bucketInfo.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${isIncome ? 'bg-emerald/20 text-emerald border border-emerald/40' : 'bg-blood/20 text-blood border-blood/40'}`}>
                          {isIncome ? 'Revenu' : 'Dépense'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums" style={{ color: isIncome ? '#1E8A49' : '#C0392B' }}>
                        {isIncome ? '+' : '-'}{money(tx.amount)}
                        {tx.currency && tx.currency !== BASE_CURRENCY && (
                          <span className="block text-[10px] font-mono text-pharaoh-subtle" title="Montant d'origine">
                            saisie : {formatInCurrency(tx.originalAmount ?? tx.amount, tx.currency)}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setPendingDeleteTxId(tx.id)}
                          className="btn-press p-2 rounded-lg text-pharaoh-subtle hover:text-blood hover:bg-blood/10 transition-all"
                          title="Supprimer"
                          aria-label={`Supprimer la transaction ${tx.title}`}
                        >
                          <Trash size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Transaction Modal */}
      <AnimatePresence>
        {showTransactionModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTransactionModal(false)}
          >
            <motion.div
              className="w-full max-w-md bg-panel border border-lapis-border rounded-2xl p-6 shadow-card-hover"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl font-light text-pharaoh">Nouvelle Transaction</h3>
                <button onClick={() => setShowTransactionModal(false)} className="btn-press p-2 rounded-lg text-pharaoh-subtle hover:text-pharaoh hover:bg-panel-hover">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateTransaction} className="space-y-4">
                {/* Type-first segmented control — drives the rest of the form */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-obsidian border border-lapis-border rounded-xl">
                  {(['expense', 'income'] as const).map((t) => {
                    const active = txType === t;
                    const isInc = t === 'income';
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleTxTypeChange(t)}
                        className={`btn-press flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-mono uppercase tracking-wide transition-all ${
                          active
                            ? isInc
                              ? 'bg-emerald/20 text-emerald border border-emerald/50'
                              : 'bg-blood/20 text-blood border border-blood/50'
                            : 'text-pharaoh-subtle hover:text-pharaoh'
                        }`}
                      >
                        {isInc ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {isInc ? 'Revenu' : 'Dépense'}
                      </button>
                    );
                  })}
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-pharaoh-subtle mb-1">Titre</label>
                  <input
                    type="text"
                    value={txTitle}
                    onChange={(e) => setTxTitle(e.target.value)}
                    placeholder={txType === 'income' ? 'ex: Salaire, Vente, Don reçu...' : 'ex: Courses, Abonnement, Transport...'}
                    className="w-full px-4 py-3 bg-obsidian border border-lapis-border rounded-xl text-pharaoh text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-pharaoh-subtle mb-1">Montant</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 min-w-0 px-4 py-3 bg-obsidian border border-lapis-border rounded-xl text-pharaoh text-sm font-mono tabular-nums focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                      required
                    />
                    <select
                      value={txCurrency}
                      onChange={(e) => setTxCurrency(e.target.value)}
                      aria-label="Devise de saisie"
                      className="w-28 px-2 py-3 bg-obsidian border border-lapis-border rounded-xl text-pharaoh text-sm font-mono cursor-pointer focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                    >
                      {Object.values(CURRENCIES).map((c) => (
                        <option key={c.code} value={c.code}>{c.code}</option>
                      ))}
                    </select>
                  </div>
                  {/* Live conversion preview — updates as you type or switch currency */}
                  {txCurrency !== BASE_CURRENCY && parseFloat(txAmount) > 0 && (
                    <p className="mt-1.5 text-[11px] font-mono text-gold-bright/90">
                      ≈ {formatInCurrency(fx.convert(parseFloat(txAmount), txCurrency, BASE_CURRENCY), BASE_CURRENCY)}{' '}
                      enregistré dans le registre · taux {fx.snapshot.status === 'fallback' ? 'secours' : 'réels'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-pharaoh-subtle mb-1">
                    {txType === 'income' ? 'Compte de réception' : 'Enveloppe budgétaire'}
                  </label>
                  <select
                    value={txBucket}
                    onChange={(e) => setTxBucket(e.target.value as MoneyFlowBucket)}
                    className={`w-full px-4 py-3 bg-obsidian border rounded-xl text-pharaoh text-sm focus:outline-none focus:ring-1 ${
                      txType === 'income'
                        ? 'border-emerald/40 focus:border-emerald focus:ring-emerald/50'
                        : 'border-lapis-border focus:border-gold focus:ring-gold/50'
                    }`}
                  >
                    {(txType === 'income'
                      ? [...budgetBuckets].sort((a, b) =>
                          a.bucket === 'savings_investment' ? -1 : b.bucket === 'savings_investment' ? 1 : 0)
                      : budgetBuckets
                    ).map((b) => (
                      <option key={b.bucket} value={b.bucket}>{b.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-pharaoh-subtle mb-1">
                    {txType === 'income' ? 'Source du revenu' : 'Fournisseur'}
                  </label>
                  <input
                    type="text"
                    value={txSource}
                    onChange={(e) => setTxSource(e.target.value)}
                    placeholder="ex: Employeur, Supermarché, Netflix..."
                    className="w-full px-4 py-3 bg-obsidian border border-lapis-border rounded-xl text-pharaoh text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-pharaoh-subtle mb-1">Date</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-4 py-3 bg-obsidian border border-lapis-border rounded-xl text-pharaoh text-sm font-mono focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-pharaoh-subtle mb-1">Notes</label>
                  <textarea
                    value={txNotes}
                    onChange={(e) => setTxNotes(e.target.value)}
                    rows={3}
                    placeholder="Notes optionnelles..."
                    className="w-full px-4 py-3 bg-obsidian border border-lapis-border rounded-xl text-pharaoh text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50 resize-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={txIsRecurring}
                    onChange={(e) => setTxIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded-sm accent-gold bg-obsidian border border-lapis-border cursor-pointer focus:ring-1 focus:ring-gold/50"
                  />
                  <label htmlFor="recurring" className="text-sm text-pharaoh">Récurrente (mensuelle)</label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTransactionModal(false)}
                    className="btn-press flex-1 py-3 px-4 rounded-xl text-sm font-medium bg-panel text-pharaoh border-lapis-border hover:bg-panel-hover"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn-press flex-1 py-3 px-4 rounded-xl text-sm font-medium bg-panel-gold text-gold-bright border-gold/50 hover:shadow-gold"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Savings Goal Modal */}
      <AnimatePresence>
        {showSavingsModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowSavingsModal(false); setEditingSavingsGoal(null); }}
          >
            <motion.div
              className="w-full max-w-md bg-panel border border-lapis-border rounded-2xl p-6 shadow-card-hover"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl font-light text-pharaoh">{editingSavingsGoal ? 'Modifier Objectif' : 'Nouvel Objectif d\'Épargne'}</h3>
                <button onClick={() => { setShowSavingsModal(false); setEditingSavingsGoal(null); }} className="btn-press p-2 rounded-lg text-pharaoh-subtle hover:text-pharaoh hover:bg-panel-hover">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveSavingsGoal} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-pharaoh-subtle mb-1">Titre</label>
                  <input
                    type="text"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="ex: Fonds d'urgence, Nouveau PC, Voyage..."
                    className="w-full px-4 py-3 bg-obsidian border border-lapis-border rounded-xl text-pharaoh text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-pharaoh-subtle mb-1">Objectif</label>
                    <input
                      type="number" step="0.01" min="0"
                      value={goalTarget}
                      onChange={(e) => setGoalTarget(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-obsidian border border-lapis-border rounded-xl text-pharaoh text-sm font-mono tabular-nums focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-pharaoh-subtle mb-1">Actuel</label>
                    <input
                      type="number" step="0.01" min="0"
                      value={goalCurrent}
                      onChange={(e) => setGoalCurrent(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-obsidian border border-lapis-border rounded-xl text-pharaoh text-sm font-mono tabular-nums focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-pharaoh-subtle mb-1">Enveloppe liée</label>
                  <select
                    value={goalBucket}
                    onChange={(e) => setGoalBucket(e.target.value as MoneyFlowBucket)}
                    className="w-full px-4 py-3 bg-obsidian border border-lapis-border rounded-xl text-pharaoh text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                  >
                    {budgetBuckets.map((b) => (
                      <option key={b.bucket} value={b.bucket}>{b.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-pharaoh-subtle mb-1">Date cible (optionnel)</label>
                  <input
                    type="date"
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="w-full px-4 py-3 bg-obsidian border border-lapis-border rounded-xl text-pharaoh text-sm font-mono focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowSavingsModal(false); setEditingSavingsGoal(null); }}
                    className="btn-press flex-1 py-3 px-4 rounded-xl text-sm font-medium bg-panel text-pharaoh border-lapis-border hover:bg-panel-hover"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn-press flex-1 py-3 px-4 rounded-xl text-sm font-medium bg-panel-gold text-gold-bright border-gold/50 hover:shadow-gold"
                  >
                    {editingSavingsGoal ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction delete confirmation (#3 UX audit) */}
      <ConfirmDialog
        isOpen={pendingDeleteTx != null}
        title="Supprimer cette transaction ?"
        message="Cette transaction sera définitivement retirée de l'historique — les totaux, enveloppes et taux d'épargne seront recalculés immédiatement."
        details={pendingDeleteTx ? `${pendingDeleteTx.title} — ${money(pendingDeleteTx.amount)}` : undefined}
        confirmLabel="Supprimer"
        cancelLabel="Conserver"
        onConfirm={() => {
          if (pendingDeleteTxId) onDeleteTransaction(pendingDeleteTxId);
          setPendingDeleteTxId(null);
        }}
        onCancel={() => setPendingDeleteTxId(null)}
      />

      {/* Savings goal delete confirmation (same guard as transactions) */}
      <ConfirmDialog
        isOpen={pendingDeleteGoal != null}
        title="Supprimer cet objectif d'épargne ?"
        message="L'objectif et sa progression seront définitivement supprimés — les transactions liées restent dans l'historique."
        details={pendingDeleteGoal ? `${pendingDeleteGoal.title} — ${money(pendingDeleteGoal.currentAmount)} épargnés` : undefined}
        confirmLabel="Supprimer"
        cancelLabel="Conserver"
        onConfirm={() => {
          if (pendingDeleteGoalId) onDeleteSavingsGoal(pendingDeleteGoalId);
          setPendingDeleteGoalId(null);
        }}
        onCancel={() => setPendingDeleteGoalId(null)}
      />
    </div>
  );
};
