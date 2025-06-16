'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Logo } from '@/components/ui/logo';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Check for error parameters in the URL
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');

    if (errorCode === 'otp_expired') {
      setError('The password reset link has expired. Please request a new one.');
      toast({
        title: 'Link Expired',
        description: 'The password reset link has expired. Please request a new one.',
        variant: 'destructive',
      });
    } else if (errorDescription) {
      setError(errorDescription.replace(/\+/g, ' '));
      toast({
        title: 'Error',
        description: errorDescription.replace(/\+/g, ' '),
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Your password has been updated successfully.',
      });

      // Add a small delay before redirecting
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/auth/sign-in');
    } catch (error: any) {
      console.error('Error updating password:', error);
      setError(error.message || 'An error occurred while updating your password');
      
      if (error.message.includes('session')) {
        toast({
          title: 'Session Expired',
          description: 'Please request a new password reset link.',
          variant: 'destructive',
        });
        
        // Add a small delay before redirecting
        await new Promise(resolve => setTimeout(resolve, 2000));
        router.push('/auth/reset-password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (error && error.includes('expired')) {
    return (
      <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="mt-6 text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Link Expired</h2>
            <p className="mt-2 text-gray-600">
              The password reset link has expired.
            </p>
            <Button
              className="mt-4"
              onClick={() => router.push('/auth/reset-password')}
            >
              Request New Link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Update your password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="password">New Password</Label>
              <div className="mt-2">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={error ? 'border-red-500' : ''}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="mt-2">
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={error ? 'border-red-500' : ''}
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              className="text-sm text-blue-600 hover:text-blue-500"
              onClick={() => router.push('/auth/reset-password')}
            >
              Request New Reset Link
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 