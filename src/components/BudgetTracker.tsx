import React, { useState } from 'react';
import { 
  Transaction, 
  BudgetBucketGoal, 
  SavingsGoal, 
  MoneyFlowBucket, 
  TransactionType 
} from '../types';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart as PieIcon, 
  TrendingUp, 
  Plus, 
  Filter, 
  Trash2, 
  Sparkles, 
  Code, 
  Film, 
  GraduationCap, 
  ShieldCheck, 
  ShoppingBag, 
  Tag, 
  Calendar,
  PiggyBank,
  Layers
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

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

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({
  transactions,
  budgetBuckets,
  savingsGoals,
  onAddTransaction,
  onDeleteTransaction,
  onAddSavingsGoal,
  onUpdateSavingsGoalAmount,
  onDeleteSavingsGoal,
}) => {
  // Currency State
  const [currencySymbol, setCurrencySymbol] = useState<string>('FCFA');

  // Filter States
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterBucket, setFilterBucket] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showTransactionModal, setShowTransactionModal] = useState<boolean>(false);
  const [showSavingsModal, setShowSavingsModal] = useState<boolean>(false);
  const [editingSavingsGoal, setEditingSavingsGoal] = useState<SavingsGoal | null>(null);

  // Form States - New Transaction
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

  // Form States - New Savings Goal
  const [goalTitle, setGoalTitle] = useState<string>('');
  const [goalTarget, setGoalTarget] = useState<string>('');
  const [goalCurrent, setGoalCurrent] = useState<string>('0');
  const [goalBucket, setGoalBucket] = useState<MoneyFlowBucket>(
    (budgetBuckets[1]?.bucket as MoneyFlowBucket) || budgetBuckets[0]?.bucket as MoneyFlowBucket || 'cinema_production'
  );
  // Bucket options come from the actual buckets (domain-driven for onboarding v2
  // users, legacy fixed list otherwise) — never hardcoded labels.
  const bucketOptions = budgetBuckets.map((b) => ({ value: b.bucket as string, label: b.label }));
  const [goalTargetDate, setGoalTargetDate] = useState<string>('');

  // Calculations
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netCashFlow = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;
  const totalSavedInGoals = savingsGoals.reduce((acc, g) => acc + g.currentAmount, 0);

  // Calculate spent per bucket
  const getSpentByBucket = (bucket: MoneyFlowBucket): number => {
    return transactions
      .filter((t) => t.type === 'expense' && t.bucket === bucket)
      .reduce((acc, t) => acc + t.amount, 0);
  };

  // Get bucket label and icon helper
  const getBucketInfo = (bucket: MoneyFlowBucket) => {
    if (typeof bucket === 'string' && bucket.startsWith('domain:')) {
      const goal = budgetBuckets.find((b) => b.bucket === bucket);
      return { label: goal?.label || 'Enveloppe', icon: Wallet, color: goal?.color || '#06b6d4' };
    }
    switch (bucket) {
      case 'bangre_neo_tech':
        return { label: 'Bangre Neo Tech', icon: Code, color: '#8b5cf6' };
      case 'cinema_production':
        return { label: 'Cinéma & Scénarios', icon: Film, color: '#f59e0b' };
      case 'school_education':
        return { label: 'Études Académiques', icon: GraduationCap, color: '#06b6d4' };
      case 'savings_investment':
        return { label: 'Épargne & Réserves', icon: ShieldCheck, color: '#10b981' };
      case 'living_essentials':
      case 'personal_lifestyle':
      default:
        return { label: 'Dépenses Essentielles', icon: ShoppingBag, color: '#3b82f6' };
    }
  };

  // Filtered Transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesBucket = filterBucket === 'all' || t.bucket === filterBucket;
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sourceOrVendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesBucket && matchesSearch;
  });

  // Chart Data Preparation
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

  // Handle Submit New Transaction
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

    // Reset Form
    setTxTitle('');
    setTxAmount('');
    setTxSource('');
    setTxNotes('');
  };

  // Handle Submit New Savings Goal
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

    // Reset Form
    setGoalTitle('');
    setGoalTarget('');
    setGoalCurrent('0');
    setGoalTargetDate('');
  };

  // Handle Submit Edit Savings Goal
  const handleSaveSavingsGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTarget) return;

    if (editingSavingsGoal) {
      // Logic for editing (would need an onUpdateSavingsGoal prop)
      // For now, let's just implement the requested add/delete UI/logic
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
    setGoalTitle('');
    setGoalTarget('');
    setGoalCurrent('0');
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner & Currency Selector */}
      <div className="relative overflow-hidden rounded-xl bg-card border border-soft p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-xl text-[10px] mono tracking-wide font-medium bg-cyan-400/10 text-cyan-400 border border-cyan flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 accent-cyan" />
                Moteur de Capital & Flux Financiers
              </span>
            </div>
            <h2 className="serif text-3xl md:text-4xl font-light italic text-white tracking-tight">
              Hub Budgétaire & Allocation Financière
            </h2>
            <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
              {`Suivez les flux de revenus réels, affectez les allocations de capital à ${budgetBuckets
                .slice(0, 3)
                .map((b) => b.label)
                .join(', ')}, et surveillez vos réserves d'épargne.`}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap self-start md:self-auto">
            {/* Currency Selector */}
            <div className="flex items-center gap-1 bg-cyan-950/40 p-1 rounded-xl border border-soft text-xs mono">
              {['FCFA', '$', '€', '£'].map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrencySymbol(curr)}
                  className={`px-2.5 py-1 rounded-xl uppercase transition-all ${
                    currencySymbol === curr
                      ? 'bg-card text-cyan-400 border border-cyan font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowTransactionModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-card hover:bg-card-hover text-cyan-400 border border-cyan mono text-xs tracking-wide font-medium transition-all"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Enregistrer une Transaction</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monthly Income */}
        <div className="bg-card border border-soft hover:border-cyan/50 rounded-xl p-5 space-y-2 transition-all">
          <div className="flex items-center justify-between">
            <span className="mono text-[10px] tracking-wide font-medium opacity-60">Revenus Mensuels</span>
            <div className="p-2 rounded-xl bg-cyan-950/40 border border-soft text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="serif text-2xl font-light italic text-white">
            {totalIncome.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} {currencySymbol}
          </div>
          <p className="mono text-[10px] text-emerald-400 opacity-90 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Contrats clients & soutien récurrent
          </p>
        </div>

        {/* Total Monthly Expenses */}
        <div className="bg-card border border-soft hover:border-cyan/50 rounded-xl p-5 space-y-2 transition-all">
          <div className="flex items-center justify-between">
            <span className="mono text-[10px] tracking-wide font-medium opacity-60">Dépenses Totales</span>
            <div className="p-2 rounded-xl bg-cyan-950/40 border border-soft text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="serif text-2xl font-light italic text-white">
            {totalExpense.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} {currencySymbol}
          </div>
          <p className="mono text-[10px] opacity-60">
            Sur la tech, le cinéma, les cours & le quotidien
          </p>
        </div>

        {/* Net Flow & Savings Rate */}
        <div className="bg-card border border-soft hover:border-cyan/50 rounded-xl p-5 space-y-2 transition-all">
          <div className="flex items-center justify-between">
            <span className="mono text-[10px] tracking-wide font-medium opacity-60">Flux Net</span>
            <div className="p-2 rounded-xl bg-cyan-950/40 border border-soft text-cyan-400">
              <Sparkles className="w-4 h-4 accent-cyan" />
            </div>
          </div>
          <div className={`serif text-2xl font-light italic ${netCashFlow >= 0 ? 'accent-cyan' : 'text-rose-400'}`}>
            {netCashFlow >= 0 ? '+' : ''}{netCashFlow.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} {currencySymbol}
          </div>
          <p className="mono text-[10px] accent-cyan tracking-wide font-medium">
            {savingsRate}% Taux de Rétention du Capital
          </p>
        </div>

        {/* Total Reserve Funds */}
        <div className="bg-card border border-soft hover:border-cyan/50 rounded-xl p-5 space-y-2 transition-all">
          <div className="flex items-center justify-between">
            <span className="mono text-[10px] tracking-wide font-medium opacity-60">Réserve Totale d'Objectifs</span>
            <div className="p-2 rounded-xl bg-cyan-950/40 border border-soft text-cyan-400">
              <PiggyBank className="w-4 h-4 accent-cyan" />
            </div>
          </div>
          <div className="serif text-2xl font-light italic text-white">
            {totalSavedInGoals.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} {currencySymbol}
          </div>
          <p className="mono text-[10px] opacity-60">
            Épargné pour {savingsGoals.length} objectifs d'équipement & liberté
          </p>
        </div>
      </div>

      {/* Money Flow Visualizer (Sankey-style Pipeline Flow) */}
      <div className="bg-card border border-soft rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-soft pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 accent-cyan" />
              <h3 className="serif text-2xl font-light italic text-white">
                Architecture du Flux de Capital
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visualisation de la répartition des revenus entre tech, cinéma, cours et coffres d'épargne.
            </p>
          </div>

          <div className="mono text-xs accent-cyan bg-cyan-950/40 border border-cyan px-3 py-1.5 rounded-xl">
            Revenus Mensuels Nets : <strong>{totalIncome.toLocaleString('fr-FR')} {currencySymbol}</strong>
          </div>
        </div>

        {/* Flow Pipelines Grid */}
        <div className="space-y-4">
          {budgetBuckets.map((bucket) => {
            const spent = getSpentByBucket(bucket.bucket);
            const allocation = bucket.monthlyAllocation;
            const percentageUsed = Math.min(100, Math.round((spent / allocation) * 100));
            const bucketInfo = getBucketInfo(bucket.bucket);
            const Icon = bucketInfo.icon;

            return (
              <div key={bucket.bucket} className="bg-cyan-950/40 border border-soft rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-black/40 border border-soft" style={{ color: bucket.color }}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="serif text-lg font-light italic text-white">{bucket.label}</h4>
                      <p className="mono text-[10px] opacity-60">{bucket.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="mono text-[10px] uppercase opacity-60 block">Dépenses vs Budget</span>
                      <span className="mono text-xs font-semibold text-white">
                        {spent.toLocaleString('fr-FR')} {currencySymbol} / <span className="accent-cyan">{allocation.toLocaleString('fr-FR')} {currencySymbol}</span>
                      </span>
                    </div>
                    <span className={`mono text-[10px] uppercase px-2 py-0.5 rounded-xl border ${
                      percentageUsed >= 100
                        ? 'bg-rose-950/40 text-rose-300 border-rose-800'
                        : percentageUsed >= 75
                        ? 'bg-amber-950/40 text-amber-300 border-amber-800'
                        : 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                    }`}>
                      {percentageUsed}% utilisé
                    </span>
                  </div>
                </div>

                {/* Editorial Flow Meter */}
                <div className="relative w-full bg-black/40 h-2 rounded-none overflow-hidden border border-soft">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${percentageUsed}%`,
                      backgroundColor: bucket.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Allocation Bar Chart */}
        <div className="bg-card border border-soft rounded-xl p-6 space-y-4">
          <h3 className="serif text-xl font-light italic text-white flex items-center gap-2 border-b border-soft pb-2">
            <PieIcon className="w-5 h-5 accent-cyan" />
            Plafond Budgétaire vs Dépenses Réelles
          </h3>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataByBucket} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} interval={0} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#051428', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}
                  itemStyle={{ color: '#00D4FF', fontSize: '12px', fontFamily: 'JetBrains Mono' }}
                />
                <Bar dataKey="Allocation" fill="#333A48" radius={[0, 0, 0, 0]} name="Plafond Budgétaire" />
                <Bar dataKey="Spent" fill="#00D4FF" radius={[0, 0, 0, 0]} name="Dépenses Réelles" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Expense Distribution Pie Chart */}
        <div className="bg-card border border-soft rounded-xl p-6 space-y-4">
          <h3 className="serif text-xl font-light italic text-white flex items-center gap-2 border-b border-soft pb-2">
            <Tag className="w-5 h-5 accent-cyan" />
            Répartition des Dépenses par Catégorie
          </h3>

          <div className="h-64 w-full flex items-center justify-center pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name.split(' ')[0]}: ${value} ${currencySymbol}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-pie-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#051428', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}
                  itemStyle={{ color: '#E5E7EB', fontSize: '12px', fontFamily: 'JetBrains Mono' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Savings & Equipment Goals Section */}
      <div className="bg-card border border-soft rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-soft pb-4">
          <div>
            <div className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5 accent-cyan" />
              <h3 className="serif text-2xl font-light italic text-white">
                Coffre-Fort d'Équipements & Objectifs Financiers
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Fonds d'épargne ciblés pour les serveurs dédiés Bangre Neo, objectifs cinéma 4K et réserves de liberté.
            </p>
          </div>

          <button
            onClick={() => setShowSavingsModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-950/40 text-cyan-400 border border-cyan mono text-xs uppercase hover:bg-[#222630] transition-all self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Projet d'Épargne</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {savingsGoals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

            return (
              <div key={goal.id} className="bg-cyan-950/40 border border-soft hover:border-cyan/50 rounded-xl p-5 space-y-4 transition-all group">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="mono text-[10px] tracking-wide font-medium text-cyan-400">
                      {goal.bucket.replace('_', ' ')}
                    </span>
                    <h4 className="serif text-xl font-light italic text-white">{goal.title}</h4>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
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
                       className="p-1 hover:text-cyan-400"
                     >
                       <Tag className="w-3 h-3" />
                     </button>
                     <button
                       onClick={() => onDeleteSavingsGoal(goal.id)}
                       className="p-1 hover:text-red-400"
                     >
                       <Trash2 className="w-3 h-3" />
                     </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="serif text-2xl font-light accent-cyan italic">
                      {goal.currentAmount.toLocaleString('fr-FR')} {currencySymbol}
                    </span>
                    <span className="mono text-[10px] opacity-60">
                      Objectif : {goal.targetAmount.toLocaleString('fr-FR')} {currencySymbol}
                    </span>
                  </div>

                  <div className="w-full bg-white/5 h-1.5 overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="mono text-[10px] uppercase opacity-60">{percent}% financé</span>
                    {goal.targetDate && (
                      <span className="mono text-[10px] opacity-50">Cible : {goal.targetDate}</span>
                    )}
                  </div>
                </div>

                {/* Quick Add Funds Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-soft">
                  <span className="mono text-[10px] uppercase opacity-60">Déposer des fonds</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onUpdateSavingsGoalAmount(goal.id, 5000)}
                      className="px-2 py-1 rounded-xl bg-black/40 hover:bg-black/60 text-cyan-400 border border-cyan/40 mono text-[10px]"
                    >
                      +5000 {currencySymbol}
                    </button>
                    <button
                      onClick={() => onUpdateSavingsGoalAmount(goal.id, 10000)}
                      className="px-2 py-1 rounded-xl bg-black/40 hover:bg-black/60 text-cyan-400 border border-cyan/40 mono text-[10px]"
                    >
                      +10000 {currencySymbol}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transactions Ledger Stream */}
      <div className="bg-card border border-soft rounded-xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-soft pb-4">
          <div>
            <h3 className="serif text-2xl font-light italic text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 accent-cyan" />
              Journal & Historique des Transactions
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Détail complet de toutes les sources de revenus et postes de dépenses.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Rechercher fournisseur ou notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-cyan-950/40 border border-soft rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan w-40 sm:w-52"
            />

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-cyan-950/40 border border-soft rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none mono"
            >
              <option value="all">Tous les Types</option>
              <option value="income">Revenus Uniquement</option>
              <option value="expense">Dépenses Uniquement</option>
            </select>

            {/* Bucket Filter */}
            <select
              value={filterBucket}
              onChange={(e) => setFilterBucket(e.target.value)}
              className="bg-cyan-950/40 border border-soft rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none mono"
            >
              <option value="all">Toutes les Catégories</option>
              {bucketOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Transaction Table / List */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Filter className="w-8 h-8 opacity-40 mx-auto" />
              <p className="mono text-xs">Aucune transaction ne correspond à vos critères de recherche.</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const bucketInfo = getBucketInfo(tx.bucket);

              return (
                <div
                  key={tx.id}
                  className="bg-cyan-950/40 border border-soft hover:border-cyan/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl border ${
                      isIncome 
                        ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800' 
                        : 'bg-rose-950/30 text-rose-400 border-rose-800'
                    }`}>
                      {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="serif text-lg font-light italic text-white">{tx.title}</h4>
                        {tx.isRecurring && (
                          <span className="mono text-[9px] uppercase px-1.5 py-0.5 rounded-xl bg-black/40 text-cyan-400 border border-cyan/40">
                            Récurrent
                          </span>
                        )}
                      </div>
                      <p className="mono text-[10px] opacity-60 flex items-center gap-2 mt-0.5">
                        <span>{tx.sourceOrVendor}</span>
                        <span>•</span>
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span className="accent-cyan uppercase">{bucketInfo.label}</span>
                      </p>
                      {tx.notes && (
                        <p className="text-xs text-slate-400 mt-1">{tx.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-soft pt-2 sm:pt-0">
                    <span className={`serif text-2xl font-light italic ${isIncome ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {isIncome ? '+' : '-'}{tx.amount.toLocaleString('fr-FR')} {currencySymbol}
                    </span>

                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="p-1.5 rounded-xl bg-black/30 hover:bg-black/60 text-slate-500 hover:text-rose-400 transition-all"
                      title="Supprimer la transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* New Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#051428] border border-cyan/50 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <h3 className="serif text-2xl font-light italic text-white flex items-center gap-2 border-b border-soft pb-2">
              <Plus className="w-5 h-5 accent-cyan" />
              Enregistrer un Flux Financier / Transaction
            </h3>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`py-2 rounded-xl mono text-xs uppercase border transition-all ${
                    txType === 'income'
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-600 font-bold'
                      : 'bg-cyan-950/40 text-slate-400 border-soft'
                  }`}
                >
                  + Entrée de Revenu
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`py-2 rounded-xl mono text-xs uppercase border transition-all ${
                    txType === 'expense'
                      ? 'bg-rose-950/40 text-rose-400 border-rose-600 font-bold'
                      : 'bg-cyan-950/40 text-slate-400 border-soft'
                  }`}
                >
                  - Sortie de Dépense
                </button>
              </div>

              <div>
                <label className="block mono text-[10px] uppercase opacity-70 mb-1">Titre / Description</label>
                <input
                  type="text"
                  required
                  placeholder="ex : Contrat Conseil Bangre Neo / Location Équipement Caméra"
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mono text-[10px] uppercase opacity-70 mb-1">Montant ({currencySymbol})</label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="0"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan text-xs"
                  />
                </div>

                <div>
                  <label className="block mono text-[10px] uppercase opacity-70 mb-1">Catégorie</label>
                  <select
                    value={txBucket}
                    onChange={(e) => setTxBucket(e.target.value as MoneyFlowBucket)}
                    className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none text-xs mono"
                  >
                    {bucketOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mono text-[10px] uppercase opacity-70 mb-1">Source ou Fournisseur</label>
                  <input
                    type="text"
                    placeholder="ex : Client / Nom du Magasin"
                    value={txSource}
                    onChange={(e) => setTxSource(e.target.value)}
                    className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan text-xs"
                  />
                </div>

                <div>
                  <label className="block mono text-[10px] uppercase opacity-70 mb-1">Date</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan text-xs mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="txRecurring"
                  checked={txIsRecurring}
                  onChange={(e) => setTxIsRecurring(e.target.checked)}
                  className="rounded border-soft text-cyan-400 focus:ring-0 bg-cyan-950/40"
                />
                <label htmlFor="txRecurring" className="mono text-xs text-slate-300">
                  Flux Mensuel Récurrent
                </label>
              </div>

              <div>
                <label className="block mono text-[10px] uppercase opacity-70 mb-1">Notes Additionnelles</label>
                <textarea
                  rows={2}
                  placeholder="Détails du contrat ou remarques..."
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full bg-cyan-950/40 border border-soft rounded-xl p-2 text-xs text-white focus:outline-none focus:border-cyan"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-soft">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="px-4 py-2 rounded-xl bg-cyan-950/40 text-slate-300 mono text-xs uppercase"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-card hover:bg-card-hover text-cyan-400 border border-cyan mono text-xs uppercase"
                >
                  Enregistrer la Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Savings Goal Modal */}
      {showSavingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#051428] border border-cyan/50 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <h3 className="serif text-2xl font-light italic text-white flex items-center gap-2 border-b border-soft pb-2">
              <PiggyBank className="w-5 h-5 accent-cyan" />
              Nouveau Projet d'Épargne / Équipement
            </h3>

            <form onSubmit={handleCreateSavingsGoal} className="space-y-4">
              <div>
                <label className="block mono text-[10px] uppercase opacity-70 mb-1">Titre de l'Objectif</label>
                <input
                  type="text"
                  required
                  placeholder="ex : Objectif Caméra 4K / Serveur Dédié"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mono text-[10px] uppercase opacity-70 mb-1">Montant Cible ({currencySymbol})</label>
                  <input
                    type="number"
                    required
                    placeholder="150000"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan text-xs"
                  />
                </div>

                <div>
                  <label className="block mono text-[10px] uppercase opacity-70 mb-1">Solde Actuel ({currencySymbol})</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={goalCurrent}
                    onChange={(e) => setGoalCurrent(e.target.value)}
                    className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mono text-[10px] uppercase opacity-70 mb-1">Catégorie</label>
                  <select
                    value={goalBucket}
                    onChange={(e) => setGoalBucket(e.target.value as MoneyFlowBucket)}
                    className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none text-xs mono"
                  >
                    {bucketOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mono text-[10px] uppercase opacity-70 mb-1">Date Cible</label>
                  <input
                    type="date"
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan text-xs mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-soft">
                <button
                  type="button"
                  onClick={() => setShowSavingsModal(false)}
                  className="px-4 py-2 rounded-xl bg-cyan-950/40 text-slate-300 mono text-xs uppercase"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-card hover:bg-card-hover text-cyan-400 border border-cyan mono text-xs uppercase"
                >
                  Créer l'Objectif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
