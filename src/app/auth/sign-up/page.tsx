'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NoSSR } from '@/components/ui/no-ssr';
import { AuthLoadingSkeleton } from '@/components/ui/auth-loading-skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, Check, Building2, Users } from 'lucide-react';
import Link from 'next/link';

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accountType, setAccountType] = useState<'individual' | 'organization'>('individual');
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is coming from reservation flow
  const returnTo = searchParams?.get('returnTo');
  const reservationType = searchParams?.get('type');
  const preserveData = searchParams?.get('preserveData') === 'true';

  const saveReservationData = (data: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pendingReservationData', JSON.stringify(data));
    }
  };

  const getReservationData = () => {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('pendingReservationData');
      return data ? JSON.parse(data) : null;
    }
    return null;
  };

  const clearReservationData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pendingReservationData');
    }
  };

  const handlePostSignupRedirect = () => {
    if (returnTo === 'reservation' && reservationType) {
      // Redirect back to the appropriate reservation flow
      if (reservationType === 'facility') {
        router.push('/facilities-map?resumeReservation=true');
      } else if (reservationType === 'field') {
        router.push('/facilities-map?resumeReservation=true');
      } else {
        router.push('/facilities-map');
      }
    } else {
      router.push('/facilities-map');
    }
  };

  // Individual form data
  const [individualData, setIndividualData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // Organization form data
  const [organizationData, setOrganizationData] = useState({
    // Organization info
    organization_name: '',
    organization_type: 'commercial',
    tax_id: '',
    // Primary contact
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    billing_email: '',
    // Address
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    // Account
    password: '',
    confirmPassword: '',
  });

  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (individualData.password !== individualData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: individualData.email,
        password: individualData.password,
        options: {
          data: {
            full_name: individualData.full_name,
            phone: individualData.phone,
            role: 'renter',
            account_type: 'individual',
          },
        },
      });

      if (authError) throw authError;

      // Check if user needs email verification
      if (authData.user && !authData.session) {
        // User created but needs email verification
        toast.success('Account created! Please check your email and click the verification link to complete your registration.');
        let verifyUrl = `/auth/verify-email?email=${encodeURIComponent(individualData.email)}`;
        if (returnTo && reservationType) {
          verifyUrl += `&returnTo=${returnTo}&type=${reservationType}&preserveData=${preserveData}`;
        }
        router.push(verifyUrl);
        return;
      }

      // If we have a session, user is immediately signed in (email confirmation disabled)
      if (authData.session) {
        // Create user record in our users table
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user?.id,
            email: individualData.email,
            full_name: individualData.full_name,
            phone: individualData.phone,
            role: 'renter',
            is_active: true,
          });

        if (userError) {
          console.error('Error creating user record:', userError);
          // Continue anyway as auth was successful
        }

        toast.success('Account created successfully! Welcome to FacilityCore.');
        handlePostSignupRedirect();
        return;
      }

    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrganizationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (organizationData.password !== organizationData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // First, create the organization in the database
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          type: 'renter',
          subtype: organizationData.organization_type as 'commercial' | 'nonprofit',
          name: organizationData.organization_name,
          tax_id: organizationData.tax_id || null,
          primary_contact_name: organizationData.contact_name,
          primary_contact_email: organizationData.contact_email,
          primary_contact_phone: organizationData.contact_phone,
          billing_email: organizationData.billing_email || null,
          street_address: organizationData.street_address,
          city: organizationData.city,
          state: organizationData.state,
          zip_code: organizationData.zip_code,
          country: 'US',
          is_active: true,
          requires_insurance: organizationData.organization_type === 'commercial',
          minimum_liability_coverage: organizationData.organization_type === 'commercial' ? 1000000 : 500000,
        })
        .select()
        .single();

      if (orgError) {
        throw new Error(orgError.message);
      }

      // Sign up the primary contact as a user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: organizationData.contact_email,
        password: organizationData.password,
        options: {
          data: {
            full_name: organizationData.contact_name,
            phone: organizationData.contact_phone,
            role: 'renter',
            account_type: 'organization',
            organization_id: orgData.id,
            organization_name: organizationData.organization_name,
          },
        },
      });

      if (authError) throw authError;

      // Check if user needs email verification
      if (authData.user && !authData.session) {
        // User created but needs email verification
        toast.success('Organization account created! Please check your email and click the verification link to complete your registration.');
        let verifyUrl = `/auth/verify-email?email=${encodeURIComponent(organizationData.contact_email)}`;
        if (returnTo && reservationType) {
          verifyUrl += `&returnTo=${returnTo}&type=${reservationType}&preserveData=${preserveData}`;
        }
        router.push(verifyUrl);
        return;
      }

      // If we have a session, user is immediately signed in (email confirmation disabled)
      if (authData.session) {
        // Create user record in our users table
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user?.id,
            email: organizationData.contact_email,
            full_name: organizationData.contact_name,
            phone: organizationData.contact_phone,
            role: 'renter',
            is_active: true,
            organization_id: orgData.id,
          });

        if (userError) {
          console.error('Error creating user record:', userError);
          // Continue anyway as auth was successful
        }

        toast.success('Organization account created successfully! Welcome to FacilityCore.');
        handlePostSignupRedirect();
        return;
      }

    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to create organization account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <div className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-border p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h1 className="text-3xl font-bold text-foreground">FacilityCore</h1>
              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">BETA</span>
            </div>
            <h2 className="text-xl text-foreground">Create your account</h2>
            <p className="text-muted-foreground mt-2">
              Already have an account?{' '}
              <Link href="/auth/sign-in" className="text-primary hover:text-primary/80">
                Sign in
              </Link>
            </p>
          </div>

          {/* Account Type Selection */}
          <div className="mb-8">
            <Label className="text-foreground mb-4 block">Account Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className={`cursor-pointer transition-all ${
                  accountType === 'individual'
                    ? 'bg-primary/20 border-primary'
                    : 'bg-card border-border hover:bg-accent'
                }`}
                onClick={() => setAccountType('individual')}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Users className="h-6 w-6 text-primary mt-1" />
                      <div>
                        <h3 className="font-semibold text-foreground">Individual</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Personal account for individual facility rentals
                        </p>
                      </div>
                    </div>
                    {accountType === 'individual' && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  accountType === 'organization'
                    ? 'bg-primary/20 border-primary'
                    : 'bg-card border-border hover:bg-accent'
                }`}
                onClick={() => setAccountType('organization')}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Building2 className="h-6 w-6 text-primary mt-1" />
                      <div>
                        <h3 className="font-semibold text-foreground">Organization</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Business or organization account with multiple users
                        </p>
                      </div>
                    </div>
                    {accountType === 'organization' && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Forms */}
          {accountType === 'individual' ? (
            <form onSubmit={handleIndividualSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="full_name" className="text-foreground">
                    Full Name *
                  </Label>
                  <Input
                    id="full_name"
                    type="text"
                    value={individualData.full_name}
                    onChange={(e) =>
                      setIndividualData({ ...individualData, full_name: e.target.value })
                    }
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-foreground">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={individualData.email}
                    onChange={(e) =>
                      setIndividualData({ ...individualData, email: e.target.value })
                    }
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-foreground">
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={individualData.phone}
                    onChange={(e) =>
                      setIndividualData({ ...individualData, phone: e.target.value })
                    }
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-foreground">
                    Password *
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={individualData.password}
                    onChange={(e) =>
                      setIndividualData({ ...individualData, password: e.target.value })
                    }
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">
                    Confirm Password *
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={individualData.confirmPassword}
                    onChange={(e) =>
                      setIndividualData({ ...individualData, confirmPassword: e.target.value })
                    }
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading ? 'Creating account...' : 'Create individual account'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOrganizationSubmit} className="space-y-8">
              {/* Organization Information */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Organization Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="org_name" className="text-foreground">
                      Organization Name *
                    </Label>
                    <Input
                      id="org_name"
                      type="text"
                      value={organizationData.organization_name}
                      onChange={(e) =>
                        setOrganizationData({
                          ...organizationData,
                          organization_name: e.target.value,
                        })
                      }
                      required
                      className="bg-input border-border text-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor="org_type" className="text-foreground">
                      Organization Type *
                    </Label>
                    <Select
                      value={organizationData.organization_type}
                      onValueChange={(value) =>
                        setOrganizationData({ ...organizationData, organization_type: value })
                      }
                    >
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="nonprofit">Non-Profit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tax_id" className="text-foreground">
                      Tax ID / EIN (Optional)
                    </Label>
                    <Input
                      id="tax_id"
                      type="text"
                      value={organizationData.tax_id}
                      onChange={(e) =>
                        setOrganizationData({ ...organizationData, tax_id: e.target.value })
                      }
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Primary Contact */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Primary Contact (Account Owner)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_name" className="text-foreground">
                      Contact Name *
                    </Label>
                    <Input
                      id="contact_name"
                      type="text"
                      value={organizationData.contact_name}
                      onChange={(e) =>
                        setOrganizationData({ ...organizationData, contact_name: e.target.value })
                      }
                      required
                      className="bg-input border-border text-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact_email" className="text-foreground">
                      Contact Email *
                    </Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={organizationData.contact_email}
                      onChange={(e) =>
                        setOrganizationData({ ...organizationData, contact_email: e.target.value })
                      }
                      required
                      className="bg-input border-border text-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact_phone" className="text-foreground">
                      Contact Phone *
                    </Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      value={organizationData.contact_phone}
                      onChange={(e) =>
                        setOrganizationData({ ...organizationData, contact_phone: e.target.value })
                      }
                      required
                      className="bg-input border-border text-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor="billing_email" className="text-foreground">
                      Billing Email (Optional)
                    </Label>
                    <Input
                      id="billing_email"
                      type="email"
                      value={organizationData.billing_email}
                      onChange={(e) =>
                        setOrganizationData({ ...organizationData, billing_email: e.target.value })
                      }
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Organization Address */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Organization Address</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="street_address" className="text-foreground">
                      Street Address *
                    </Label>
                    <Input
                      id="street_address"
                      type="text"
                      value={organizationData.street_address}
                      onChange={(e) =>
                        setOrganizationData({
                          ...organizationData,
                          street_address: e.target.value,
                        })
                      }
                      required
                      className="bg-input border-border text-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city" className="text-foreground">
                        City *
                      </Label>
                      <Input
                        id="city"
                        type="text"
                        value={organizationData.city}
                        onChange={(e) =>
                          setOrganizationData({ ...organizationData, city: e.target.value })
                        }
                        required
                        className="bg-input border-border text-foreground"
                      />
                    </div>

                    <div>
                      <Label htmlFor="state" className="text-foreground">
                        State *
                      </Label>
                      <Input
                        id="state"
                        type="text"
                        value={organizationData.state}
                        onChange={(e) =>
                          setOrganizationData({ ...organizationData, state: e.target.value })
                        }
                        required
                        className="bg-input border-border text-foreground"
                      />
                    </div>

                    <div>
                      <Label htmlFor="zip_code" className="text-foreground">
                        ZIP Code *
                      </Label>
                      <Input
                        id="zip_code"
                        type="text"
                        value={organizationData.zip_code}
                        onChange={(e) =>
                          setOrganizationData({ ...organizationData, zip_code: e.target.value })
                        }
                        required
                        className="bg-input border-border text-foreground"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Security */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Account Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="org_password" className="text-foreground">
                      Password *
                    </Label>
                    <Input
                      id="org_password"
                      type="password"
                      value={organizationData.password}
                      onChange={(e) =>
                        setOrganizationData({ ...organizationData, password: e.target.value })
                      }
                      required
                      className="bg-input border-border text-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor="org_confirmPassword" className="text-foreground">
                      Confirm Password *
                    </Label>
                    <Input
                      id="org_confirmPassword"
                      type="password"
                      value={organizationData.confirmPassword}
                      onChange={(e) =>
                        setOrganizationData({
                          ...organizationData,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading ? 'Creating organization...' : 'Create organization account'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <NoSSR fallback={<AuthLoadingSkeleton />}>
      <SignUpForm />
    </NoSSR>
  );
}        