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
      fetchTripData();
    }
  }, [slug]);

  // Load saved current member from localStorage, auth claimed_trips, or fallback
  useEffect(() => {
    if (members.length > 0) {
      // 1. Check localStorage for this trip first
      const savedId = localStorage.getItem(`tripmate_active_member_${slug}`);
      if (savedId && members.some(m => m.id === savedId)) {
        setCurrentMemberIdState(savedId);
        return;
      }

      // 2. Check user_metadata.claimed_trips
      const claimed = user?.user_metadata?.claimed_trips?.find(
        (t: any) => t.trip_id === trip?.id || t.slug === slug || t.trip_slug === slug
      );
      if (claimed && members.some(m => m.id === claimed.member_id)) {
        setCurrentMemberIdState(claimed.member_id);
        localStorage.setItem(`tripmate_active_member_${slug}`, claimed.member_id);
        return;
      }

      // 3. If any member has auth_user_id matching user.id
      const linkedMember = user ? members.find((m: any) => m.auth_user_id === user.id) : null;
      if (linkedMember) {
        setCurrentMemberIdState(linkedMember.id);
        localStorage.setItem(`tripmate_active_member_${slug}`, linkedMember.id);
        return;
      }

      // 4. Fallback to first member
      setCurrentMemberIdState(members[0].id);
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
