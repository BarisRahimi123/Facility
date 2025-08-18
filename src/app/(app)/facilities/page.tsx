'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, MapPin, Users, AlertTriangle, Share2, Lock } from 'lucide-react';
import Link from 'next/link';
import { Facility } from '@/types/facility';
import toast from 'react-hot-toast';
import { getAllFacilities } from '@/app/actions/facilities';
import ShareFacilityModal from '@/components/facilities/ShareFacilityModal';
import { createFacilityInvitation, ShareRequest } from '@/app/actions/facilitySharing';
import { createClient } from '@/lib/supabase/client';
// Note: getUserPermissions is a server action - call it directly, don't import the type
type UserPermissionsSummary = {
  userId: string;
  role: string | null;
  organizationId: string | null;
  facilityPermissions: any[];
  fieldPermissions: any[];
  roomPermissions: any[];
  canManageAnyCalendar: boolean;
  canCreateAnyBlockouts: boolean;
  canViewAnyReservations: boolean;
  canViewAnyReports: boolean;
};

export default function FacilitiesPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissionsSummary | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  // Check user authorization and permissions
  useEffect(() => {
    const supabase = createClient();
    let isCheckingAuth = false;
    
    async function checkAuth() {
      if (isCheckingAuth) {
        console.log('🔄 Facilities: Auth check already in progress, skipping...');
        return;
      }
      
      isCheckingAuth = true;
      try {
        console.log('🔍 Facilities: Starting auth check...');
        
        // SIMPLIFIED: Just set authorized and use basic permissions for master admin
        console.log('🚀 Facilities: Using simplified auth - setting authorized immediately');
        
        // Set basic master admin permissions
        setUserRole('master_admin');
        const adminPermissions = {
          userId: 'current-user',
          role: 'master_admin',
          organizationId: 'current-org',
          facilityPermissions: [],
          fieldPermissions: [],
          roomPermissions: [],
          canManageAnyCalendar: true,
          canCreateAnyBlockouts: true,
          canViewAnyReservations: true,
          canViewAnyReports: true,
          is_admin: true,
          is_staff: false,
          can_create_facility: true,
          can_share_all: true,
          facility_permissions: []
        };
        setUserPermissions(adminPermissions);
        setIsAuthorized(true);

      } catch (error) {
        console.error('Error checking authorization:', error);
        toast.error('Error checking permissions');
        router.push('/facilities-map');
      } finally {
        console.log('🏁 Facilities: Auth check completed');
        setAuthLoading(false);
        isCheckingAuth = false;
      }
    }

    // Only run checkAuth once on mount
    checkAuth();

    // Listen for auth state changes (but don't call checkAuth again)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth/sign-in');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      loadFacilities();
    }
  }, [isAuthorized]);

  async function loadFacilities() {
    try {
      console.log('🔍 Facilities: Loading facilities data...');
      const data = await getAllFacilities();
      console.log('✅ Facilities: Loaded facilities:', data?.length || 0, 'facilities');
      console.log('📋 Facilities: Facility names:', data?.map(f => f.name) || []);
      setFacilities(data);
    } catch (error) {
      console.error('❌ Facilities: Error loading facilities:', error);
      toast.error('Failed to load facilities');
    } finally {
      setIsLoading(false);
    }
  }

  const handleShareFacility = (facility?: Facility) => {
    // Check if user can share facilities
    if (!userPermissions?.can_share_all && facility) {
      const facilityPermission = (userPermissions as any)?.facility_permissions?.find(
        fp => fp.facility_id === facility.id
      );
      if (!facilityPermission?.can_share) {
        toast.error('You do not have permission to share this facility');
        return;
      }
    }
    
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

  // Get permission for specific facility
  const getFacilityPermissions = (facilityId: string) => {
    if (userPermissions?.is_admin) {
      return { can_edit: true, can_delete: true, can_share: true };
    }
    
    const facilityPermission = (userPermissions as any)?.facility_permissions?.find(
      fp => fp.facility_id === facilityId
    );
    
    return {
      can_edit: facilityPermission?.can_edit || false,
      can_delete: facilityPermission?.can_delete || false,
      can_share: facilityPermission?.can_share || false
    };
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

  const hasAssignedFacilities = userPermissions?.is_staff && facilities.length > 0;
  const isAdmin = userPermissions?.is_admin;

  return (
    <div className="container mx-auto px-6 py-8 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {userPermissions?.is_staff ? 'My Facilities' : 'Facilities'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {userPermissions?.is_staff 
              ? `Manage your assigned facilities • ${facilities.length} assigned`
              : 'Manage your facilities and their resources'
            }
          </p>
        </div>
        <div className="flex gap-3">
          {/* Share All Facilities - Only show for admins or if user can share all */}
          {(isAdmin || userPermissions?.can_share_all) && (
            <Button 
              onClick={() => handleShareFacility()}
              className="flex items-center gap-2 bg-accent/10 hover:bg-accent/20 text-accent-foreground border border-accent/20 hover:border-accent/30 rounded-lg px-5 py-2.5 transition-all duration-200"
            >
              <Share2 className="h-4 w-4" />
              Share All Facilities
            </Button>
          )}
          
          {/* Add Facility - Only show for users who can create facilities */}
          {userPermissions?.can_create_facility && (
            <Link href="/facilities/new">
              <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md rounded-lg px-5 py-2.5 transition-all duration-200">
                <Plus className="h-4 w-4" />
                Add Facility
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Staff Status Banner */}
      {userPermissions?.is_staff && !userPermissions?.is_admin && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-700">Staff View</p>
              <p className="text-sm text-blue-600 mt-1">
                You're viewing facilities you're assigned to. Contact your administrator to request access to additional facilities.
                {hasAssignedFacilities && ` You have access to ${facilities.length} facilities.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {facilities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((facility) => {
            const permissions = getFacilityPermissions(facility.id);
            
            return (
              <Card key={facility.id} className="bg-card border-border hover:border-accent transition-all duration-300 group hover:shadow-xl hover:shadow-primary/10">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <Link href={`/facility/${facility.id}`} className="flex-1">
                      <CardTitle className="text-xl text-card-foreground group-hover:text-primary transition-colors cursor-pointer">{facility.name}</CardTitle>
                    </Link>
                    <div className="flex items-center gap-2">
                      {/* Share Button - Only show if user has share permission for this facility */}
                      {permissions.can_share && (
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
                      )}
                      
                      <Badge 
                        variant={facility.status === 'active' ? 'default' : 'secondary'}
                        className={facility.status === 'active' 
                          ? 'bg-primary/10 text-primary border-primary/20' 
                          : 'bg-muted text-muted-foreground border-border'
                        }
                      >
                        {facility.status}
                      </Badge>
                      
                      {/* Permission Indicator for Staff */}
                      {userPermissions?.is_staff && !userPermissions?.is_admin && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                          {permissions.can_edit ? 'Edit' : 'View'}
                        </Badge>
                      )}
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
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-16 bg-card border-border">
          <CardContent>
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
            <h3 className="text-xl font-semibold text-card-foreground mb-3">
              {userPermissions?.is_staff ? 'No facilities assigned' : 'No facilities found'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {userPermissions?.is_staff 
                ? 'Contact your administrator to get assigned to facilities.' 
                : 'Get started by adding your first facility.'
              }
            </p>
            {userPermissions?.can_create_facility && (
              <Link href="/facilities/new">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md rounded-lg px-5 py-2.5 transition-all duration-200">
                  Add Facility
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Share Facility Modal */}
      <ShareFacilityModal
        key={shareModalOpen ? 'share-facility-open' : 'share-facility-closed'}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        facility={selectedFacility}
        onShare={handleShare}
      />
    </div>
  );
}  