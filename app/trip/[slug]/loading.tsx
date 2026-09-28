import { TripMateMark } from '@/components/shared/TripMateMark';

export default function TripLoading() {
  return (
    <div className="flex-1 p-4 sm:p-6" style={{ background: 'var(--background)' }} aria-busy="true" aria-label="Loading trip page">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-2 text-[var(--accent)]">
          <TripMateMark className="w-5 h-5 animate-spin [animation-duration:1.35s]" />
          <span className="text-[10px] uppercase tracking-widest font-bold font-mono">Loading trip</span>
        </div>
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-36 w-full rounded-[20px]" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="skeleton h-24" /><div className="skeleton h-24" /><div className="skeleton h-24 hidden sm:block" />
        </div>
        <div className="skeleton h-20 w-full" /><div className="skeleton h-20 w-full" />
      </div>
    </div>
  );
}
