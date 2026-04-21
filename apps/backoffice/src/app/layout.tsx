'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { CopilotPanel } from '@/components/copilot-panel';
import { cn } from '@/lib/utils';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
        />
        <Topbar
          sidebarCollapsed={sidebarCollapsed}
          copilotOpen={copilotOpen}
          onToggleCopilot={() => setCopilotOpen((o) => !o)}
        />
        <main
          className={cn(
            'pt-14 min-h-screen bg-slate-50 transition-all duration-200',
            sidebarCollapsed ? 'pl-[72px]' : 'pl-[260px]',
            copilotOpen && 'pr-[400px]',
          )}
        >
          <div className="p-6">{children}</div>
        </main>
        <CopilotPanel
          open={copilotOpen}
          onClose={() => setCopilotOpen(false)}
        />
      </body>
    </html>
  );
}
