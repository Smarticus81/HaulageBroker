'use client';

import { useEffect, useState } from 'react';
import { AutopilotOrb } from '@/components/ui/orb';

export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

/**
 * The app is personal and time-relative (persisted session, "2 hours ago"),
 * so it renders on the client only. Until then, a quiet loading mark.
 */
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  if (!mounted) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg">
        <AutopilotOrb mode="act" size={14} />
      </div>
    );
  }
  return <>{children}</>;
}
