'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Wallet,
  Camera,
  HandCoins,
  Users,
  ArrowRight,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  Download
} from 'lucide-react';
import { useActiveTrip } from '@/components/shared/ActiveTripContext';
import { TripHeader } from '@/components/shared/TripHeader';
import { WaveBackground } from '@/components/shared/WaveBackground';
import { MountainBackground } from '@/components/shared/MountainBackground';
import { StatCard } from '@/components/shared/StatCard';
import { BalanceCard } from '@/components/shared/BalanceCard';
import { ExpenseCard } from '@/components/money/ExpenseCard';
import { MediaCard } from '@/components/memories/MediaCard';
import { ExpenseFormModal } from '@/components/money/ExpenseFormModal';
import { SettleUpModal } from '@/components/money/SettleUpModal';
import { UploadModal } from '@/components/memories/UploadModal';
import { MediaViewer } from '@/components/memories/MediaViewer';
import { FloatingActionButton } from '@/components/shared/FloatingActionButton';
import { TripPulseWidget } from '@/components/analytics/TripPulseWidget';
import { LeaderboardList } from '@/components/analytics/LeaderboardList';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton, ListSkeleton } from '@/components/shared/SkeletonLoader';
import { formatRupees } from '@/lib/currency';
import type {
  ExpenseWithDetails,
  MediaWithDetails,
  SimplifiedDebt,
  TripPulseItem,
  TopSpender,
  Category
} from '@/types';

