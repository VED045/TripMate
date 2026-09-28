'use client';

import { Plane } from 'lucide-react';
import { usePathname } from 'next/navigation';

/** A lightweight, CSS-only route transition that never delays navigation. */
export function PageWaveTransition() {
  const pathname = usePathname();
  return (
    <div key={pathname} className="tripmate-route-transition" aria-hidden="true">
      <span className="tripmate-route-glow" />
      <span className="tripmate-route-trail tripmate-route-trail-one" />
      <span className="tripmate-route-trail tripmate-route-trail-two" />
      <span className="tripmate-route-plane"><Plane strokeWidth={2.4} /></span>
    </div>
  );
}
