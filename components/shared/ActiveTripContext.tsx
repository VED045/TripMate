'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Member, Trip } from '@/types';

interface ActiveTripContextType {
  trip: Trip | null;
  members: Member[];
  currentMember: Member | null;
  setCurrentMemberId: (id: string) => void;
  refreshTrip: () => Promise<void>;
  isLoading: boolean;
}

const ActiveTripContext = createContext<ActiveTripContextType>({
  trip: null,
  members: [],
  currentMember: null,
  setCurrentMemberId: () => {},
  refreshTrip: async () => {},
  isLoading: true,
});

import { useAuth } from '@/lib/auth/AuthContext';

export function ActiveTripProvider({
  children,
  slug,
  initialTrip,
  initialMembers,
}: {
  children: React.ReactNode;
  slug: string;
  initialTrip?: Trip;
  initialMembers?: Member[];
}) {
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(initialTrip || null);
  const [members, setMembers] = useState<Member[]>(initialMembers || []);
  const [currentMemberId, setCurrentMemberIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!initialTrip);

  const fetchTripData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/trips/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setTrip(data.trip);
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error('Failed to load trip', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialTrip) {
      queueMicrotask(() => { void fetchTripData(); });
    }
  }, [slug]);

  // Load saved current member from localStorage, auth claimed_trips, or fallback
  useEffect(() => {
    if (members.length > 0) {
      let nextMemberId: string | null = null;
      // 1. Check localStorage for this trip first
      const savedId = localStorage.getItem(`tripmate_active_member_${slug}`);
      if (savedId && members.some(m => m.id === savedId)) {
        nextMemberId = savedId;
      }

      // 2. Check user_metadata.claimed_trips
      const claimedTrips = user?.user_metadata?.claimed_trips;
      const claimed = Array.isArray(claimedTrips) ? claimedTrips.find(
        (entry): entry is { trip_id?: string; slug?: string; trip_slug?: string; member_id?: string } =>
          Boolean(entry) && typeof entry === 'object' &&
          ((entry as { trip_id?: string }).trip_id === trip?.id || (entry as { slug?: string }).slug === slug || (entry as { trip_slug?: string }).trip_slug === slug)
      ) : undefined;
      if (!nextMemberId && claimed?.member_id && members.some(m => m.id === claimed.member_id)) {
        nextMemberId = claimed.member_id;
      }

      // 3. If any member has auth_user_id matching user.id
      const linkedMember = user ? members.find(m => m.auth_user_id === user.id) : null;
      if (!nextMemberId && linkedMember) {
        nextMemberId = linkedMember.id;
      }

      // 4. Fallback to first member
      nextMemberId ??= members[0].id;
      const memberIdToApply = nextMemberId;
      queueMicrotask(() => {
        setCurrentMemberIdState(memberIdToApply);
        localStorage.setItem(`tripmate_active_member_${slug}`, memberIdToApply);
      });
    }
  }, [members, slug, user, trip?.id]);

  const setCurrentMemberId = (id: string) => {
    setCurrentMemberIdState(id);
    localStorage.setItem(`tripmate_active_member_${slug}`, id);
  };

  const currentMember = members.find(m => m.id === currentMemberId) || members[0] || null;

  return (
    <ActiveTripContext.Provider
      value={{
        trip,
        members,
        currentMember,
        setCurrentMemberId,
        refreshTrip: fetchTripData,
        isLoading,
      }}
    >
      {children}
    </ActiveTripContext.Provider>
  );
}

export function useActiveTrip() {
  return useContext(ActiveTripContext);
}
