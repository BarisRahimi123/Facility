'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function GlassNavbar() {
  const router = useRouter();

  return (
    <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-black/80 border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="font-bold text-xl text-white tracking-tight">
          FacilityCore
        </Link>
        <div className="hidden md:flex gap-8 items-center">
          <Link href="/" className="text-gray-300 hover:text-white transition font-medium">Home</Link>
          <a href="#features" className="text-gray-300 hover:text-white transition font-medium">Features</a>
          <Link href="/pricing" className="text-gray-300 hover:text-white transition font-medium">Pricing</Link>
          <Link href="/auth/sign-in-simple" className="text-gray-300 hover:text-white transition font-medium">Sign In</Link>
          <Button 
            onClick={() => router.push('/auth/sign-up')}
            className="bg-purple-600 hover:bg-purple-700 text-white border-0 rounded-full px-6"
          >
            Try For Free
          </Button>
        </div>
        <div className="md:hidden">
          {/* Mobile menu button placeholder */}
        </div>
      </div>
    </nav>
  );
} 