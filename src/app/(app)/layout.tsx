'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import TopBar from '@/components/layout/TopBar';
import Sidebar from '@/components/layout/Sidebar';

// Use dynamic imports for heavy components
const ChatAssistant = dynamic(() => import('@/components/chat/ChatAssistant'), {
  loading: () => null,
  ssr: false
});

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Top Navigation */}
      <header className="h-[60px] border-b border-gray-800 flex items-center px-6 bg-gray-900/50 backdrop-blur-md">
        <div className="flex items-center justify-between w-full max-w-[1400px] mx-auto">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-xl text-white">FacilityCore</span>
              <span className="text-xs px-2 py-1 bg-purple-600 text-white rounded-full">BETA</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              <Link href="/facilities" className="text-sm font-medium text-purple-400 hover:text-purple-300 transition">Facilities</Link>
              <Link href="/people" className="text-sm font-medium text-gray-400 hover:text-white transition">People</Link>
            </nav>
          </div>

          {/* TopBar Component */}
          <Suspense fallback={<div className="h-10 w-40 bg-gray-800 animate-pulse rounded"></div>}>
            <TopBar />
          </Suspense>
        </div>
      </header>

      {/* Main Content with Conditional Sidebar */}
      <div className="flex-1 flex">
        {/* Conditionally render Sidebar */}
        {pathname !== '/facilities' && (
          <div className="w-64 bg-gray-900 border-r border-gray-800">
            <Suspense fallback={<div className="w-64 h-screen bg-gray-900 animate-pulse"></div>}>
              <Sidebar />
            </Suspense>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 bg-black">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full bg-black">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          }>
            {children}
          </Suspense>
        </div>
      </div>

      {/* Chat Assistant */}
      <Suspense fallback={null}>
        <ChatAssistant />
      </Suspense>
    </div>
  );
} 