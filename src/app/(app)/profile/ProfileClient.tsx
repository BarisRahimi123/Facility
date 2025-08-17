'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, UserCog, User, Settings, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ProfileClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: ''
  });
  const [accountData, setAccountData] = useState({
    role: 'renter' as 'staff' | 'manager' | 'coordinator' | 'vendor' | 'renter',
    isActive: true
  });

  // Load user profile from database
  useEffect(() => {
    async function loadUserProfile() {
      try {
        setIsLoading(true);
        setHasError(false);
        
        // Get current authenticated user
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.log('Authentication error:', authError.message);
          // If auth session is missing, redirect to sign-in
          if (authError.message.includes('Auth session missing') || authError.message.includes('session_not_found')) {
            toast.error('Your session has expired. Please sign in again.');
            router.push('/auth/sign-in');
            return;
          }
          throw new Error(`Authentication error: ${authError.message}`);
        }
        
        if (!user) {
          console.log('No user found, redirecting to sign-in');
          toast.error('Please sign in to access your profile.');
          router.push('/auth/sign-in');
          return;
        }
        
        setCurrentUser(user);
        
        // Load user profile from database
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" - that's okay, we'll create a default profile
          console.warn('Error loading user profile:', profileError.message);
        }
        
        if (profile) {
          setUserProfile(profile);
          setAccountData({
            role: profile.role || 'renter',
            isActive: profile.is_active ?? true
          });
        } else {
          // Create a default profile for demo
          const defaultProfile = {
            email: user.email,
            full_name: user.user_metadata?.full_name || 'Demo User',
            role: 'staff',
            is_active: true
          };
          setUserProfile(defaultProfile);
          setAccountData({
            role: defaultProfile.role as any,
            isActive: defaultProfile.is_active
          });
        }
        
        // Set profile form data
        setProfileData({
          firstName: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '',
          lastName: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ')[1] || '',
          email: user.email || '',
          phone: user.user_metadata?.phone || profile?.phone || '',
          company: user.user_metadata?.company || '',
          jobTitle: user.user_metadata?.job_title || ''
        });
        
      } catch (err: any) {
        console.error('Error fetching user profile:', err);
        setHasError(true);
        setErrorMessage(err.message || 'Failed to load profile');
        toast.error('Error loading profile');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUserProfile();
    
    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setHasError(true);
        setErrorMessage('Profile loading timed out. Please refresh the page.');
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timeout);
  }, [router]);

  async function handleAccountSubmit() {
    try {
      setIsUpdating(true);
      
      if (!currentUser?.email) {
        throw new Error('No user email available');
      }
      
      // Update role in the users table
      const { error: dbError } = await supabase
        .from('users')
        .update({ 
          role: accountData.role,
          is_active: accountData.isActive 
        })
        .eq('email', currentUser.email);
      
      if (dbError) {
        throw dbError;
      }
      
      // Update local state
      setUserProfile((prev: any) => ({
        ...prev,
        role: accountData.role,
        is_active: accountData.isActive
      }));
      
      toast.success(`Role updated to ${accountData.role}. Please refresh the page to see changes.`);
      
      // Refresh the page after a short delay to reflect role changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Error updating account:', error);
      toast.error(`Error updating account: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleProfileSubmit() {
    try {
      setIsUpdating(true);
      
      if (!currentUser) {
        throw new Error('No user available');
      }
      
      // Update auth metadata
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          full_name: `${profileData.firstName} ${profileData.lastName}`,
          phone: profileData.phone,
          company: profileData.company,
          job_title: profileData.jobTitle,
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(`Error updating profile: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  }

  // Handle sign in redirect
  const handleSignIn = () => {
    router.push('/auth/sign-in');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className="container py-10">
        <div className="max-w-4xl mx-auto">
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
          <div className="text-center space-y-4">
            <Button 
              onClick={() => window.location.reload()}
              className="mb-2"
            >
              Retry Loading Profile
            </Button>
            <Button 
              onClick={handleSignIn}
              variant="outline"
            >
              Sign In Again
            </Button>
            <p className="text-muted-foreground">
              If the problem persists, please contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show main profile interface
  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData((prev: any) => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData((prev: any) => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Your email address is your unique identifier and cannot be changed
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData((prev: any) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={profileData.company}
                      onChange={(e) => setProfileData((prev: any) => ({ ...prev, company: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={profileData.jobTitle}
                      onChange={(e) => setProfileData((prev: any) => ({ ...prev, jobTitle: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleProfileSubmit} disabled={isUpdating}>
                    {isUpdating ? "Updating..." : "Update Profile"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="space-y-6">
            {userProfile && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Current Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Current Role</label>
                      <p className="text-lg font-semibold capitalize text-primary">
                        {userProfile.role || 'No role assigned'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Account Status</label>
                      <p className={`text-lg font-semibold ${userProfile.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        {userProfile.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Update Account Information
                </CardTitle>
                <CardDescription>
                  Change your role and account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={accountData.role} onValueChange={(value: any) => setAccountData((prev: any) => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="coordinator">Coordinator</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="renter">Renter</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your role determines access level. Admin roles: Staff, Manager, Coordinator.
                  </p>
                </div>
                
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Account Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Manage your account status
                    </p>
                  </div>
                  <Switch
                    checked={accountData.isActive}
                    onCheckedChange={(checked) => setAccountData((prev: any) => ({ ...prev, isActive: checked }))}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleAccountSubmit} disabled={isUpdating}>
                    {isUpdating ? "Updating..." : "Update Account"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 