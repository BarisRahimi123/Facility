'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function TestAuthPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [authTimeout, setAuthTimeout] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  // Add a timeout effect to prevent infinite loading
  useEffect(() => {
    if (authLoading) {
      const timer = setTimeout(() => {
        console.log('Authentication loading timeout reached');
        setAuthTimeout(true);
      }, 10000); // 10 seconds timeout
      
      return () => clearTimeout(timer);
    }
  }, [authLoading]);
  
  // Add a timer to track how long authentication is taking
  useEffect(() => {
    if (authLoading && !authTimeout) {
      const interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [authLoading, authTimeout]);

  if (authLoading && !authTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-500">Please wait while we authenticate you</p>
          <p className="text-gray-400 mt-2">Time elapsed: {timeElapsed} seconds</p>
          <p className="text-xs text-gray-400 mt-4">If this takes too long, try refreshing the page</p>
        </div>
      </div>
    );
  }

  if (authTimeout && authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Timeout</h2>
          <p className="text-gray-500">Authentication is taking longer than expected.</p>
          <p className="text-gray-500">This could be due to network issues or server problems.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Authentication Status</h2>
        <p className="text-gray-500">
          {user ? `Authenticated as: ${user.email}` : 'Not authenticated'}
        </p>
        <pre className="mt-4 p-4 bg-gray-100 rounded text-left overflow-auto max-w-lg">
          {user ? JSON.stringify(user, null, 2) : 'No user data'}
        </pre>
      </div>
    </div>
  );
} 