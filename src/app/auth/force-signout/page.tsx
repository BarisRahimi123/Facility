'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ForceSignOutPage() {
  useEffect(() => {
    const forceSignOut = async () => {
      console.log('Force sign out initiated...');
      
      try {
        // Clear all localStorage
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
        
        // Try to sign out from Supabase
        const supabase = createClient();
        await supabase.auth.signOut();
        
        console.log('Sign out successful, redirecting...');
      } catch (error) {
        console.error('Error during sign out:', error);
      } finally {
        // Always redirect to sign-in page
        setTimeout(() => {
          window.location.href = '/auth/sign-in';
        }, 100);
      }
    };
    
    forceSignOut();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-4">Signing out...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  );
} 