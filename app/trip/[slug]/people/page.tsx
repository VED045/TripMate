'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Sparkles,
  Wallet,
  HandCoins,
  Smartphone,
  Crown,
  Share2
} from 'lucide-react';
import { useActiveTrip } from '@/components/shared/ActiveTripContext';
import { TripHeader } from '@/components/shared/TripHeader';
import { PersonCard } from '@/components/people/PersonCard';
import { MemberFormModal } from '@/components/people/MemberFormModal';
import { SettleUpModal } from '@/components/money/SettleUpModal';
import { EmptyState } from '@/components/shared/EmptyState';
import { ListSkeleton } from '@/components/shared/SkeletonLoader';
import { FloatingActionButton } from '@/components/shared/FloatingActionButton';
import { formatRupees } from '@/lib/currency';
import type { ExpenseWithDetails, MediaWithDetails, SimplifiedDebt } from '@/types';
import { toast } from 'sonner';

export default function PeoplePage() {
  const { trip, members, currentMember, setCurrentMemberId, refreshTrip } = useActiveTrip();

  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [mediaList, setMediaList] = useState<MediaWithDetails[]>([]);
  const [simplifiedDebts, setSimplifiedDebts] = useState<SimplifiedDebt[]>([]);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!trip) return;
    try {
      setIsLoading(true);
      const [eRes, mRes, sRes] = await Promise.all([
        fetch(`/api/expenses?trip_id=${trip.id}`),
        fetch(`/api/media?trip_id=${trip.id}`),
        fetch(`/api/settlements?trip_id=${trip.id}`),
      ]);

      if (eRes.ok) setExpenses(await eRes.json());
      if (mRes.ok) setMediaList(await mRes.json());
      if (sRes.ok) {
        const sData = await sRes.json();
        setSimplifiedDebts(sData.simplifiedDebts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [trip?.id]);

  if (!trip) {
    return <div className="p-6"><ListSkeleton /></div>;
  }

  // Calculate stats per member
  const memberStats = members.map((m) => {
    let totalPaid = 0;
    let totalOwed = 0;

    expenses.forEach((e) => {
      if (e.paid_by === m.id) totalPaid += e.amount_paise;
      e.splits?.forEach((s) => {
        if (s.member_id === m.id) totalOwed += s.amount_paise;
      });
    });

    const photoCount = mediaList.filter(
      (med) => med.uploader_id === m.id || med.tags?.some((t) => t.member_id === m.id)
    ).length;

    return {
      member: m,
      totalPaidPaise: totalPaid,
      totalOwedPaise: totalOwed,
      netBalancePaise: totalPaid - totalOwed,
      photoCount,
    };
  });

  return (
    <div className="flex-1 flex flex-col">
      <TripHeader title="Trip Crew & Balances" subtitle="All friends, spending profiles & UPI links" />

      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
        {/* Crew Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl">
          <div>
            <h2 className="text-xl font-bold font-outfit text-white">
              Trip Crew ({members.length})
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select any member card to switch your view or check balances
            </p>
          </div>

          <button
            id="people-add-member-button"
            onClick={() => setIsMemberModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 hover:from-indigo-600 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> Add Crew Member
          </button>
        </div>

        {/* Member Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberStats.map((stat) => {
            const isCurrent = currentMember?.id === stat.member.id;
            return (
              <div key={stat.member.id} className="relative">
                {isCurrent && (
                  <div className="absolute -top-2.5 right-4 z-10 px-2.5 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider shadow-md">
                    You (Active View)
                  </div>
                )}
                <PersonCard
                  member={stat.member}
                  totalPaidPaise={stat.totalPaidPaise}
                  totalOwedPaise={stat.totalOwedPaise}
                  netBalancePaise={stat.netBalancePaise}
                  photoCount={stat.photoCount}
                  onClick={() => {
                    setCurrentMemberId(stat.member.id);
                    toast.info(`Switched view to ${stat.member.name}`);
                  }}
                />
              </div>
            );
          })}
        </div>
      </main>

      <FloatingActionButton
        onAddExpense={() => { }}
        onUploadMedia={() => { }}
        onSettleUp={() => setIsSettleModalOpen(true)}
      />

      <MemberFormModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        tripId={trip.id}
        onSuccess={() => {
          refreshTrip();
          fetchData();
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
          fetchData();
          refreshTrip();
        }}
      />
    </div>
  );
}
