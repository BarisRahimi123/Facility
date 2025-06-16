'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SupabaseTest() {
  const [projectDetails, setProjectDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, session, signOut } = useAuth();

  // Fetch Supabase project details to confirm connection
  useEffect(() => {
    async function fetchProjectDetails() {
      try {
        // Simple query to check connection
        const { data, error } = await supabase
          .from('_test_connection')
          .select('*')
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.log('Connection test query error:', error);
          // This is expected to fail, but confirms connection
          if (error.code === 'PGRST116') {
            setProjectDetails({ 
              connected: true, 
              message: 'Successfully connected to Supabase!' 
            });
          } else {
            setError(`Connection error: ${error.message}`);
          }
        } else {
          setProjectDetails({ 
            connected: true, 
            message: 'Successfully connected to Supabase!',
            data 
          });
        }
      } catch (err) {
        console.error('Error testing connection:', err);
        setError(`Failed to connect: ${err}`);
      }
    }

    fetchProjectDetails();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
      
      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-red-500">{error}</div>
            ) : !projectDetails ? (
              <div>Testing connection...</div>
            ) : (
              <div className="text-green-500">
                {projectDetails.message}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="font-medium text-green-700">Authenticated!</h3>
                  <p className="mt-2 text-sm">Logged in as: {user.email}</p>
                  <p className="text-sm">User ID: {user.id}</p>
                </div>
                
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48">
                  {JSON.stringify({ user, session }, null, 2)}
                </pre>
                
                <Button 
                  onClick={() => signOut()}
                  variant="outline"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h3 className="font-medium text-yellow-700">Not authenticated</h3>
                  <p className="mt-1 text-sm">You are not currently signed in.</p>
                </div>
                <Button 
                  onClick={() => window.location.href = '/auth/sign-in'}
                >
                  Go to Sign In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 