'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Plus,
  HandCoins,
  Search,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronRight,
} from 'lucide-react';
import { useActiveTrip } from '@/components/shared/ActiveTripContext';
import { TripHeader } from '@/components/shared/TripHeader';
import { ExpenseCard } from '@/components/money/ExpenseCard';
import { ExpenseFormModal } from '@/components/money/ExpenseFormModal';
import { SettleUpModal } from '@/components/money/SettleUpModal';
import { EmptyState } from '@/components/shared/EmptyState';
import { ListSkeleton } from '@/components/shared/SkeletonLoader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { formatRupees, formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ExpenseWithDetails, SimplifiedDebt, Category } from '@/types';

import { SmartSettlePanel } from '@/components/money/SmartSettlePanel';

export default function MoneyPage() {
  const { trip, members, currentMember, refreshTrip } = useActiveTrip();

  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [simplifiedDebts, setSimplifiedDebts] = useState<SimplifiedDebt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaidBy, setSelectedPaidBy] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'expenses' | 'debts' | 'balances'>('expenses');
  const [isLoading, setIsLoading] = useState(true);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [selectedDebtForSettle, setSelectedDebtForSettle] = useState<SimplifiedDebt | null>(null);

  const handleOpenSettleForDebt = (debt: SimplifiedDebt) => {
    setSelectedDebtForSettle(debt);
    setIsSettleModalOpen(true);
  };

  const handleOpenGeneralSettle = () => {
    setSelectedDebtForSettle(null);
    setIsSettleModalOpen(true);
  };

  const handleSettleIndividualExpense = (exp: ExpenseWithDetails) => {
    const payeeId = exp.paid_by;
    const mySplit = exp.splits?.find(s => s.member_id === currentMember?.id);
    const amountPaise = mySplit ? mySplit.amount_paise : exp.amount_paise;

    setSelectedDebtForSettle({
      from_member_id: currentMember?.id || (members.find(m => m.id !== payeeId)?.id || members[0]?.id || ''),
      to_member_id: payeeId,
      amount_paise: amountPaise,
    });
    setIsSettleModalOpen(true);
  };

  const fetchMoneyData = useCallback(async () => {
    if (!trip) return;
    try {
      setIsLoading(true);
      const [eRes, sRes, tRes] = await Promise.all([
        fetch(`/api/expenses?trip_id=${trip.id}`),
        fetch(`/api/settlements?trip_id=${trip.id}`),
        fetch(`/api/trips/${trip.slug}`),
      ]);

      if (eRes.ok) setExpenses(await eRes.json());
      if (sRes.ok) {
        const sData = await sRes.json();
        setSimplifiedDebts(sData.simplifiedDebts || []);
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        if (tData.categories?.length > 0) setCategories(tData.categories);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [trip]);

  useEffect(() => { fetchMoneyData(); }, [fetchMoneyData]);

  if (!trip) return <div className="p-5"><ListSkeleton /></div>;

  // Compute per-member balance stats
  const memberBalances = members.map(m => {
    let paid = 0, owed = 0;
    expenses.forEach(e => {
      if (e.paid_by === m.id) paid += e.amount_paise;
      e.splits?.forEach(s => { if (s.member_id === m.id) owed += s.amount_paise; });
    });
    return { member: m, paidPaise: paid, owedPaise: owed, netPaise: paid - owed };
  });

  // Current member stats
  const myBalance = memberBalances.find(b => b.member.id === currentMember?.id);
  const totalSpentPaise = expenses.reduce((a, e) => a + e.amount_paise, 0);
  const netBalancePaise = myBalance?.netPaise ?? 0;

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Expense deleted');
      fetchMoneyData();
      refreshTrip();
    } catch {
      toast.error('Failed to delete expense');
    }
  };

  // Filtered expenses
  const filteredExpenses = expenses.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.paid_by_member?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'all' || e.category_id === selectedCategory;
    const matchPaid = selectedPaidBy === 'all' || e.paid_by === selectedPaidBy;
    return matchSearch && matchCat && matchPaid;
  });

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--background)' }}>
      <TripHeader title="Money" subtitle="Expenses, balances & settlements" />

      <div className="max-w-4xl mx-auto w-full px-4 md:px-6 py-5 space-y-5 pb-nav">

        {/* Hero Balance + Actions */}
        <div className="raised-card p-4 sm:p-5 relative overflow-hidden">
          <div className="flex flex-row items-start justify-between gap-3 mb-4">
            {/* Left: Net Balance details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background: netBalancePaise > 0 ? 'var(--success)' : netBalancePaise < 0 ? 'var(--danger)' : 'var(--text-muted)'
                  }}
                />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] font-mono truncate">
                  {currentMember?.name || 'Your'} Net Balance
                </p>
              </div>
              <div className={cn(
                'text-2xl sm:text-4xl font-extrabold font-outfit tracking-tight truncate',
                netBalancePaise > 0 ? 'text-[var(--success)]' :
                netBalancePaise < 0 ? 'text-[var(--danger)]' :
                'text-[var(--text-primary)]'
              )}>
                {netBalancePaise >= 0 ? '' : '-'}{formatRupees(Math.abs(netBalancePaise))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] sm:text-xs">
                <span className="px-2 py-0.5 rounded-lg bg-[var(--surface-inset)] border border-[var(--border)] font-semibold text-[var(--text-secondary)] whitespace-nowrap">
                  Paid: <strong className="text-[var(--text-primary)]">{formatRupees(myBalance?.paidPaise ?? 0)}</strong>
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-[var(--surface-inset)] border border-[var(--border)] font-semibold text-[var(--text-secondary)] whitespace-nowrap">
                  Share: <strong className="text-[var(--text-primary)]">{formatRupees(myBalance?.owedPaise ?? 0)}</strong>
                </span>
              </div>
            </div>

            {/* Right: Small Top-Right Inset Card for Trip Total */}
            <div
              className="flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-[var(--border)] flex flex-col justify-between"
              style={{
                background: 'var(--surface-inset)',
                boxShadow: 'var(--shadow-inset)'
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] font-mono">
                  Trip Total
                </span>
                <div className="p-0.5 sm:p-1 rounded-md bg-[var(--accent)]/10 text-[var(--accent)]">
                  <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
              </div>
              <div className="text-base sm:text-xl font-extrabold font-outfit" style={{ color: 'var(--accent)' }}>
                {formatRupees(totalSpentPaise)}
              </div>
              <p className="text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)] mt-0.5">
                {expenses.length} total expense{expenses.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              id="money-add-expense-button"
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-bold text-xs transition-all active:scale-95 shadow-md hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)', boxShadow: '0 4px 14px rgba(43,86,255,0.35)' }}
            >
              <Plus className="w-4 h-4" /> Add Expense
            </button>
            <button
              id="money-settle-up-button"
              onClick={handleOpenGeneralSettle}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-bold text-xs transition-all active:scale-95 shadow-md hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}
            >
              <HandCoins className="w-4 h-4" /> Settle via UPI
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface-inset)', boxShadow: 'var(--shadow-inset)' }}>
          {(['expenses', 'debts', 'balances'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2 px-3 rounded-xl text-xs font-semibold capitalize transition-all duration-200',
                activeTab === tab
                  ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-[var(--shadow-card)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              )}
            >
              {tab === 'expenses' ? `Bills (${expenses.length})` :
               tab === 'debts' ? `Debts (${simplifiedDebts.length})` :
               'Balances'}
            </button>
          ))}
        </div>

        {/* Tab: Expenses */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {/* Search + Filters */}
            <div className="raised-card p-3 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full inset-field pl-9 pr-3 py-2 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedPaidBy}
                  onChange={e => setSelectedPaidBy(e.target.value)}
                  className="inset-field px-2.5 py-2 text-xs flex-1 sm:flex-none"
                >
                  <option value="all">All payers</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <a
                  href={`/api/export?trip_id=${trip.id}&format=csv`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-inset)] border border-[var(--border)] transition-colors"
                  title="Export CSV"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--success)]" />
                  <span className="hidden sm:inline">CSV</span>
                </a>
              </div>
            </div>

            {/* Category pill filters */}
            {categories.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0',
                    selectedCategory === 'all'
                      ? 'text-white font-bold'
                      : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border)]'
                  )}
                  style={selectedCategory === 'all' ? { background: 'var(--accent)' } : {}}
                >
                  All ({expenses.length})
                </button>
                {categories.map(cat => {
                  const count = expenses.filter(e => e.category_id === cat.id).length;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-all flex-shrink-0',
                        isSelected
                          ? 'text-white font-bold'
                          : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border)]'
                      )}
                      style={isSelected ? { background: 'var(--accent)' } : {}}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                      <span className="opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Expense list */}
            <div className="space-y-2.5">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map(exp => (
                  <ExpenseCard
                    key={exp.id}
                    expense={exp}
                    onDelete={handleDeleteExpense}
                    onSettleExpense={handleSettleIndividualExpense}
                  />
                ))
              ) : (
                <EmptyState
                  emoji="💸"
                  title="No expenses in this view"
                  description="Record dinner, cabs, hotel, or groceries to calculate instant debt settlements."
                  actionLabel="Add Expense"
                  onAction={() => setIsExpenseModalOpen(true)}
                />
              )}
            </div>
          </div>
        )}

        {/* Tab: Debts */}
        {activeTab === 'debts' && (
          <SmartSettlePanel
            simplifiedDebts={simplifiedDebts}
            members={members}
            currentMemberId={currentMember?.id}
            onPayIndividual={handleOpenSettleForDebt}
            onSettleAll={handleOpenGeneralSettle}
          />
        )}

        {/* Tab: Balances */}
        {activeTab === 'balances' && (
          <div className="space-y-2.5">
            {memberBalances
              .sort((a, b) => b.netPaise - a.netPaise)
              .map(({ member, paidPaise, owedPaise, netPaise }) => (
              <div key={member.id} className="raised-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={member.name} color={member.color} size="sm" />
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">{member.name}</p>
                      {member.upi_id && (
                        <p className="text-[10px] font-mono text-[var(--text-muted)]">{member.upi_id}</p>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    'text-base font-extrabold font-outfit',
                    netPaise > 0 ? 'text-[var(--success)]' :
                    netPaise < 0 ? 'text-[var(--danger)]' :
                    'text-[var(--text-muted)]'
                  )}>
                    {netPaise > 0 ? '+' : netPaise < 0 ? '-' : ''}{formatRupees(Math.abs(netPaise))}
                  </div>
                </div>
                {/* Mini bar */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center p-1.5 rounded-lg" style={{ background: 'var(--success-light)' }}>
                    <span className="font-bold" style={{ color: 'var(--success)' }}>{formatCurrencyCompact(paidPaise)}</span>
                    <span className="text-[10px] text-[var(--text-muted)] block">Paid</span>
                  </div>
                  <div className="text-center p-1.5 rounded-lg" style={{ background: 'var(--danger-light)' }}>
                    <span className="font-bold" style={{ color: 'var(--danger)' }}>{formatCurrencyCompact(owedPaise)}</span>
                    <span className="text-[10px] text-[var(--text-muted)] block">Share</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        tripId={trip.id}
        members={members}
        categories={categories}
        currentMemberId={currentMember?.id}
        onSuccess={() => { fetchMoneyData(); refreshTrip(); }}
      />
      <SettleUpModal
        isOpen={isSettleModalOpen}
        onClose={() => {
          setIsSettleModalOpen(false);
          setSelectedDebtForSettle(null);
        }}
        tripId={trip.id}
        tripName={trip.name}
        members={members}
        simplifiedDebts={simplifiedDebts}
        currentMemberId={currentMember?.id}
        initialDebt={selectedDebtForSettle}
        onSuccess={() => { fetchMoneyData(); refreshTrip(); }}
      />
    </div>
  );
}
