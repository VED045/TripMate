import type { SVGProps } from 'react';

/** A compact navigation mark: cardinal bearings, route ring, and travelling arrow. */
export function TripMateMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} role="img" aria-label="TripMate" {...props}>
      <circle cx="24" cy="24" r="21" fill="currentColor" opacity=".1" />
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.2" opacity=".95" />
      <circle cx="24" cy="24" r="13.5" stroke="currentColor" strokeWidth=".8" strokeDasharray="1.5 2.4" opacity=".42" />
      <path d="M24 12.5v3.2M35.5 24h-3.2M24 35.5v-3.2M12.5 24h3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <text x="24" y="8.9" textAnchor="middle" fill="currentColor" fontSize="4.8" fontWeight="800" fontFamily="Arial, sans-serif">N</text>
      <text x="39.5" y="25.7" textAnchor="middle" fill="currentColor" fontSize="4.2" fontWeight="700" fontFamily="Arial, sans-serif">E</text>
      <text x="24" y="40.4" textAnchor="middle" fill="currentColor" fontSize="4.2" fontWeight="700" fontFamily="Arial, sans-serif">S</text>
      <text x="8.5" y="25.7" textAnchor="middle" fill="currentColor" fontSize="4.2" fontWeight="700" fontFamily="Arial, sans-serif">W</text>
      <path d="M24 15.8 27 22.1 33.2 24 27 26 24 32.2 21 26 14.8 24 21 22.1 24 15.8Z" fill="currentColor" opacity=".26" />
      <path d="m30.5 16.2-5.1 11.6-8.2 6.1 3.7-9.2 9.6-8.5Z" fill="currentColor" />
      <path d="m20.9 24.7 4.5 3.1 5.1-11.6-9.6 8.5Z" fill="white" opacity=".96" />
      <circle cx="24" cy="24" r="2.8" fill="white" />
      <circle cx="24" cy="24" r="1.2" fill="currentColor" />
      <path d="M14 15.2c2.1-2.2 4.3-3.6 6.8-4.1" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeDasharray="1.4 2.2" opacity=".7" />
    </svg>
  );
}
