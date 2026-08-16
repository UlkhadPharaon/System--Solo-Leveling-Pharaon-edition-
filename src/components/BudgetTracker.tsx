import React, { useState } from 'react';
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
  PiggyBank, Layers, ChevronDown, ChevronUp, Eye, EyeOff, X, Search, ListMusic
} from './ui/PharaohIcons';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmDialog } from './ui/ConfirmDialog';

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

const BucketIconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  bangre_neo_tech: Code,
  cinema_production: Film,
  school_education: GraduationCap,
  savings_investment: ShieldCheck,
  living_essentials: ShoppingBag,
  personal_lifestyle: ShoppingBag,
};

const BucketColorMap: Record<string, string> = {
  bangre_neo_tech: '#8b5cf6',
  cinema_production: '#f59e0b',
  school_education: '#06b6d4',
  savings_investment: '#10b981',
  living_essentials: '#3b82f6',
  personal_lifestyle: '#6366f1',
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
  const [currencySymbol, setCurrencySymbol] = useState<string>('FCFA');
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

  const [txTitle, setTxTitle] = useState<string>('');
  const [txAmount, setTxAmount] = useState<string>('');
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

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netCashFlow = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;
  const totalSavedInGoals = savingsGoals.reduce((acc, g) => acc + g.currentAmount, 0);

  const getSpentByBucket = (bucket: MoneyFlowBucket): number => {
    return transactions.filter((t) => t.type === 'expense' && t.bucket === bucket).reduce((acc, t) => acc + t.amount, 0);
  };

  const getBucketInfo = (bucket: MoneyFlowBucket) => {
    if (typeof bucket === 'string' && bucket.startsWith('domain:')) {
      const goal = budgetBuckets.find((b) => b.bucket === bucket);
      return { label: goal?.label || 'Enveloppe', icon: Wallet, color: goal?.color || '#06b6d4' };
    }
    return {
      label: budgetBuckets.find((b) => b.bucket === bucket)?.label || bucket,
      icon: BucketIconMap[bucket] || Wallet,
      color: BucketColorMap[bucket] || budgetBuckets.find((b) => b.bucket === bucket)?.color || '#06b6d4',
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

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle || !txAmount) return;
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: txTitle,
      amount: parseFloat(txAmount),
      type: txType,
      bucket: txBucket,
      sourceOrVendor: txSource || 'Source Générale',
      date: txDate || new Date().toISOString().split('T')[0],
      isRecurring: txIsRecurring,
      notes: txNotes,
      createdAt: new Date().toISOString(),
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

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
    return `${formatted} ${currencySymbol}`;
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
              <span className="text-gold-bright">{formatCurrency(data.Allocation)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-pharaoh-subtle">Dépensé</span>
              <span className="text-blood">{formatCurrency(data.Spent)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-lapis-border/50">
              <span className="text-pharaoh-subtle">Restant</span>
              <span className={data.Allocation - data.Spent >= 0 ? 'text-emerald-400' : 'text-blood'}>
                {formatCurrency(data.Allocation - data.Spent)}
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
            <div className="flex items-center gap-1 bg-panel border border-lapis-border p-1 rounded-xl text-xs font-mono">
              {['FCFA', '$', '€', '£'].map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrencySymbol(curr)}
                  className={`px-2.5 py-1 rounded-lg uppercase transition-all ${
                    currencySymbol === curr
                      ? 'bg-panel-gold text-gold-bright border-gold/50 font-bold'
                      : 'text-pharaoh-muted hover:text-pharaoh'
                  }`}
                >
                  {curr}
                </button>
              ))}
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
                <p className="font-display text-2xl font-light text-pharaoh">{formatCurrency(totalIncome)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] text-pharaoh-subtle">Ce mois</p>
              <p className="font-mono text-sm text-emerald-400">+{savingsRate}% taux épargne</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-panel border border-lapis-border p-5 hover-lift hover-glow">
          <div className="absolute inset-0 pointer-events-none opacity-5">
            <div className="deco-corner deco-corner--br" style={{ background: 'radial-gradient(circle, var(--color-blood) 0%, transparent 70%)' }} />
          </div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #ef444422, #ef444400)', border: '1px solid #ef444444' }}>
                <ArrowDownRight size={22} color="#ef4444" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-blood">Dépenses</p>
                <p className="font-display text-2xl font-light text-pharaoh">{formatCurrency(totalExpense)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] text-pharaoh-subtle">Ce mois</p>
              <p className="font-mono text-sm text-pharaoh-muted">{transactions.filter(t => t.type === 'expense').length} transactions</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-panel border border-lapis-border p-5 hover-lift hover-glow">
          <div className="absolute inset-0 pointer-events-none opacity-5">
            <div className="deco-corner deco-corner--tl" style={{ background: 'radial-gradient(circle, var(--color-emerald) 0%, transparent 70%)' }} />
          </div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #10b98122, #10b98100)', border: '1px solid #10b98144' }}>
                <TrendingUp size={22} color="#10b981" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">Flux Net</p>
                <p className="font-display text-2xl font-light" style={{ color: netCashFlow >= 0 ? '#10b981' : '#ef4444' }}>
                  {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] text-pharaoh-subtle">Revenus - Dépenses</p>
              <p className="font-mono text-sm text-pharaoh-muted">{formatCurrency(totalSavedInGoals)} en épargne</p>
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
                <p className="font-display text-2xl font-light text-gold-bright">{formatCurrency(totalSavedInGoals)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] text-pharaoh-subtle">{savingsGoals.length} objectifs</p>
              <p className="font-mono text-sm text-gold">Objectifs actifs</p>
            </div>
          </div>
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
                <Pie size={20} color="var(--color-gold)" />
              </div>
              <div>
                <h3 className="font-display text-xl font-light text-pharrow">Répartition des Dépenses</h3>
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
                            <span className="text-gold-bright">{formatCurrency(data.value)}</span>
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
                        <div className="p-2 rounded-lg" style={{ background: `${bucketInfo.color}22`, border: `1px solid ${bucketInfo.color}44` }}>
                          <Icon size={18} style={{ color: bucketInfo.color }} />
                        </div>
                        <h4 className="font-display text-base font-light text-pharaoh truncate">{goal.title}</h4>
                      </div>
                      {isComplete && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          Complété
                        </span>
                      )}
                    </div>
                    <div className="h-2 bg-obsidian rounded-full overflow-hidden" style={{ borderColor: 'rgba(212,168,30,0.1)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          width: `${progress}%`,
                          background: isComplete
                            ? 'linear-gradient(90deg, #10b981, #10b981aa)'
                            : `linear-gradient(90deg, ${bucketInfo.color}, ${bucketInfo.color}aa)`,
                          boxShadow: isComplete ? '0 0 8px rgba(16,185,129,0.6)' : `0 0 8px ${bucketInfo.color}88`,
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-pharaoh-subtle">
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
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
                        onClick={() => onDeleteSavingsGoal(goal.id)}
                        className="btn-press flex-1 py-2 px-3 rounded-xl text-sm font-medium bg-panel text-pharaoh-muted hover:bg-panel-hover border-lapis-border"
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
                  <td colSpan={6} className="px-4 py-12 text-center text-pharaoh-subtle">
                    {transactions.length === 0 ? 'Aucune transaction enregistrée' : 'Aucune transaction ne correspond aux filtres'}
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
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
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
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${isIncome ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-blood/20 text-blood border-blood/40'}`}>
                          {isIncome ? 'Revenu' : 'Dépense'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums" style={{ color: isIncome ? '#10b981' : '#ef4444' }}>
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
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
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-pharaoh-subtle mb-1">Titre</label>
                  <input
                    type="text"
                    value={txTitle}
                    onChange={(e) => setTxTitle(e.target.value)}
                    placeholder="ex: Salaire, Courses, Abonnement..."
                    className="w-full px-4 py-3 bg-obsidian border border-lapis-border rounded-xl text-pharaoh text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-pharaoh-subtle mb-1">Montant</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-obsidian border border-lapis-border rounded-xl text-pharaoh text-sm font-mono tabular-nums focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-pharaoh-subtle mb-1">Type</label>
                    <select
                      value={txType}
                      onChange={(e) => setTxType(e.target.value as TransactionType)}
                      className="w-full px-4 py-3 bg-obsidian border border-lapis-border rounded-xl text-pharaoh text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                    >
                      <option value="expense">Dépense</option>
                      <option value="income">Revenu</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-pharaoh-subtle mb-1">Enveloppe</label>
                  <select
                    value={txBucket}
                    onChange={(e) => setTxBucket(e.target.value as MoneyFlowBucket)}
                    className="w-full px-4 py-3 bg-obsidian border border-lapis-border rounded-xl text-pharaoh text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                  >
                    {budgetBuckets.map((b) => (
                      <option key={b.bucket} value={b.bucket}>{b.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-pharaoh-subtle mb-1">Source / Fournisseur</label>
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
                    className="w-4 h-4 rounded border-lapis-border bg-obsidian text-gold focus:ring-gold/50 appearance-none cursor-pointer"
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
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
        details={pendingDeleteTx ? `${pendingDeleteTx.title} — ${formatCurrency(pendingDeleteTx.amount)}` : undefined}
        confirmLabel="Supprimer"
        cancelLabel="Conserver"
        onConfirm={() => {
          if (pendingDeleteTxId) onDeleteTransaction(pendingDeleteTxId);
          setPendingDeleteTxId(null);
        }}
        onCancel={() => setPendingDeleteTxId(null)}
      />
    </div>
  );
};