export default function TripDashboardPage() {
  const { trip, members, currentMember, refreshTrip } = useActiveTrip();

  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mediaList, setMediaList] = useState<MediaWithDetails[]>([]);
  const [simplifiedDebts, setSimplifiedDebts] = useState<SimplifiedDebt[]>([]);
  const [pulseItems, setPulseItems] = useState<TripPulseItem[]>([]);
  const [topSpenders, setTopSpenders] = useState<TopSpender[]>([]);
  const [totalSpentPaise, setTotalSpentPaise] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const fetchDashboardData = async () => {
    if (!trip) return;
    try {
      setIsLoading(true);

      const [eRes, mRes, sRes] = await Promise.all([
        fetch(`/api/expenses?trip_id=${trip.id}`),
        fetch(`/api/media?trip_id=${trip.id}`),
        fetch(`/api/settlements?trip_id=${trip.id}`),
      ]);

      const expData: ExpenseWithDetails[] = eRes.ok ? await eRes.json() : [];
      const mList: MediaWithDetails[] = mRes.ok ? await mRes.json() : [];
      const setData = sRes.ok ? await sRes.json() : {};

      setExpenses(expData);
      setMediaList(mList);
      setSimplifiedDebts(setData.simplifiedDebts || []);

      const total = expData.reduce((acc, curr) => acc + curr.amount_paise, 0);
      setTotalSpentPaise(total);

      // Top Spenders
      const paidMap: { [id: string]: number } = {};
      members.forEach((m) => (paidMap[m.id] = 0));
      expData.forEach((e) => {
        if (e.paid_by) paidMap[e.paid_by] = (paidMap[e.paid_by] || 0) + e.amount_paise;
      });

      const spenders: TopSpender[] = members
        .map((m) => ({
          member: m,
          totalPaidPaise: paidMap[m.id] || 0,
          rank: 0,
        }))
        .sort((a, b) => b.totalPaidPaise - a.totalPaidPaise)
        .map((s, idx) => ({ ...s, rank: idx + 1 }));

      setTopSpenders(spenders);

      // Generate dynamic Pulse Items
      const pulse: TripPulseItem[] = [];
      if (total > 0) {
        pulse.push({
          icon: '💰',
          text: `Total trip expenditure is`,
          value: formatRupees(total),
        });
      }
      if (spenders[0] && spenders[0].totalPaidPaise > 0) {
        pulse.push({
          icon: '👑',
          text: `${spenders[0].member.name} has paid the most so far`,
          value: formatRupees(spenders[0].totalPaidPaise),
        });
      }
      if (mList.length > 0) {
        pulse.push({
          icon: '📸',
          text: `${mList.length} moments saved in original quality vault`,
        });
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
  }, [trip?.id, currentMember?.id]);

  if (!trip) {
    return (
      <div className="p-6">
        <CardSkeleton />
      </div>
    );
  }

  // Calculate current member balance
  let currentPaidPaise = 0;
  let currentOwedPaise = 0;
  if (currentMember) {
    expenses.forEach((e) => {
      if (e.paid_by === currentMember.id) {
        currentPaidPaise += e.amount_paise;
      }
      e.splits?.forEach((s) => {
        if (s.member_id === currentMember.id) {
          currentOwedPaise += s.amount_paise;
        }
      });
    });
  }
  const currentNetBalancePaise = currentPaidPaise - currentOwedPaise;

  return (
    <div className="flex-1 flex flex-col bg-[#050711]">
      <TripHeader title={trip.name} />

      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
        {/* Hero Cover Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0e1633] via-[#090d21] to-[#050711] border border-white/[0.1] p-6 md:p-8 shadow-2xl">
          <WaveBackground className="absolute inset-0 opacity-40" />
          <MountainBackground className="absolute bottom-0 left-0 right-0 h-32 opacity-25" />

          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-bold backdrop-blur-md border border-cyan-500/25 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Trip Operating System
              </span>
              {trip.start_date && (
                <span className="px-3 py-1 rounded-full bg-white/[0.06] text-slate-300 text-xs font-mono font-medium backdrop-blur-md border border-white/5 inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  {new Date(trip.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold font-outfit text-white tracking-tight leading-tight">
              {trip.name}
            </h2>
            {trip.description && (
              <p className="text-xs md:text-sm text-slate-300 mt-2 line-clamp-2 max-w-xl font-normal leading-relaxed">
                {trip.description}
              </p>
            )}

            {/* Quick Action Pills */}
            <div className="flex flex-wrap gap-2.5 mt-6">
              <button
                id="hero-add-expense"
                onClick={() => setIsExpenseModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs md:text-sm font-bold shadow-lg shadow-pink-500/25 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Wallet className="w-4 h-4" /> Add Expense
              </button>

              <button
                id="hero-upload-media"
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-slate-950 text-xs md:text-sm font-extrabold shadow-lg shadow-cyan-400/25 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" /> Upload Photos
              </button>

              <button
                id="hero-settle-up"
                onClick={() => setIsSettleModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs md:text-sm font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <HandCoins className="w-4 h-4" /> Settle Up (UPI)
              </button>
            </div>
          </div>
        </div>

        {/* Balance Card & Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <BalanceCard
              currentMember={currentMember}
              netBalancePaise={currentNetBalancePaise}
              totalPaidPaise={currentPaidPaise}
              totalOwedPaise={currentOwedPaise}
              onSettleUp={() => setIsSettleModalOpen(true)}
            />
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
            <StatCard
              title="Total Spent"
              value={formatRupees(totalSpentPaise)}
              subtitle={`${expenses.length} expenses logged`}
              icon={Wallet}
              color="indigo"
            />
            <StatCard
              title="Avg / Person"
              value={formatRupees(members.length > 0 ? totalSpentPaise / members.length : 0)}
              subtitle={`Among ${members.length} friends`}
              icon={Users}
              color="cyan"
            />
            <StatCard
              title="Vault Media"
              value={mediaList.length}
              subtitle="High-res photos & videos"
              icon={Camera}
              color="pink"
            />
          </div>
        </div>

        {/* Trip Pulse AI Insights */}
        {pulseItems.length > 0 && <TripPulseWidget pulseItems={pulseItems} />}

        {/* Memories Preview Carousel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-outfit text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" /> Recent Vault Memories
            </h3>
            <Link
              href={`/trip/${trip.slug}/memories`}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              View Full Gallery ({mediaList.length}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {mediaList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {mediaList.slice(0, 6).map((item, idx) => (
                <MediaCard
                  key={item.id}
                  media={item}
                  onClick={() => setViewerIndex(idx)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              emoji="📸"
              title="No photos or videos uploaded yet"
              description="Capture every high-res moment with original quality cloud backups."
              actionLabel="Upload First Memory"
              onAction={() => setIsUploadModalOpen(true)}
            />
          )}
        </div>

        {/* Recent Expenses List & Leaderboards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expenses */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-outfit text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-pink-400" /> Recent Expenses
              </h3>
              <Link
                href={`/trip/${trip.slug}/money`}
                className="text-xs font-semibold text-pink-400 hover:text-pink-300 flex items-center gap-1 transition-colors"
              >
                View All Bills ({expenses.length}) <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {expenses.length > 0 ? (
              <div className="space-y-2.5">
                {expenses.slice(0, 4).map((exp) => (
                  <ExpenseCard key={exp.id} expense={exp} />
                ))}
              </div>
            ) : (
              <EmptyState
                emoji="💸"
                title="No expenses added yet"
                description="Split dinner, fuel, stays, and tickets equally or with exact custom shares."
                actionLabel="Add First Expense"
                onAction={() => setIsExpenseModalOpen(true)}
              />
            )}
          </div>

          {/* Leaderboard */}
          <div>
            <LeaderboardList topSpenders={topSpenders} />
          </div>
        </div>
      </main>

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
        onSuccess={() => {
          fetchDashboardData();
          refreshTrip();
        }}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        tripId={trip.id}
        members={members}
        albums={[]}
        currentMemberId={currentMember?.id}
        onSuccess={() => {
          fetchDashboardData();
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
          fetchDashboardData();
          refreshTrip();
        }}
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
