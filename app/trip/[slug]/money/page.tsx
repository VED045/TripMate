'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Plus,
  HandCoins,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Receipt,
  Sparkles,
  Tag,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import { useActiveTrip } from '@/components/shared/ActiveTripContext';
import { TripHeader } from '@/components/shared/TripHeader';
import { ExpenseCard } from '@/components/money/ExpenseCard';
import { ExpenseFormModal } from '@/components/money/ExpenseFormModal';
import { SettleUpModal } from '@/components/money/SettleUpModal';
import { BalanceCard } from '@/components/shared/BalanceCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { ListSkeleton } from '@/components/shared/SkeletonLoader';
import { FloatingActionButton } from '@/components/shared/FloatingActionButton';
import { formatRupees } from '@/lib/currency';
import type { ExpenseWithDetails, SimplifiedDebt, Category } from '@/types';
import { toast } from 'sonner';

export default function MoneyPage() {
  const { trip, members, currentMember, refreshTrip } = useActiveTrip();

  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [simplifiedDebts, setSimplifiedDebts] = useState<SimplifiedDebt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaidBy, setSelectedPaidBy] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  const fetchMoneyData = useCallback(async () => {
    if (!trip) return;
    try {
      setIsLoading(true);

      const [eRes, sRes, tRes] = await Promise.all([
        fetch(`/api/expenses?trip_id=${trip.id}`),
        fetch(`/api/settlements?trip_id=${trip.id}`),
        fetch(`/api/trips/${trip.slug}`),
      ]);

      if (eRes.ok) {
        const eData = await eRes.json();
        setExpenses(eData);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        setSimplifiedDebts(sData.simplifiedDebts || []);
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        if (tData.categories && tData.categories.length > 0) {
          setCategories(tData.categories);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [trip]);

  useEffect(() => {
    fetchMoneyData();
  }, [fetchMoneyData]);

  if (!trip) {
    return <div className="p-6"><ListSkeleton /></div>;
  }

  // Calculate balances
  let currentPaidPaise = 0;
  let currentOwedPaise = 0;
  let totalSpentPaise = 0;

  expenses.forEach((e) => {
    totalSpentPaise += e.amount_paise;
    if (currentMember && e.paid_by === currentMember.id) {
      currentPaidPaise += e.amount_paise;
    }
    if (currentMember) {
      e.splits?.forEach((s) => {
        if (s.member_id === currentMember.id) {
          currentOwedPaise += s.amount_paise;
        }
      });
    }
  });

  const currentNetBalancePaise = currentPaidPaise - currentOwedPaise;

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete expense');
      toast.success('Expense deleted');
      fetchMoneyData();
      refreshTrip();
    } catch (err) {
      toast.error('Failed to delete expense');
    }
  };

  // Filter expenses
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.paid_by_member?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || e.category_id === selectedCategory;
    const matchesPaid = selectedPaidBy === 'all' || e.paid_by === selectedPaidBy;
    return matchesSearch && matchesCat && matchesPaid;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#050711]">
      <TripHeader title="Money & Expense Splits" subtitle="Precision split engine & UPI settlements" />

      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
        {/* Personal Balance & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <BalanceCard
              currentMember={currentMember}
              netBalancePaise={currentNetBalancePaise}
              totalPaidPaise={currentPaidPaise}
              totalOwedPaise={currentOwedPaise}
              onSettleUp={() => setIsSettleModalOpen(true)}
            />
          </div>

          <div className="flex flex-col justify-between p-6 rounded-3xl glass-panel">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400">
                Total Trip Spend
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold font-outfit text-white mt-1">
                {formatRupees(totalSpentPaise)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {expenses.length} expense{expenses.length === 1 ? '' : 's'} recorded across {members.length} people
              </p>
            </div>

            <div className="space-y-2 mt-5">
              <button
                id="money-add-expense-button"
                onClick={() => setIsExpenseModalOpen(true)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Add New Expense
              </button>
              <button
                id="money-settle-up-button"
                onClick={() => setIsSettleModalOpen(true)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <HandCoins className="w-4 h-4" /> Settle Up via UPI
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === 'all'
              ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md'
              : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
              }`}
          >
            All Categories ({expenses.length})
          </button>
          {categories.map((cat) => {
            const count = expenses.filter((e) => e.category_id === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${isSelected
                  ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md'
                  : 'bg-white/[0.04] text-slate-300 hover:text-white border border-white/5'
                  }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search & Payer Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-3 rounded-2xl glass-panel">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title or payer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedPaidBy}
              onChange={(e) => setSelectedPaidBy(e.target.value)}
              className="bg-[#0c1228] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
            >
              <option value="all">All Payers</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  Paid by {m.name}
                </option>
              ))}
            </select>

            <a
              href={`/api/export?trip_id=${trip.id}&format=csv`}
              className="p-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 hover:text-white border border-white/10 flex items-center gap-1.5 text-xs font-semibold transition-colors"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
            </a>
          </div>
        </div>

        {/* Expense List */}
        <div className="space-y-3">
          {filteredExpenses.length > 0 ? (
            filteredExpenses.map((exp) => (
              <ExpenseCard
                key={exp.id}
                expense={exp}
                onDelete={handleDeleteExpense}
              />
            ))
          ) : (
            <EmptyState
              emoji="💸"
              title="No expenses in this view"
              description="Record dinner, cabs, Airbnb, or groceries to calculate instant debt settlements."
              actionLabel="Add Expense"
              onAction={() => setIsExpenseModalOpen(true)}
            />
          )}
        </div>
      </main>

      <FloatingActionButton
        onAddExpense={() => setIsExpenseModalOpen(true)}
        onUploadMedia={() => { }}
        onSettleUp={() => setIsSettleModalOpen(true)}
      />

      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        tripId={trip.id}
        members={members}
        categories={categories}
        currentMemberId={currentMember?.id}
        onSuccess={() => {
          fetchMoneyData();
          refreshTrip();
        }}
      />

      <SettleUpModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        tripId={trip.id}
        tripName={trip.name}
        members={members}
        simplifiedDebts={simplifiedDebts}
        currentMemberId={currentMember?.id}
        onSuccess={() => {
          fetchMoneyData();
          refreshTrip();
        }}
      />
    </div>
  );
}
