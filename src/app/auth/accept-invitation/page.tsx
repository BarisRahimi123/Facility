'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, UserCheck, Shield } from 'lucide-react';
import Link from 'next/link';

interface InvitationData {
  id: string;
  email: string;
  role: string;
  invited_by: string;
  expires_at: string;
  metadata: any;
  facility_id?: string;
}

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || null;
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (token) {
      verifyInvitation();
    } else {
      toast.error('Invalid invitation link');
      router.push('/auth/sign-in');
    }
  }, [token]);

  const verifyInvitation = async () => {
    try {
      const supabase = createClient();
      
      // Verify invitation token
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('token', token)
        .is('accepted_at', null)
        .single();

      if (error || !data) {
        throw new Error('Invalid or expired invitation');
      }

      // Check if invitation is expired
      if (new Date(data.expires_at) < new Date()) {
        throw new Error('This invitation has expired');
      }

      setInvitation(data);
    } catch (error: any) {
      toast.error(error.message || 'Invalid invitation');
      router.push('/auth/sign-in');
    } finally {
      setVerifying(false);
    }
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation!.email,
        password: password,
        options: {
          data: {
            full_name: invitation!.metadata?.fullName || '',
            role: invitation!.role,
            invited_by: invitation!.invited_by,
            department: invitation!.metadata?.department || '',
            position: invitation!.metadata?.position || '',
            facility_id: invitation!.facility_id || null
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create account');

      // Create user record in database
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: invitation!.email,
          full_name: invitation!.metadata?.fullName || '',
          role: invitation!.role,
          department: invitation!.metadata?.department || '',
          position: invitation!.metadata?.position || '',
          invited_by: invitation!.invited_by,
          invited_at: new Date().toISOString(),
          is_active: true
        });

      if (userError) {
        console.error('Error creating user record:', userError);
      }

      // Mark invitation as accepted
      await supabase
        .from('user_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation!.id);

      toast.success('Account created successfully! Please sign in.');
      router.push('/auth/sign-in');

    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, { label: string; description: string }> = {
      sub_master: { label: 'Sub-Master Admin', description: 'Facility administration and staff management' },
      manager: { label: 'Manager', description: 'Facility management with approval authority' },
      coordinator: { label: 'Coordinator', description: 'Coordinate facility operations' },
      staff: { label: 'Staff', description: 'General facility staff member' },
      maintenance: { label: 'Maintenance', description: 'Maintenance team member' },
      vendor: { label: 'Vendor', description: 'External vendor or contractor' }
    };

    return roleMap[role] || { label: role, description: '' };
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800/50 backdrop-blur-sm border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Verifying invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const roleInfo = getRoleDisplay(invitation.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
              <UserCheck className="h-8 w-8 text-purple-400" />
            </div>
            <CardTitle className="text-2xl text-white">Accept Invitation</CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              You've been invited to join FacilityCore
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Invitation Details */}
            <div className="bg-gray-700/50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Invitation Details</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="text-white font-medium">{invitation.email}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Role</p>
                  <div className="flex items-start gap-3 mt-1">
                    <Shield className="h-5 w-5 text-purple-400 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">{roleInfo.label}</p>
                      <p className="text-sm text-gray-400">{roleInfo.description}</p>
                    </div>
                  </div>
                </div>

                {invitation.metadata?.department && (
                  <div>
                    <p className="text-sm text-gray-400">Department</p>
                    <p className="text-white font-medium">{invitation.metadata.department}</p>
                  </div>
                )}

                {invitation.metadata?.position && (
                  <div>
                    <p className="text-sm text-gray-400">Position</p>
                    <p className="text-white font-medium">{invitation.metadata.position}</p>
                  </div>
                )}

                {invitation.metadata?.customMessage && (
                  <div className="pt-3 border-t border-gray-600">
                    <p className="text-sm text-gray-400 mb-1">Personal Message</p>
                    <p className="text-gray-300 italic">"{invitation.metadata.customMessage}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Account Setup Form */}
            <form onSubmit={handleAcceptInvitation} className="space-y-6">
              <div>
                <Label htmlFor="password" className="text-gray-300">
                  Create Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-700/50 border-gray-600 text-white"
                  placeholder="Min. 8 characters"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Must be at least 8 characters long
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-gray-300">
                  Confirm Password *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-gray-700/50 border-gray-600 text-white"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? 'Creating account...' : 'Accept Invitation & Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/sign-in" className="text-purple-400 hover:text-purple-300">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 