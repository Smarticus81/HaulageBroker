import type { Metadata } from 'next';
import { Wordmark } from '@/components/brand/logo';
import { Avatar } from '@/components/ui/avatar';
import { Toaster } from '@/components/ui/toast';
import { drivers, truckById } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Driver',
  description: 'Snap your paperwork. Autopilot files it.',
};

/**
 * The driver capture app. Public, phone-first, no sidebar: a thin header with the
 * wordmark and the signed-in driver, then a single centered column.
 */
export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const driver = drivers[0];
  const truck = truckById(driver.truckId);
  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
          <Wordmark size="sm" />
          <div className="flex items-center gap-2.5">
            <div className="text-right leading-tight">
              <div className="text-[13px] font-semibold text-ink">{driver.name}</div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">Truck {truck.unit}</div>
            </div>
            <Avatar name={driver.name} size="sm" />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md px-4 pb-16 pt-5">{children}</main>
      <Toaster />
    </div>
  );
}
