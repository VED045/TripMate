'use client';

import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  HandCoins,
  Smartphone,
  Crown,
  Share2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useActiveTrip } from '@/components/shared/ActiveTripContext';
import { TripHeader } from '@/components/shared/TripHeader';
import { PersonCard } from '@/components/people/PersonCard';
import { MemberFormModal } from '@/components/people/MemberFormModal';
import { SettleUpModal } from '@/components/money/SettleUpModal';
import { EmptyState } from '@/components/shared/EmptyState';
import { ListSkeleton } from '@/components/shared/SkeletonLoader';
import { FloatingActionButton } from '@/components/shared/FloatingActionButton';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatRupees, formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ExpenseWithDetails, MediaWithDetails, SimplifiedDebt, Member } from '@/types';

import { QrCode, Edit2, Trash2 } from 'lucide-react';
import { MemberQrModal } from '@/components/people/MemberQrModal';

export default function PeoplePage() {
  const { trip, members, currentMember, setCurrentMemberId, refreshTrip } = useActiveTrip();

  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [mediaList, setMediaList] = useState<MediaWithDetails[]>([]);
  const [simplifiedDebts, setSimplifiedDebts] = useState<SimplifiedDebt[]>([]);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [selectedQrMember, setSelectedQrMember] = useState<Member | null>(null);
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

  useEffect(() => { fetchData(); }, [trip?.id]);

  if (!trip) return <div className="p-5"><ListSkeleton /></div>;

  const totalSpentPaise = expenses.reduce((s, e) => s + e.amount_paise, 0);

  const memberStats = members.map((m, idx) => {
    let paid = 0, owed = 0;
    expenses.forEach(e => {
      if (e.paid_by === m.id) paid += e.amount_paise;
      e.splits?.forEach(s => { if (s.member_id === m.id) owed += s.amount_paise; });
    });
    const photos = mediaList.filter(
      med => med.uploader_id === m.id || med.tags?.some(t => t.member_id === m.id)
    ).length;
    const net = paid - owed;
    const rank = 0; // computed after sort
    return { member: m, paidPaise: paid, owedPaise: owed, netPaise: net, photoCount: photos, idx };
  }).sort((a, b) => b.paidPaise - a.paidPaise)
    .map((s, i) => ({ ...s, rank: i + 1 }));

  const handleDeleteMember = async (e: React.MouseEvent, memberId: string, memberName: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to deactivate ${memberName} from this trip?`)) return;

    try {
      const res = await fetch(`/api/members?id=${memberId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to remove member');
        return;
      }

      toast.success(data.message || `${memberName} deactivated successfully.`);
      refreshTrip();
      fetchData();
    } catch {
      toast.error('Failed to remove member');
    }
  };

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--background)' }}>
      <TripHeader title="Crew" subtitle="Members, balances & UPI links" />

      <div className="max-w-4xl mx-auto w-full px-4 md:px-6 py-5 space-y-5 pb-nav">

        {/* Crew Header Banner */}
        <div className="raised-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold font-outfit text-[var(--text-primary)]">
              {trip.name} Crew
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {members.length} members · {formatRupees(totalSpentPaise)} total trip spend
            </p>
          </div>
          <button
            id="people-add-member-button"
            onClick={() => {
              setMemberToEdit(null);
              setIsMemberModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-xs transition-all active:scale-95 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)', boxShadow: `0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent)` }}
          >
            <UserPlus className="w-4 h-4" /> Add Member
          </button>
        </div>

        {/* Member Cards */}
        {members.length === 0 ? (
          <EmptyState
            emoji="👥"
            title="No crew members yet"
            description="Add your travel companions to start splitting expenses."
            actionLabel="Add First Member"
            onAction={() => {
              setMemberToEdit(null);
              setIsMemberModalOpen(true);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {memberStats.map(({ member, paidPaise, owedPaise, netPaise, photoCount, rank }) => {
              const isCurrent = currentMember?.id === member.id;
              const isTopSpender = rank === 1 && paidPaise > 0;
              const isMemberCreator = Boolean(
                member.is_admin ||
                (trip.created_by && member.id === trip.created_by) ||
                (members.length > 0 && members[0]?.id === member.id)
              );

              return (
                <div
                  key={member.id}
                  className={cn(
                    'raised-card p-4 text-left transition-all w-full relative flex flex-col justify-between min-h-[140px]',
                    isCurrent && 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)]'
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      {/* Avatar & Name */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative flex-shrink-0">
                          <Avatar name={member.name} color={member.color} size="md" />
                          {isTopSpender && (
                            <span className="absolute -top-1.5 -right-1 text-xs" title="Top Spender">👑</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-bold text-[var(--text-primary)] truncate font-outfit">
                              {member.name}
                            </p>
                            {isMemberCreator && (
                              <Badge variant="warning" size="xs" className="flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                <span>Creator</span>
                              </Badge>
                            )}
                            {isCurrent && (
                              <Badge variant="info" size="xs">You</Badge>
                            )}
                          </div>
                          {member.upi_id ? (
                            <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold truncate mt-0.5">
                              {member.upi_id}
                            </p>
                          ) : (
                            <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">No UPI ID set</p>
                          )}
                        </div>
                      </div>

                      {/* Balance & Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className={cn(
                          'text-xs sm:text-sm font-extrabold font-outfit text-right mr-1 whitespace-nowrap',
                          netPaise > 0 ? 'text-[var(--success)]' :
                          netPaise < 0 ? 'text-[var(--danger)]' :
                          'text-[var(--text-muted)]'
                        )}>
                          {netPaise > 0 ? '+' : netPaise < 0 ? '-' : ''}{formatCurrencyCompact(Math.abs(netPaise))}
                        </div>

                        {/* Member actions */}
                        {member.upi_id ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedQrMember(member);
                            }}
                            title="Show UPI QR Code"
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--surface-inset)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="w-7 h-7" />
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMemberToEdit(member);
                            setIsMemberModalOpen(true);
                          }}
                          title="Edit Member Details"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--surface-inset)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {!isMemberCreator ? (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteMember(e, member.id, member.name)}
                            title={`Deactivate ${member.name}`}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400"
                            title="Trip Owner"
                          >
                            <Crown className="w-3.5 h-3.5 fill-amber-500" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2">
                      <div className="inset-card py-1.5 px-2 text-center">
                        <p className="text-xs font-bold" style={{ color: 'var(--success)' }}>{formatCurrencyCompact(paidPaise)}</p>
                        <p className="text-[9px] text-[var(--text-muted)] font-mono">Paid</p>
                      </div>
                      <div className="inset-card py-1.5 px-2 text-center">
                        <p className="text-xs font-bold text-[var(--text-secondary)]">{formatCurrencyCompact(owedPaise)}</p>
                        <p className="text-[9px] text-[var(--text-muted)] font-mono">Share</p>
                      </div>
                      <div className="inset-card py-1.5 px-2 text-center">
                        <p className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{photoCount}</p>
                        <p className="text-[9px] text-[var(--text-muted)] font-mono">Photos</p>
                      </div>
                    </div>
                  </div>

                  {/* Debts related to this member */}
                  {simplifiedDebts.some(d => d.from_member_id === member.id || d.to_member_id === member.id) && (
                    <div className="mt-2.5 pt-2 border-t border-[var(--border)]">
                      {simplifiedDebts
                        .filter(d => d.from_member_id === member.id || d.to_member_id === member.id)
                        .slice(0, 1)
                        .map((debt, i) => {
                          const isDebtor = debt.from_member_id === member.id;
                          const other = members.find(m => m.id === (isDebtor ? debt.to_member_id : debt.from_member_id));
                          return (
                            <p key={i} className="text-[10px] text-[var(--text-muted)] truncate font-medium">
                              {isDebtor ? (
                                <span className="text-[var(--danger)]">Owes {other?.name} {formatRupees(debt.amount_paise)}</span>
                              ) : (
                                <span className="text-[var(--success)]">{other?.name} owes {formatRupees(debt.amount_paise)}</span>
                              )}
                            </p>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <FloatingActionButton
        onAddExpense={() => {}}
        onUploadMedia={() => {}}
        onSettleUp={() => setIsSettleModalOpen(true)}
      />

      <MemberFormModal
        isOpen={isMemberModalOpen}
        onClose={() => {
          setIsMemberModalOpen(false);
          setMemberToEdit(null);
        }}
        tripId={trip.id}
        memberToEdit={memberToEdit}
        onSuccess={() => { refreshTrip(); fetchData(); }}
      />

      <MemberQrModal
        isOpen={Boolean(selectedQrMember)}
        onClose={() => setSelectedQrMember(null)}
        member={selectedQrMember}
        tripName={trip.name}
      />

      <SettleUpModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        tripId={trip.id}
        tripName={trip.name}
        members={members}
        simplifiedDebts={simplifiedDebts}
        currentMemberId={currentMember?.id}
        onSuccess={() => { fetchData(); refreshTrip(); }}
      />
    </div>
  );
}
