'use client';

import './globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Requests', icon: FileText },
    { href: '/uploads', label: 'Uploads', icon: Upload },
  ];

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between h-14">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-gray-900">CarrierBackOffice</span>
                    <span className="text-xs text-gray-500 ml-1.5">Driver Portal</span>
                  </div>
                </Link>

                <nav className="flex items-center gap-1">
                  {navItems.map((item) => {
                    const isActive =
                      item.href === '/'
                        ? pathname === '/'
                        : pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
