'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInSimpleRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main sign-in page
    router.replace('/auth/sign-in');
  }, [router]);

  // Show a loading state while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting to sign-in page...</p>
      </div>
    </div>
  );
} 