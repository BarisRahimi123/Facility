'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function TestLoginPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testCredentials = [
    { email: '85baris@gmail.com', role: 'master_admin' },
    { email: 'inub.baris@gmail.com', role: 'renter' },
    { email: 'test@example.com', role: 'renter' },
  ];

  const testLogin = async (email: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const supabase = createClient();
      
      // First, try to get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        setResult({
          status: 'Already logged in',
          user: currentSession.user,
          email: currentSession.user.email,
        });
        setLoading(false);
        return;
      }

      // For testing, we'll show what happens when we try to sign in
      setResult({
        status: 'Ready to test',
        message: `Would sign in with: ${email}`,
        note: 'Enter your password in the main sign-in page',
      });

    } catch (error: any) {
      console.error('Test error:', error);
      setError(error.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const supabase = createClient();
      
      // Check current auth status
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        setResult({ status: 'Not logged in' });
        return;
      }

      // Get user details
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', user?.email)
        .single();

      setResult({
        status: 'Logged in',
        session: {
          user_email: session.user.email,
          expires_at: new Date(session.expires_at! * 1000).toLocaleString(),
        },
        user: {
          id: user?.id,
          email: user?.email,
          created_at: user?.created_at,
        },
        profile: profile || 'No profile found',
      });

    } catch (error: any) {
      console.error('Auth check error:', error);
      setError(error.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setResult({ status: 'Signed out successfully' });
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Sign out failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Login Page</h1>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex gap-4 flex-wrap">
            <Button onClick={checkAuth} disabled={loading}>
              Check Current Auth Status
            </Button>
            <Button onClick={signOut} disabled={loading} variant="outline">
              Sign Out
            </Button>
            <Button 
              onClick={() => window.location.href = '/auth/sign-in'} 
              variant="outline"
            >
              Go to Sign In Page
            </Button>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Known Users</h2>
          <div className="space-y-2">
            {testCredentials.map(cred => (
              <div key={cred.email} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <p className="font-medium">{cred.email}</p>
                  <p className="text-sm text-muted-foreground">Role: {cred.role}</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => testLogin(cred.email)}
                  disabled={loading}
                >
                  Test
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {loading && (
          <Card className="p-6 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-3"></div>
              <span>Loading...</span>
            </div>
          </Card>
        )}

        {error && (
          <Card className="p-6 mb-6 bg-destructive/10 border-destructive">
            <h3 className="font-semibold text-destructive mb-2">Error</h3>
            <p className="text-sm">{error}</p>
          </Card>
        )}

        {result && (
          <Card className="p-6 mb-6">
            <h3 className="font-semibold mb-2">Result</h3>
            <pre className="text-sm bg-muted p-4 rounded overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
          <div className="space-y-2 text-sm">
            <p>Environment: {process.env.NODE_ENV}</p>
            <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}</p>
            <p>Time: {new Date().toLocaleString()}</p>
          </div>
        </Card>
      </div>
    </div>
  );
} 