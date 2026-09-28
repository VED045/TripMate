'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  CalendarDays,
  Check,
  ClipboardList,
  MapPin,
  Plus,
  Trash2,
  Edit3,
  Clock,
  User,
  X,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { TripHeader } from '@/components/shared/TripHeader';
import { useActiveTrip } from '@/components/shared/ActiveTripContext';
import { cn } from '@/lib/utils';

type ItineraryItem = {
  id: string;
  trip_id: string;
  title: string;
  details: string | null;
  location_name: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_by?: string | null;
  created_at: string;
};

type PackingItem = {
  id: string;
  trip_id: string;
  title: string;
  is_complete: boolean;
  assigned_member_id: string | null;
  assigned_member?: { id: string; name: string; color: string | null } | null;
  created_by?: string | null;
  created_at: string;
};

function formatItineraryTime(isoString: string | null) {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return null;
  }
}

function toDatetimeLocal(isoString: string | null) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

export default function PlanPage() {
  const { trip, members, currentMember } = useActiveTrip();
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [packing, setPacking] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Itinerary Form State
  const [isAddingItinerary, setIsAddingItinerary] = useState(false);
  const [newItineraryTitle, setNewItineraryTitle] = useState('');
  const [newItineraryLocation, setNewItineraryLocation] = useState('');
  const [newItineraryTime, setNewItineraryTime] = useState('');
  const [newItineraryDetails, setNewItineraryDetails] = useState('');
  const [isSubmittingItinerary, setIsSubmittingItinerary] = useState(false);

  // Itinerary Item Edit State
  const [editingItineraryId, setEditingItineraryId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Packing Form & Filter State
  const [packingTitle, setPackingTitle] = useState('');
  const [assignedMemberId, setAssignedMemberId] = useState<string>('');
  const [packingFilter, setPackingFilter] = useState<'all' | 'my' | string>('all');
  const [isSubmittingPacking, setIsSubmittingPacking] = useState(false);

  // Reassignment Dropdown Popover
  const [reassigningItemId, setReassigningItemId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!trip) return;
    try {
      const response = await fetch(`/api/planning?trip_id=${trip.id}`);
      if (!response.ok) {
        throw new Error('Failed to load planning data');
      }
      const data = await response.json();
      setItinerary(data.itinerary || []);
      setPacking(data.packing || []);
    } catch {
      toast.error('Could not load itinerary and packing items');
    } finally {
      setLoading(false);
    }
  }, [trip]);

  useEffect(() => {
    queueMicrotask(() => void loadData());
  }, [loadData]);

  // Set default assigned member to current member once available
  useEffect(() => {
    if (currentMember?.id && !assignedMemberId) {
      queueMicrotask(() => setAssignedMemberId(currentMember.id));
    }
  }, [currentMember?.id, assignedMemberId]);

  // ==========================================
  // ITINERARY HANDLERS (Editable by everyone)
  // ==========================================

  const handleAddItinerary = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trip || !newItineraryTitle.trim()) return;

    try {
      setIsSubmittingItinerary(true);
      const res = await fetch('/api/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: trip.id,
          kind: 'itinerary',
          title: newItineraryTitle.trim(),
          location_name: newItineraryLocation.trim() || null,
          starts_at: newItineraryTime ? new Date(newItineraryTime).toISOString() : null,
          details: newItineraryDetails.trim() || null,
          member_id: currentMember?.id || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add itinerary stop');
      }

      toast.success('Stop added to itinerary!');
      setNewItineraryTitle('');
      setNewItineraryLocation('');
      setNewItineraryTime('');
      setNewItineraryDetails('');
      setIsAddingItinerary(false);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add stop');
    } finally {
      setIsSubmittingItinerary(false);
    }
  };

  const startEditItinerary = (item: ItineraryItem) => {
    setEditingItineraryId(item.id);
    setEditTitle(item.title);
    setEditLocation(item.location_name || '');
    setEditTime(toDatetimeLocal(item.starts_at));
    setEditDetails(item.details || '');
  };

  const cancelEditItinerary = () => {
    setEditingItineraryId(null);
    setEditTitle('');
    setEditLocation('');
    setEditTime('');
    setEditDetails('');
  };

  const handleSaveItineraryEdit = async (id: string) => {
    if (!trip || !editTitle.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      setIsSavingEdit(true);
      const res = await fetch('/api/planning', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: trip.id,
          id,
          kind: 'itinerary',
          title: editTitle.trim(),
          location_name: editLocation.trim() || null,
          starts_at: editTime ? new Date(editTime).toISOString() : null,
          details: editDetails.trim() || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update itinerary stop');
      }

      toast.success('Itinerary updated!');
      cancelEditItinerary();
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update stop');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteItinerary = async (id: string) => {
    if (!trip) return;
    try {
      // Optimistic delete
      setItinerary(prev => prev.filter(i => i.id !== id));
      const res = await fetch(`/api/planning?trip_id=${trip.id}&id=${id}&kind=itinerary`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete itinerary stop');
      }
      toast.success('Stop removed from itinerary');
    } catch {
      toast.error('Could not delete stop');
      await loadData();
    }
  };

  // ==========================================
  // PACKING HANDLERS (Personal & shared checkoff)
  // ==========================================

  const handleAddPacking = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trip || !packingTitle.trim()) return;

    try {
      setIsSubmittingPacking(true);
      const res = await fetch('/api/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: trip.id,
          kind: 'packing',
          title: packingTitle.trim(),
          assigned_member_id: assignedMemberId || null,
          member_id: currentMember?.id || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to add packing item');
      }

      toast.success('Item added to packing checklist!');
      setPackingTitle('');
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add item');
    } finally {
      setIsSubmittingPacking(false);
    }
  };

  const togglePackingItem = async (item: PackingItem) => {
    if (!trip) return;
    const newStatus = !item.is_complete;

    // Optimistic toggle
    setPacking(prev =>
      prev.map(i => (i.id === item.id ? { ...i, is_complete: newStatus } : i))
    );

    try {
      const res = await fetch('/api/planning', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: trip.id,
          id: item.id,
          kind: 'packing',
          is_complete: newStatus,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update packing status');
      }

      if (newStatus) {
        toast.success(`Packed: "${item.title}"`);
      }
    } catch {
      toast.error('Could not update packing status');
      await loadData();
    }
  };

  const handleReassignPacking = async (itemId: string, memberId: string | null) => {
    if (!trip) return;
    setReassigningItemId(null);

    // Optimistic reassign
    const targetMember = members.find(m => m.id === memberId);
    setPacking(prev =>
      prev.map(i =>
        i.id === itemId
          ? {
              ...i,
              assigned_member_id: memberId,
              assigned_member: targetMember
                ? { id: targetMember.id, name: targetMember.name, color: targetMember.color }
                : null,
            }
          : i
      )
    );

    try {
      const res = await fetch('/api/planning', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: trip.id,
          id: itemId,
          kind: 'packing',
          assigned_member_id: memberId,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to reassign packing item');
      }

      toast.success(
        memberId
          ? `Assigned to ${targetMember?.name || 'crew member'}`
          : 'Marked as shared (unassigned)'
      );
    } catch {
      toast.error('Could not reassign item');
      await loadData();
    }
  };

  const handleDeletePacking = async (id: string) => {
    if (!trip) return;
    try {
      // Optimistic delete
      setPacking(prev => prev.filter(i => i.id !== id));
      const res = await fetch(`/api/planning?trip_id=${trip.id}&id=${id}&kind=packing`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete item');
      }
      toast.success('Packing item removed');
    } catch {
      toast.error('Could not delete packing item');
      await loadData();
    }
  };

  // Filtered packing items
  const filteredPacking = packing.filter(item => {
    if (packingFilter === 'all') return true;
    if (packingFilter === 'my') {
      return item.assigned_member_id === currentMember?.id;
    }
    return item.assigned_member_id === packingFilter;
  });

  const totalPacked = packing.filter(i => i.is_complete).length;
  const myItems = packing.filter(i => i.assigned_member_id === currentMember?.id);
  const myPacked = myItems.filter(i => i.is_complete).length;

  if (!trip) return null;

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--background)' }}>
      <TripHeader
        title="Plan &amp; Itinerary"
        subtitle="Collaborative itinerary &amp; member packing checklist"
      />

      <main className="max-w-4xl mx-auto w-full px-4 md:px-6 py-6 space-y-7 pb-nav">
        {/* ============================================================== */}
        {/* SECTION 1: PACKING CHECKLIST (With personal & crew check-off) */}
        {/* ============================================================== */}
        <section className="raised-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-outfit font-extrabold text-base sm:text-lg text-[var(--text-primary)]">
                  Packing Checklist
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Every crew member can check off what they have carried
                </p>
              </div>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-[var(--surface-inset)] border border-[var(--border)] text-xs font-mono font-bold flex items-center gap-2">
                <span className="text-emerald-500">
                  {totalPacked}/{packing.length} packed
                </span>
                {currentMember && (
                  <>
                    <span className="text-[var(--border)]">·</span>
                    <span className="text-[var(--text-secondary)]">
                      You: {myPacked}/{myItems.length}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Member Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setPackingFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer',
                packingFilter === 'all'
                  ? 'bg-[#2b56ff] text-white shadow-sm'
                  : 'bg-[var(--surface-inset)] text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] border border-[var(--border)]'
              )}
            >
              All Items ({packing.length})
            </button>

            {currentMember && (
              <button
                type="button"
                onClick={() => setPackingFilter('my')}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5',
                  packingFilter === 'my'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-[var(--surface-inset)] text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] border border-[var(--border)]'
                )}
              >
                <User className="w-3 h-3" />
                <span>My Items ({myItems.length})</span>
              </button>
            )}

            {members
              .filter(m => m.id !== currentMember?.id)
              .map(m => {
                const count = packing.filter(i => i.assigned_member_id === m.id).length;
                const active = packingFilter === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPackingFilter(m.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5',
                      active
                        ? 'bg-[var(--accent)] text-white shadow-sm'
                        : 'bg-[var(--surface-inset)] text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] border border-[var(--border)]'
                    )}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: m.color || '#94a3b8' }}
                    />
                    <span>{m.name} ({count})</span>
                  </button>
                );
              })}
          </div>

          {/* Add Item Form with Assignee Dropdown */}
          <form onSubmit={handleAddPacking} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={packingTitle}
              onChange={e => setPackingTitle(e.target.value)}
              placeholder="e.g. First-aid kit, Beach towel, Power bank..."
              className="flex-1 inset-field px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-primary)] rounded-xl"
            />

            <div className="flex gap-2">
              <select
                value={assignedMemberId}
                onChange={e => setAssignedMemberId(e.target.value)}
                className="inset-field px-3 py-2 text-xs font-bold text-[var(--text-primary)] rounded-xl cursor-pointer"
                title="Who will carry this item?"
              >
                {currentMember && (
                  <option value={currentMember.id}>
                    Assign: Me ({currentMember.name})
                  </option>
                )}
                <option value="">Assign: Anyone / Shared</option>
                {members
                  .filter(m => m.id !== currentMember?.id)
                  .map(m => (
                    <option key={m.id} value={m.id}>
                      Assign: {m.name}
                    </option>
                  ))}
              </select>

              <button
                type="submit"
                disabled={isSubmittingPacking || !packingTitle.trim()}
                className="px-4 py-2.5 rounded-xl text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Item</span>
              </button>
            </div>
          </form>

          {/* Packing Items List */}
          <div className="space-y-2 pt-1">
            {!loading && filteredPacking.length === 0 && (
              <div className="text-center py-8 rounded-2xl bg-[var(--surface-inset)] border border-dashed border-[var(--border)] space-y-1.5">
                <ClipboardList className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
                <p className="text-xs font-bold text-[var(--text-secondary)]">
                  {packingFilter === 'my'
                    ? 'You have no assigned packing items yet!'
                    : 'No packing items match this filter'}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Add items above or assign shared items to yourself to track what you carry.
                </p>
              </div>
            )}

            {filteredPacking.map(item => {
              const isAssignedToMe = item.assigned_member_id === currentMember?.id;
              const assignee =
                item.assigned_member ||
                members.find(m => m.id === item.assigned_member_id);

              return (
                <div
                  key={item.id}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-xl border transition-all gap-3 group',
                    item.is_complete
                      ? 'bg-emerald-500/[0.04] border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      : 'bg-[var(--surface-inset)] border-[var(--border)] hover:bg-[var(--surface-raised)]'
                  )}
                >
                  {/* Left: Checkbox & Title */}
                  <button
                    type="button"
                    onClick={() => togglePackingItem(item)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                    title={
                      item.is_complete
                        ? 'Click to mark as NOT carried'
                        : 'Click to check off (mark as carried)'
                    }
                  >
                    <span
                      className={cn(
                        'w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0',
                        item.is_complete
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                          : 'border-[var(--border-strong)] bg-[var(--surface-raised)] hover:border-emerald-500'
                      )}
                    >
                      {item.is_complete && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-xs sm:text-sm font-semibold truncate',
                          item.is_complete
                            ? 'line-through opacity-70 text-[var(--text-muted)]'
                            : 'text-[var(--text-primary)]'
                        )}
                      >
                        {item.title}
                      </p>
                    </div>
                  </button>

                  {/* Right: Assignee Pill & Action Menu */}
                  <div className="flex items-center gap-2 shrink-0 relative">
                    {/* Assignee Pill */}
                    {assignee ? (
                      <button
                        type="button"
                        onClick={() =>
                          setReassigningItemId(reassigningItemId === item.id ? null : item.id)
                        }
                        className={cn(
                          'px-2 py-1 rounded-lg text-[10px] font-bold font-mono flex items-center gap-1.5 transition-all border cursor-pointer',
                          isAssignedToMe
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border)]'
                        )}
                        title="Click to reassign to another crew member"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: assignee.color || '#94a3b8' }}
                        />
                        <span className="truncate max-w-[80px] sm:max-w-[110px]">
                          {isAssignedToMe ? 'Carried by You' : assignee.name}
                        </span>
                        <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => currentMember && handleReassignPacking(item.id, currentMember.id)}
                          className="px-2 py-1 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white border border-[var(--accent)]/30 text-[10px] font-bold transition-all cursor-pointer"
                          title="Assign to yourself"
                        >
                          I&apos;ll carry this
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setReassigningItemId(reassigningItemId === item.id ? null : item.id)
                          }
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                          title="Assign to another member"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Reassign Popover Menu */}
                    {reassigningItemId === item.id && (
                      <div
                        className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] shadow-xl p-1.5 z-30 space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
                        style={{ backdropFilter: 'blur(16px)' }}
                      >
                        <p className="px-2 py-1 text-[9px] font-mono uppercase font-bold text-[var(--text-muted)]">
                          Who is carrying this?
                        </p>
                        <button
                          type="button"
                          onClick={() => handleReassignPacking(item.id, null)}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] transition-colors cursor-pointer"
                        >
                          Anyone (Shared)
                        </button>
                        {members.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleReassignPacking(item.id, m.id)}
                            className={cn(
                              'w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-[var(--surface-inset)] transition-colors cursor-pointer',
                              m.id === item.assigned_member_id
                                ? 'text-[var(--accent)] font-bold'
                                : 'text-[var(--text-primary)]'
                            )}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: m.color || '#94a3b8' }}
                            />
                            <span className="truncate">
                              {m.id === currentMember?.id ? `${m.name} (You)` : m.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Delete Item */}
                    <button
                      type="button"
                      onClick={() => handleDeletePacking(item.id)}
                      className="w-7 h-7 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
                      title="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 2: ITINERARY (Editable by everyone in the crew)        */}
        {/* ============================================================== */}
        <section className="raised-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#2b56ff] flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-outfit font-extrabold text-base sm:text-lg text-[var(--text-primary)]">
                  Trip Itinerary
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Live stops, scheduled times &amp; shared notes · Editable by everyone
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingItinerary(!isAddingItinerary)}
              className="px-3 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              {isAddingItinerary ? (
                <>
                  <X className="w-3.5 h-3.5" /> Cancel
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Add Stop
                </>
              )}
            </button>
          </div>

          {/* New Itinerary Form */}
          {isAddingItinerary && (
            <form
              onSubmit={handleAddItinerary}
              className="p-4 rounded-2xl bg-[var(--surface-inset)] border border-[var(--border)] space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
                  New Itinerary Stop
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                    Stop Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newItineraryTitle}
                    onChange={e => setNewItineraryTitle(e.target.value)}
                    placeholder="e.g. Check in at hotel, Sunset dinner..."
                    className="w-full inset-field px-3 py-2 text-xs font-semibold text-[var(--text-primary)] rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                    Location / Venue
                  </label>
                  <input
                    type="text"
                    value={newItineraryLocation}
                    onChange={e => setNewItineraryLocation(e.target.value)}
                    placeholder="e.g. Baga Beach Road, Goa"
                    className="w-full inset-field px-3 py-2 text-xs font-semibold text-[var(--text-primary)] rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                    Date &amp; Scheduled Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newItineraryTime}
                    onChange={e => setNewItineraryTime(e.target.value)}
                    className="w-full inset-field px-3 py-2 text-xs font-semibold text-[var(--text-primary)] rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                    Notes / Booking Reference
                  </label>
                  <input
                    type="text"
                    value={newItineraryDetails}
                    onChange={e => setNewItineraryDetails(e.target.value)}
                    placeholder="e.g. Booking ID #4812, dress code: casual"
                    className="w-full inset-field px-3 py-2 text-xs font-semibold text-[var(--text-primary)] rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingItinerary(false)}
                  className="px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingItinerary || !newItineraryTitle.trim()}
                  className="px-4 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold shadow transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingItinerary ? 'Adding...' : 'Save Stop'}
                </button>
              </div>
            </form>
          )}

          {/* Itinerary Stops List */}
          <div className="space-y-3 pt-1">
            {!loading && itinerary.length === 0 && (
              <div className="text-center py-8 rounded-2xl bg-[var(--surface-inset)] border border-dashed border-[var(--border)] space-y-1.5">
                <CalendarDays className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
                <p className="text-xs font-bold text-[var(--text-secondary)]">
                  No itinerary stops added yet
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Add places, flights, dinner plans, or activities above to keep the crew in sync!
                </p>
              </div>
            )}

            {itinerary.map(item => {
              const isEditing = editingItineraryId === item.id;
              const formattedTime = formatItineraryTime(item.starts_at);

              if (isEditing) {
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[var(--surface-raised)] border-2 border-[var(--accent)] shadow-md space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--accent)] font-mono uppercase tracking-wider flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5" /> Edit Stop
                      </span>
                      <button
                        type="button"
                        onClick={cancelEditItinerary}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                          Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="w-full inset-field px-3 py-2 text-xs font-semibold text-[var(--text-primary)] rounded-xl"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                          Location
                        </label>
                        <input
                          type="text"
                          value={editLocation}
                          onChange={e => setEditLocation(e.target.value)}
                          className="w-full inset-field px-3 py-2 text-xs font-semibold text-[var(--text-primary)] rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                          Scheduled Time
                        </label>
                        <input
                          type="datetime-local"
                          value={editTime}
                          onChange={e => setEditTime(e.target.value)}
                          className="w-full inset-field px-3 py-2 text-xs font-semibold text-[var(--text-primary)] rounded-xl"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                          Notes / Details
                        </label>
                        <input
                          type="text"
                          value={editDetails}
                          onChange={e => setEditDetails(e.target.value)}
                          className="w-full inset-field px-3 py-2 text-xs font-semibold text-[var(--text-primary)] rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={cancelEditItinerary}
                        className="px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSavingEdit || !editTitle.trim()}
                        onClick={() => handleSaveItineraryEdit(item.id)}
                        className="px-4 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold shadow transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {isSavingEdit ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-3.5 sm:p-4 rounded-2xl bg-[var(--surface-inset)] border border-[var(--border)] hover:bg-[var(--surface-raised)] transition-all gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Time pill if present */}
                      {formattedTime && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--surface-raised)] text-[10px] font-mono font-bold text-[var(--accent)] border border-[var(--border)]">
                          <Clock className="w-3 h-3" />
                          <span>{formattedTime}</span>
                        </div>
                      )}

                      <h3 className="text-sm font-bold font-outfit text-[var(--text-primary)] truncate">
                        {item.title}
                      </h3>

                      {item.location_name && (
                        <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                          <span className="truncate">{item.location_name}</span>
                        </p>
                      )}

                      {item.details && (
                        <p className="text-[11px] text-[var(--text-muted)] bg-[var(--surface-raised)] p-2 rounded-lg mt-1 leading-relaxed">
                          {item.details}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions for everyone: Edit & Delete */}
                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => startEditItinerary(item)}
                      className="px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] hover:bg-[var(--surface-inset)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                      title="Edit this stop"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteItinerary(item.id)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] hover:bg-rose-500/10 hover:border-rose-500/30 text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                      title="Remove this stop"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
