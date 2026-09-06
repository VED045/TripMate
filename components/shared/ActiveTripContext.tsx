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

  // Load saved current member from localStorage if available
  useEffect(() => {
    if (members.length > 0) {
      const savedId = localStorage.getItem(`tripmate_active_member_${slug}`);
      if (savedId && members.some(m => m.id === savedId)) {
        setCurrentMemberIdState(savedId);
      } else {
        setCurrentMemberIdState(members[0].id);
      }
    }
  }, [members, slug]);

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
