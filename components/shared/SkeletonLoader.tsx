'use client';

import React from 'react';

export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/[0.06] rounded-xl ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
      <div className="flex justify-between items-center">
        <SkeletonLoader className="h-4 w-28" />
        <SkeletonLoader className="h-6 w-6 rounded-full" />
      </div>
      <SkeletonLoader className="h-8 w-36" />
      <SkeletonLoader className="h-3 w-48" />
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-square rounded-2xl bg-white/[0.05] animate-pulse border border-white/5" />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <SkeletonLoader className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <SkeletonLoader className="h-4 w-1/3" />
            <SkeletonLoader className="h-3 w-1/4" />
          </div>
          <SkeletonLoader className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}
