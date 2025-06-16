'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function TestAuthMockPage() {
  const { user, isLoading: authLoading, authError } = useAuth();
  const [authTimeout, setAuthTimeout] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [mockData, setMockData] = useState<any[]>([]);
  const [isLoadingMockData, setIsLoadingMockData] = useState(false);
  const { toast } = useToast();
  
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

  // Load mock data when authentication fails or times out
  useEffect(() => {
    if ((authTimeout && authLoading) || authError) {
      loadMockData();
    }
  }, [authTimeout, authLoading, authError]);

  const loadMockData = async () => {
    setIsLoadingMockData(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const data = [
        { id: 1, name: 'Mock Item 1', description: 'This is a mock item' },
        { id: 2, name: 'Mock Item 2', description: 'This is another mock item' },
        { id: 3, name: 'Mock Item 3', description: 'This is yet another mock item' }
      ];
      
      setMockData(data);
      toast({
        title: 'Mock Data Loaded',
        description: 'Using mock data due to authentication issues',
      });
    } catch (error) {
      console.error('Error loading mock data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load mock data',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMockData(false);
    }
  };

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

  if ((authTimeout && authLoading) || authError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Authentication Issue</h2>
          <p className="text-gray-500 mb-4">
            {authError 
              ? 'We encountered an error during authentication.' 
              : 'Authentication is taking longer than expected.'}
          </p>
          <p className="text-gray-500 mb-6">We're using mock data instead.</p>
          
          {isLoadingMockData ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-md text-left">
              <h3 className="font-medium mb-2">Mock Data:</h3>
              <ul className="space-y-2">
                {mockData.map(item => (
                  <li key={item.id} className="p-2 bg-white rounded border border-gray-200">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-6 flex justify-center gap-4">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Try Again
            </Button>
            <Button 
              onClick={loadMockData}
              disabled={isLoadingMockData}
            >
              {isLoadingMockData ? 'Loading...' : 'Reload Mock Data'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">Authentication Status</h2>
        <p className="text-gray-500 mb-4">
          {user ? `Authenticated as: ${user.email}` : 'Not authenticated'}
        </p>
        <div className="bg-gray-50 p-4 rounded-md text-left overflow-auto max-h-80">
          <pre className="text-xs">
            {user ? JSON.stringify(user, null, 2) : 'No user data'}
          </pre>
        </div>
        <div className="mt-6">
          <Button onClick={() => window.location.href = '/plans'}>
            Go to Plans Page
          </Button>
        </div>
      </div>
    </div>
  );
} 