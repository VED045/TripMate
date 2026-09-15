'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Wallet,
  Camera,
  HandCoins,
  Users,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
} from 'lucide-react';
import { useActiveTrip } from '@/components/shared/ActiveTripContext';
import { TripHeader } from '@/components/shared/TripHeader';
import { ExpenseCard } from '@/components/money/ExpenseCard';
import { FeaturedMemoriesCarousel } from '@/components/memories/FeaturedMemoriesCarousel';
import { ExpenseFormModal } from '@/components/money/ExpenseFormModal';
import { SettleUpModal } from '@/components/money/SettleUpModal';
import { UploadModal } from '@/components/memories/UploadModal';
import { MediaViewer } from '@/components/memories/MediaViewer';
import { FloatingActionButton } from '@/components/shared/FloatingActionButton';
import { TripPulseWidget } from '@/components/analytics/TripPulseWidget';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/SkeletonLoader';
import { Avatar } from '@/components/ui/Avatar';
import { formatRupees, formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';
import type {
  ExpenseWithDetails,
  MediaWithDetails,
  SimplifiedDebt,
  TripPulseItem,
  Category
} from '@/types';

export default function TripDashboardPage() {
  const { trip, members, currentMember, refreshTrip } = useActiveTrip();

  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mediaList, setMediaList] = useState<MediaWithDetails[]>([]);
  const [simplifiedDebts, setSimplifiedDebts] = useState<SimplifiedDebt[]>([]);
  const [pulseItems, setPulseItems] = useState<TripPulseItem[]>([]);
  const [totalSpentPaise, setTotalSpentPaise] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const fetchDashboardData = async () => {
    if (!trip) return;
    try {
      setIsLoading(true);
      const [eRes, mRes, sRes, tRes] = await Promise.all([
        fetch(`/api/expenses?trip_id=${trip.id}`),
        fetch(`/api/media?trip_id=${trip.id}`),
        fetch(`/api/settlements?trip_id=${trip.id}`),
        fetch(`/api/trips/${trip.slug}`),
      ]);

      const expData: ExpenseWithDetails[] = eRes.ok ? await eRes.json() : [];
      const mList: MediaWithDetails[] = mRes.ok ? await mRes.json() : [];
      const setData = sRes.ok ? await sRes.json() : {};
      const tripData = tRes.ok ? await tRes.json() : {};

      setExpenses(expData);
      setMediaList(mList);
      setSimplifiedDebts(setData.simplifiedDebts || []);
      if (tripData.categories?.length > 0) setCategories(tripData.categories);

      const total = expData.reduce((acc, curr) => acc + curr.amount_paise, 0);
      setTotalSpentPaise(total);

      // Pulse items
      const pulse: TripPulseItem[] = [];
      if (total > 0) {
        const topPayer = members
          .map(m => ({
            member: m,
            paid: expData.filter(e => e.paid_by === m.id).reduce((s, e) => s + e.amount_paise, 0)
          }))
          .sort((a, b) => b.paid - a.paid)[0];

        pulse.push({ icon: '💰', text: 'Total trip expenditure', value: formatRupees(total) });
        if (topPayer?.paid > 0) {
          pulse.push({ icon: '👑', text: `${topPayer.member.name} has paid the most`, value: formatRupees(topPayer.paid) });
        }
      }
      if (mList.length > 0) {
        pulse.push({ icon: '📸', text: `${mList.length} memories saved in the vault` });
      }
      setPulseItems(pulse);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id]);

  if (!trip) {
    return <div className="p-5"><CardSkeleton /></div>;
  }

  // Current member balance
  let currentPaidPaise = 0;
  let currentOwedPaise = 0;
  if (currentMember) {
    expenses.forEach((e) => {
      if (e.paid_by === currentMember.id) currentPaidPaise += e.amount_paise;
      e.splits?.forEach((s) => {
        if (s.member_id === currentMember.id) currentOwedPaise += s.amount_paise;
      });
    });
  }
  const netBalancePaise = currentPaidPaise - currentOwedPaise;

  // My pending debts
  const myDebts = simplifiedDebts.filter(d =>
    d.from_member_id === currentMember?.id || d.to_member_id === currentMember?.id
  );

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--background)' }}>
      <TripHeader title={trip.name} />

      <div className="max-w-4xl mx-auto w-full px-4 md:px-6 py-5 space-y-5 pb-nav">

        {/* Hero Balance Card */}
        <div className="raised-card p-5 space-y-4">
          {/* Trip name + greeting */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest font-mono mb-1">
                Your Balance
              </p>
              <div className={cn(
                'text-3xl font-extrabold font-outfit tracking-tight',
                netBalancePaise > 0 ? 'text-[var(--success)]' :
                  netBalancePaise < 0 ? 'text-[var(--danger)]' :
                    'text-[var(--text-primary)]'
              )}>
                {netBalancePaise >= 0 ? '' : '-'}{formatRupees(Math.abs(netBalancePaise))}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {netBalancePaise > 0 ? '🟢 You are owed money' :
                  netBalancePaise < 0 ? '🔴 You owe money' :
                    '✅ All settled up'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {netBalancePaise > 0 ? (
                <ArrowUpRight className="w-8 h-8 text-[var(--success)] opacity-80" />
              ) : netBalancePaise < 0 ? (
                <ArrowDownRight className="w-8 h-8 text-[var(--danger)] opacity-80" />
              ) : (
                <Minus className="w-8 h-8 text-[var(--text-muted)]" />
              )}
            </div>
          </div>

          {/* Mini stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Paid', value: formatCurrencyCompact(currentPaidPaise), color: 'var(--success)' },
              { label: 'Share', value: formatCurrencyCompact(currentOwedPaise), color: 'var(--text-secondary)' },
              { label: 'Trip Total', value: formatCurrencyCompact(totalSpentPaise), color: 'var(--accent)' },
            ].map(stat => (
              <div key={stat.label} className="inset-card p-3 text-center">
                <div className="text-sm font-bold font-outfit" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              id="hero-add-expense"
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-white font-bold text-xs transition-all active:scale-95 shadow-md"
              style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)', boxShadow: '0 4px 14px rgba(43,86,255,0.35)' }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
            <button
              id="hero-settle-up"
              onClick={() => setIsSettleModalOpen(true)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-white font-bold text-xs transition-all active:scale-95 shadow-md"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}
            >
              <HandCoins className="w-4 h-4" />
              <span>Settle Up</span>
            </button>
            <button
              id="hero-upload-media"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-white font-bold text-xs transition-all active:scale-95 shadow-md"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', boxShadow: '0 4px 14px rgba(14,165,233,0.35)' }}
            >
              <Camera className="w-4 h-4" />
              <span>Add Photo</span>
            </button>
          </div>
        </div>

        {/* Who Owes Whom */}
        {simplifiedDebts.length > 0 && (
          <div className="raised-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold font-outfit text-[var(--text-primary)]">
                Outstanding Debts
              </h2>
              <Link
                href={`/trip/${trip.slug}/money`}
                className="text-xs font-semibold flex items-center gap-1"
                style={{ color: 'var(--accent)' }}
              >
                Settle All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {simplifiedDebts.slice(0, 3).map((debt, i) => {
                const from = members.find(m => m.id === debt.from_member_id);
                const to = members.find(m => m.id === debt.to_member_id);
                const isMe = debt.from_member_id === currentMember?.id;
                if (!from || !to) return null;
                return (
                  <div key={i} className={cn(
                    'flex items-center justify-between p-2.5 rounded-xl',
                    isMe ? 'bg-[var(--danger-light)]' : 'bg-[var(--surface-inset)]'
                  )}>
                    <div className="flex items-center gap-2">
                      <Avatar name={from.name} color={from.color} size="xs" />
                      <span className="text-xs font-medium text-[var(--text-secondary)]">
                        <span className="font-bold text-[var(--text-primary)]">{from.name}</span>
                        {' → '}
                        <span className="font-bold text-[var(--text-primary)]">{to.name}</span>
                      </span>
                    </div>
                    <span className={cn(
                      'text-xs font-bold',
                      isMe ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'
                    )}>
                      {formatRupees(debt.amount_paise)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Trip Pulse */}
        {pulseItems.length > 0 && <TripPulseWidget pulseItems={pulseItems} />}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Expenses', value: expenses.length, icon: Wallet, href: `money`, color: '#f43f5e' },
            { label: 'Members', value: members.length, icon: Users, href: `people`, color: 'var(--accent)' },
            { label: 'Memories', value: mediaList.length, icon: Camera, href: `memories`, color: '#06b6d4' },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                href={`/trip/${trip.slug}/${stat.href}`}
                className="raised-card p-3 flex flex-col items-center gap-1.5 text-center hover:shadow-[var(--shadow-card-hover)] transition-all active:scale-[0.97]"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}20` }}>
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <div className="text-lg font-extrabold font-outfit text-[var(--text-primary)]">{stat.value}</div>
                <div className="text-[10px] text-[var(--text-muted)] font-medium">{stat.label}</div>
              </Link>
            );
          })}
        </div>

        {/* Featured Memories Carousel */}
        {mediaList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold font-outfit text-[var(--text-primary)] flex items-center gap-2">
                <Camera className="w-4 h-4" style={{ color: '#06b6d4' }} />
                Recent Memories
              </h2>
              <Link
                href={`/trip/${trip.slug}/memories`}
                className="text-xs font-semibold flex items-center gap-1"
                style={{ color: '#06b6d4' }}
              >
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {mediaList.slice(0, 3).map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setViewerIndex(idx)}
                  className="raised-card p-1 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)] shadow-[var(--shadow-raised)] cursor-pointer hover:scale-[1.04] hover:border-[var(--accent)] transition-all overflow-hidden aspect-square"
                >
                  {/* eslint-disable-next-html-element-suppress */}
                  <img
                    src={item.thumbnail_url || item.url || ''}
                    alt={item.original_filename || 'memory'}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Expenses */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-outfit text-[var(--text-primary)] flex items-center gap-2">
              <Wallet className="w-4 h-4" style={{ color: '#f43f5e' }} />
              Recent Expenses
            </h2>
            <Link
              href={`/trip/${trip.slug}/money`}
              className="text-xs font-semibold flex items-center gap-1"
              style={{ color: '#f43f5e' }}
            >
              All bills <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {expenses.length > 0 ? (
            <div className="space-y-2">
              {expenses.slice(0, 4).map((exp) => (
                <ExpenseCard key={exp.id} expense={exp} />
              ))}
            </div>
          ) : (
            <EmptyState
              emoji="💸"
              title="No expenses yet"
              description="Add your first expense to start splitting bills with the crew."
              actionLabel="Add Expense"
              onAction={() => setIsExpenseModalOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        onAddExpense={() => setIsExpenseModalOpen(true)}
        onUploadMedia={() => setIsUploadModalOpen(true)}
        onSettleUp={() => setIsSettleModalOpen(true)}
      />

      {/* Modals */}
      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        tripId={trip.id}
        members={members}
        categories={categories}
        currentMemberId={currentMember?.id}
        onSuccess={() => { fetchDashboardData(); refreshTrip(); }}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        tripId={trip.id}
        members={members}
        albums={[]}
        currentMemberId={currentMember?.id}
        onSuccess={() => { fetchDashboardData(); refreshTrip(); }}
      />

      <SettleUpModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        tripId={trip.id}
        tripName={trip.name}
        members={members}
        simplifiedDebts={simplifiedDebts}
        currentMemberId={currentMember?.id}
        onSuccess={() => { fetchDashboardData(); refreshTrip(); }}
      />

      {viewerIndex !== null && (
        <MediaViewer
          isOpen={viewerIndex !== null}
          onClose={() => setViewerIndex(null)}
          mediaList={mediaList}
          initialIndex={viewerIndex}
        />
      )}
    </div>
  );
}
