'use client';

import dynamic from 'next/dynamic';

// Dynamically import the profile client component to avoid SSR issues
const ProfileClient = dynamic(() => import('./ProfileClient'), {
  loading: () => <div className="flex justify-center items-center h-screen bg-background text-foreground">Loading...</div>,
  ssr: false
});

export default function ProfilePage() {
  return <ProfileClient />;
} 