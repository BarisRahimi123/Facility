'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  CreditCard,
  Shield,
  User,
  MapPin,
  Clock,
  FileText,
  Settings,
  Upload,
  CheckCircle,
  AlertTriangle,
  Building2,
  Grid3X3,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  organization_id?: string;
  organization_name?: string;
  role: string;
  created_at: string;
}

interface Reservation {
  id: string;
  field_id: string;
  field_name: string;
  facility_name: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_cost: number;
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded';
  contact_name: string;
  contact_email: string;
}

interface InsuranceDocument {
  id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  expiry_date?: string;
  status: 'submitted' | 'approved' | 'rejected' | 'expired';
  coverage_amount?: number;
  created_at: string;
}

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'reservations' | 'insurance' | 'payments' | 'profile'>('overview');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [insuranceDocuments, setInsuranceDocuments] = useState<InsuranceDocument[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast({
          title: 'Authentication Error',
          description: 'Please sign in to view your dashboard.',
          variant: 'destructive',
        });
        return;
      }

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select(`
          *,
          organizations (
            name
          )
        `)
        .eq('email', user.email)
        .single();

      if (profileData) {
        setUserProfile({
          ...profileData,
          organization_name: profileData.organizations?.name
        });
      }

      // Load sample reservation data (replace with real data later)
      const sampleReservations: Reservation[] = [
        {
          id: '1',
          field_id: 'field-1',
          field_name: 'Soccer Field A',
          facility_name: 'Central Sports Complex',
          start_date: '2025-02-15',
          end_date: '2025-02-15',
          start_time: '10:00',
          end_time: '12:00',
          status: 'confirmed',
          total_cost: 170,
          payment_status: 'paid',
          contact_name: profileData?.full_name || 'User',
          contact_email: user.email || ''
        },
        {
          id: '2',
          field_id: 'field-2',
          field_name: 'Basketball Court 1',
          facility_name: 'Westside Recreation Center',
          start_date: '2025-02-22',
          end_date: '2025-02-22',
          start_time: '14:00',
          end_time: '16:00',
          status: 'pending',
          total_cost: 90,
          payment_status: 'pending',
          contact_name: profileData?.full_name || 'User',
          contact_email: user.email || ''
        }
      ];
      setReservations(sampleReservations);

      // Load sample insurance data (replace with real data later)
      const sampleInsurance: InsuranceDocument[] = [
        {
          id: '1',
          document_type: 'liability',
          document_name: 'General Liability Certificate',
          file_url: '/documents/sample-insurance.pdf',
          expiry_date: '2025-12-31',
          status: 'approved',
          coverage_amount: 1000000,
          created_at: '2025-01-15T10:00:00Z'
        }
      ];
      setInsuranceDocuments(sampleInsurance);

    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {userProfile?.full_name || 'User'}! Manage your reservations, insurance, and account settings.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link href="/facilities-map">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-medium">Browse Facilities</h3>
                <p className="text-sm text-muted-foreground">Find and book facilities</p>
              </CardContent>
            </Card>
          </Link>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('reservations')}>
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-medium">My Reservations</h3>
              <p className="text-sm text-muted-foreground">{reservations.length} active bookings</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('insurance')}>
            <CardContent className="p-4 text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-medium">Insurance</h3>
              <p className="text-sm text-muted-foreground">{insuranceDocuments.length} documents</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('payments')}>
            <CardContent className="p-4 text-center">
              <CreditCard className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-medium">Payments</h3>
              <p className="text-sm text-muted-foreground">Manage billing</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reservations">Reservations</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Reservations</p>
                      <p className="text-2xl font-bold">{reservations.length}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Upcoming Bookings</p>
                      <p className="text-2xl font-bold">{reservations.filter(r => r.status === 'confirmed').length}</p>
                    </div>
                    <Clock className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Insurance Status</p>
                      <p className="text-2xl font-bold text-green-500">Active</p>
                    </div>
                    <Shield className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Methods</p>
                      <p className="text-2xl font-bold">1</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Reservations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Reservations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reservations.slice(0, 3).map((reservation) => (
                      <div key={reservation.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{reservation.field_name}</p>
                          <p className="text-xs text-muted-foreground">{reservation.facility_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(reservation.start_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Badge variant={reservation.status === 'confirmed' ? 'default' : 'secondary'}>
                          {reservation.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab('reservations')}>
                    View All Reservations
                  </Button>
                </CardContent>
              </Card>

              {/* Insurance Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Insurance Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insuranceDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{doc.document_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Expires: {doc.expiry_date ? format(new Date(doc.expiry_date), 'MMM d, yyyy') : 'N/A'}
                          </p>
                          {doc.coverage_amount && (
                            <p className="text-xs text-muted-foreground">
                              Coverage: ${doc.coverage_amount.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'}>
                          {doc.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab('insurance')}>
                    Manage Insurance
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Reservations</h2>
              <Link href="/facilities-map">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Reservation
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {reservations.map((reservation) => (
                <Card key={reservation.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">{reservation.field_name}</h3>
                        <p className="text-muted-foreground">{reservation.facility_name}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(reservation.start_date), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {reservation.start_time} - {reservation.end_time}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={reservation.status === 'confirmed' ? 'default' : 'secondary'}>
                            {reservation.status}
                          </Badge>
                          <Badge variant={reservation.payment_status === 'paid' ? 'default' : 'destructive'}>
                            {reservation.payment_status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${reservation.total_cost}</p>
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Insurance Tab */}
          <TabsContent value="insurance" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Insurance Documents</h2>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {insuranceDocuments.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">{doc.document_name}</h3>
                        <p className="text-muted-foreground capitalize">{doc.document_type} Insurance</p>
                        {doc.coverage_amount && (
                          <p className="text-sm text-muted-foreground">
                            Coverage Amount: ${doc.coverage_amount.toLocaleString()}
                          </p>
                        )}
                        <div className="flex items-center gap-4">
                          <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'}>
                            {doc.status}
                          </Badge>
                          {doc.expiry_date && (
                            <span className="text-sm text-muted-foreground">
                              Expires: {format(new Date(doc.expiry_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {insuranceDocuments.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Insurance Documents</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload your insurance certificates to complete your profile and enable bookings.
                  </p>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Your First Document
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <h2 className="text-2xl font-bold">Payment Information</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">•••• •••• •••• 4242</p>
                          <p className="text-sm text-muted-foreground">Expires 12/26</p>
                        </div>
                        <Badge>Primary</Badge>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Billing History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Soccer Field A Booking</p>
                        <p className="text-xs text-muted-foreground">Jan 25, 2025</p>
                      </div>
                      <p className="font-medium">$170.00</p>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Basketball Court Booking</p>
                        <p className="text-xs text-muted-foreground">Jan 20, 2025</p>
                      </div>
                      <p className="font-medium">$90.00</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    View All Transactions
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <h2 className="text-2xl font-bold">Profile Settings</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <p className="text-muted-foreground">{userProfile?.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-muted-foreground">{userProfile?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <p className="text-muted-foreground">{userProfile?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <p className="text-muted-foreground capitalize">{userProfile?.role}</p>
                  </div>
                  {userProfile?.organization_name && (
                    <div>
                      <label className="text-sm font-medium">Organization</label>
                      <p className="text-muted-foreground">{userProfile.organization_name}</p>
                    </div>
                  )}
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Account Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Account Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Email Preferences
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Notification Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Privacy Settings
                  </Button>
                  <hr />
                  <Button variant="destructive" className="w-full">
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 