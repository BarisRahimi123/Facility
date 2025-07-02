'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthTestPage() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cookies, setCookies] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
    checkCookies();
  }, []);

  const checkAuth = async () => {
    try {
      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCookies = () => {
    // Check for Supabase auth cookies
    const allCookies = document.cookie;
    setCookies(allCookies);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/sign-in';
  };

  const handleRefresh = async () => {
    setLoading(true);
    await checkAuth();
    checkCookies();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="font-semibold">Session Status:</p>
                  <p className={session ? 'text-green-500' : 'text-red-500'}>
                    {session ? 'Active Session' : 'No Session'}
                  </p>
                </div>

                <div>
                  <p className="font-semibold">User Status:</p>
                  <p className={user ? 'text-green-500' : 'text-red-500'}>
                    {user ? 'Authenticated' : 'Not Authenticated'}
                  </p>
                </div>

                {user && (
                  <div>
                    <p className="font-semibold">User Details:</p>
                    <pre className="bg-muted p-3 rounded-md overflow-auto text-xs">
                      {JSON.stringify(user, null, 2)}
                    </pre>
                  </div>
                )}

                {session && (
                  <div>
                    <p className="font-semibold">Session Details:</p>
                    <pre className="bg-muted p-3 rounded-md overflow-auto text-xs">
                      {JSON.stringify(session, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cookies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold mb-2">All Cookies:</p>
            <pre className="bg-muted p-3 rounded-md overflow-auto text-xs">
              {cookies || 'No cookies found'}
            </pre>
            <p className="text-sm text-muted-foreground mt-2">
              Look for cookies starting with 'sb-' which are Supabase auth cookies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <span className="font-semibold">Supabase URL:</span>{' '}
                <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-500' : 'text-red-500'}>
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not Set'}
                </span>
              </p>
              <p>
                <span className="font-semibold">Supabase Anon Key:</span>{' '}
                <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-500' : 'text-red-500'}>
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not Set'}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button onClick={handleRefresh}>Refresh Auth Status</Button>
          <Button onClick={handleSignOut} variant="destructive">Sign Out</Button>
          <Button onClick={() => window.location.href = '/auth/sign-in'} variant="outline">
            Go to Sign In
          </Button>
        </div>
      </div>
    </div>
  );
} 