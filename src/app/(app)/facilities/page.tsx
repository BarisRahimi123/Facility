'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, MapPin, Users, AlertTriangle, Share2 } from 'lucide-react';
import Link from 'next/link';
import { Facility } from '@/types/facility';
import toast from 'react-hot-toast';
import { getAllFacilities } from '@/app/actions/facilities';
import ShareFacilityModal from '@/components/facilities/ShareFacilityModal';
import { createFacilityInvitation, ShareRequest } from '@/app/actions/facilitySharing';
import { createClient } from '@/lib/supabase/client';

export default function FacilitiesPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  // Check user authorization
  useEffect(() => {
    const supabase = createClient();
    
    async function checkAuth() {
      try {
        // First check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.log('No active session found, redirecting to sign-in');
          router.push('/auth/sign-in');
          return;
        }

        // Get the user from the session
        const user = session.user;
        if (!user || !user.email) {
          console.log('No user in session, redirecting to sign-in');
          router.push('/auth/sign-in');
          return;
        }

        // Get user role from database
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('email', user.email)
          .single();
        
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          // If user doesn't exist in users table, redirect to sign-in
          toast.error('User profile not found. Please contact an administrator.');
          router.push('/auth/sign-in');
          return;
        }
        
        const role = userProfile?.role;
        setUserRole(role);
        
        // Check if user has admin privileges
        const adminRoles = ['admin', 'staff', 'manager', 'coordinator', 'district_approver', 'site_approver', 'master_admin', 'sub_master'];
        
        if (!role || !adminRoles.includes(role)) {
          toast.error('You do not have permission to access this page');
          router.push('/facilities-map');
          return;
        }
        
        setIsAuthorized(true);
      } catch (error) {
        console.error('Error checking authorization:', error);
        toast.error('Error checking permissions');
        router.push('/facilities-map');
      } finally {
        setAuthLoading(false);
      }
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth/sign-in');
      } else if (event === 'SIGNED_IN' && !isAuthorized) {
        checkAuth();
      }
    });

    checkAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [router, isAuthorized]);

  useEffect(() => {
    if (isAuthorized) {
      loadFacilities();
    }
  }, [isAuthorized]);

  async function loadFacilities() {
    try {
      const data = await getAllFacilities();
      setFacilities(data);
    } catch (error) {
      console.error('Error loading facilities:', error);
      toast.error('Failed to load facilities');
    } finally {
      setIsLoading(false);
    }
  }

  const handleShareFacility = (facility?: Facility) => {
    setSelectedFacility(facility || null);
    setShareModalOpen(true);
  };

  const handleShare = async (shareRequest: ShareRequest) => {
    try {
      const result = await createFacilityInvitation(shareRequest);
      
      if (result.success) {
        toast.success('Invitation sent successfully!');
      } else {
        toast.error(result.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sharing facility:', error);
      toast.error('Failed to send invitation');
    }
  };

  // Show loading state while checking authorization
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Only render page content if user is authorized
  if (!isAuthorized) {
    return null; // This will never render since we redirect unauthorized users
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Facilities</h1>
          <p className="text-muted-foreground mt-2">Manage your facilities and their resources</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => handleShareFacility()}
            className="flex items-center gap-2 bg-accent/10 hover:bg-accent/20 text-accent-foreground border border-accent/20 hover:border-accent/30 rounded-lg px-5 py-2.5 transition-all duration-200"
          >
            <Share2 className="h-4 w-4" />
            Share All Facilities
          </Button>
          <Link href="/facilities/new">
            <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md rounded-lg px-5 py-2.5 transition-all duration-200">
              <Plus className="h-4 w-4" />
              Add Facility
            </Button>
          </Link>
        </div>
      </div>

      {facilities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((facility) => (
            <Card key={facility.id} className="bg-card border-border hover:border-accent transition-all duration-300 group hover:shadow-xl hover:shadow-primary/10">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <Link href={`/facility/${facility.id}`} className="flex-1">
                    <CardTitle className="text-xl text-card-foreground group-hover:text-primary transition-colors cursor-pointer">{facility.name}</CardTitle>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleShareFacility(facility);
                      }}
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-blue-400 hover:bg-accent/50 p-2"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Badge 
                      variant={facility.status === 'active' ? 'default' : 'secondary'}
                      className={facility.status === 'active' 
                        ? 'bg-primary/10 text-primary border-primary/20' 
                        : 'bg-muted text-muted-foreground border-border'
                      }
                    >
                      {facility.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <Link href={`/facility/${facility.id}`}>
                <CardContent className="cursor-pointer">
                  {/* Facility Image */}
                  {facility.image_url && (
                    <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-accent mb-4">
                      <img
                        src={facility.image_url}
                        alt={facility.image_description || facility.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4 mr-3 text-primary" />
                      <span>{facility.facility_type}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-3 text-primary" />
                      <span>{facility.address}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border">
                      <div className="flex items-center text-sm text-card-foreground">
                        <Users className="h-4 w-4 mr-2 text-blue-400" />
                        <span>{facility.occupancy_rate || 0}% Occupied</span>
                      </div>
                      <div className="flex items-center text-sm text-card-foreground">
                        <AlertTriangle className="h-4 w-4 mr-2 text-amber-400" />
                        <span>{facility.active_issues || 0} Issues</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16 bg-card border-border">
          <CardContent>
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
            <h3 className="text-xl font-semibold text-card-foreground mb-3">No facilities found</h3>
            <p className="text-muted-foreground mb-6">Get started by adding your first facility.</p>
            <Link href="/facilities/new">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md rounded-lg px-5 py-2.5 transition-all duration-200">
                Add Facility
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Share Facility Modal */}
      <ShareFacilityModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        facility={selectedFacility}
        onShare={handleShare}
      />
    </div>
  );
} 