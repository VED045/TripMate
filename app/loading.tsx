import { TripMateMark } from '@/components/shared/TripMateMark';

export default function Loading() {
  return (
    <main className="min-h-screen grid place-items-center px-6" style={{ background: 'var(--background)' }} aria-busy="true" aria-label="Loading TripMate">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl grid place-items-center text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)', boxShadow: '0 10px 30px rgba(43,86,255,.32)' }}>
          <TripMateMark className="w-8 h-8 animate-spin [animation-duration:1.35s]" />
        </div>
        <p className="text-xs font-bold tracking-[.16em] uppercase text-[var(--text-muted)] font-mono">Getting your trip ready</p>
      </div>
    </main>
  );
}
