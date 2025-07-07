'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import Sidebar from '@/components/layout/Sidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar - Always visible */}
      <div className="w-64 flex-shrink-0">
        <Suspense fallback={<div className="w-64 h-screen bg-background border-r border-border animate-pulse"></div>}>
          <Sidebar />
        </Suspense>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Simplified Top Bar */}
        <header className="h-[60px] border-b border-border flex items-center px-6 bg-background/95 backdrop-blur-md">
          <div className="flex items-center justify-end w-full">
            {/* TopBar Component - Only controls, no navigation */}
            <Suspense fallback={<div className="h-10 w-40 bg-muted animate-pulse rounded"></div>}>
              <TopBar />
            </Suspense>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-background">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full bg-background">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          }>
            {children}
          </Suspense>
        </main>
      </div>


    </div>
  );
} 