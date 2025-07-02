'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Plus, Search, UserCheck, Settings, Building2, Edit2, Trash2, Briefcase, Shield } from 'lucide-react';
import { getUsers, getUsersByRole, deleteUser, checkUsersTableExists, createSampleUsers, getOrganizations, deleteOrganization, User } from '@/app/actions/users';
import AddUserModal from '@/components/people/AddUserModal';
import AddOrganizationModal from '@/components/people/AddOrganizationModal';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { InviteUserModal } from '@/components/people/InviteUserModal';
import { EditRoleModal } from '@/components/people/EditRoleModal';
import { UserRole } from '@/types/user';
import { Organization } from '@/types/organization';

type TabType = UserRole | 'organizations' | 'access-management';

export default function PeoplePage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('staff');
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [canInvite, setCanInvite] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
        
        // Check if user can invite others
        const canInviteUsers = ['master_admin', 'sub_master', 'district_approver', 'site_approver'].includes(role);
        setCanInvite(canInviteUsers);
        
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
      loadData();
    }
  }, [isAuthorized]);

  useEffect(() => {
    filterData();
  }, [activeTab, allUsers, allOrganizations, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check if users table exists
      const tableExists = await checkUsersTableExists();
      if (!tableExists) {
        setNeedsSetup(true);
        setLoading(false);
        return;
      }

      // Load users
      const usersResult = await getUsers();
      if (usersResult.error) {
        toast.error(`Failed to load users: ${usersResult.error}`);
        return;
      }

      // Load organizations
      const orgsResult = await getOrganizations();
      if (orgsResult.error) {
        toast.error(`Failed to load organizations: ${orgsResult.error}`);
        return;
      }

      setAllUsers(usersResult.data as User[] || []);
      setAllOrganizations(orgsResult.data as Organization[] || []);
      setNeedsSetup(false);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    if (activeTab === 'organizations') {
      // Filter organizations
      let filtered = allOrganizations.filter(org => org.type === 'renter');
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(org => 
          org.name.toLowerCase().includes(query) ||
          (org.primary_contact_name && org.primary_contact_name.toLowerCase().includes(query)) ||
          (org.primary_contact_email && org.primary_contact_email.toLowerCase().includes(query)) ||
          (org.city && org.city.toLowerCase().includes(query))
        );
      }

      setOrganizations(filtered);
    } else {
      // Filter users
      let filtered = allUsers.filter(user => user.role === activeTab);
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(user => 
          user.full_name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.department && user.department.toLowerCase().includes(query)) ||
          (user.position && user.position.toLowerCase().includes(query)) ||
          (user.company && user.company.toLowerCase().includes(query)) ||
          (user.organization_name && user.organization_name.toLowerCase().includes(query))
        );
      }

      setUsers(filtered);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    const result = await deleteUser(userId);
    if (result.error) {
      toast.error(`Failed to delete user: ${result.error}`);
      return;
    }

    toast.success(`${userName} has been deleted successfully`);
    loadData(); // Reload the list
  };

  const handleDeleteOrganization = async (orgId: string, orgName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${orgName}? This action cannot be undone.`)) {
      return;
    }

    const result = await deleteOrganization(orgId);
    if (result.error) {
      toast.error(`Failed to delete organization: ${result.error}`);
      return;
    }

    toast.success(`${orgName} has been deleted successfully`);
    loadData(); // Reload the list
  };

  const handleSetupDatabase = async () => {
    try {
      setLoading(true);
      
      // Create sample users
      const result = await createSampleUsers();
      if (result.error) {
        toast.error(`Failed to create sample users: ${result.error}`);
        return;
      }

      toast.success('Database setup completed with sample users and organizations!');
      loadData();
    } catch (error) {
      console.error('Error setting up database:', error);
      toast.error('Failed to setup database');
    } finally {
      setLoading(false);
    }
  };

  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case 'staff': return 'Staff';
      case 'manager': return 'Managers';
      case 'coordinator': return 'Coordinators';
      case 'vendor': return 'Vendors';
      case 'renter': return 'Renters';
      case 'organizations': return 'Organizations';
      case 'access-management': return 'Access Management';
      default: return tab;
    }
  };

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case 'staff': return <Users className="w-4 h-4" />;
      case 'manager': return <UserCheck className="w-4 h-4" />;
      case 'coordinator': return <Settings className="w-4 h-4" />;
      case 'vendor': return <Building2 className="w-4 h-4" />;
      case 'renter': return <Users className="w-4 h-4" />;
      case 'organizations': return <Briefcase className="w-4 h-4" />;
      case 'access-management': return <Shield className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getStatusColor = (user: User) => {
    return user.is_active 
      ? 'bg-primary/10 text-primary border-primary/20'
      : 'bg-muted text-muted-foreground border-border';
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'master_admin':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'sub_master':
        return 'bg-primary/8 text-primary border-primary/15';
      case 'district_approver':
        return 'bg-accent/10 text-accent-foreground border-accent/20';
      case 'site_approver':
        return 'bg-accent/8 text-accent-foreground border-accent/15';
      case 'staff':
        return 'bg-muted text-foreground border-border';
      case 'manager':
        return 'bg-primary/5 text-primary border-primary/10';
      case 'coordinator':
        return 'bg-accent/5 text-accent-foreground border-accent/10';
      case 'vendor':
        return 'bg-muted/50 text-muted-foreground border-border';
      case 'renter':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getOrgTypeColor = (subtype?: string) => {
    switch (subtype) {
      case 'individual':
        return 'bg-accent/10 text-accent-foreground border-accent/20';
      case 'commercial':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'nonprofit':
        return 'bg-muted text-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Show loading state while checking authorization
  if (authLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  // Only render page content if user is authorized
  if (!isAuthorized) {
    return null; // This will never render since we redirect unauthorized users
  }

  if (needsSetup) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground mb-2">People Management</h1>
            <p className="text-muted-foreground mb-8">Manage staff, coordinators, managers, vendors, and rental organizations</p>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="py-20 text-center">
              <Users className="mx-auto h-12 w-12 text-primary mb-4" />
              <h3 className="mt-4 text-lg font-medium text-foreground">Database Setup Required</h3>
              <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                The people management system needs to be set up. This will create the users table and add sample data.
              </p>
              
              <div className="mt-8 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 max-w-2xl mx-auto text-left">
                <h4 className="text-sm font-semibold text-foreground mb-3">What will be created:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Users table for storing staff and vendor information</li>
                  <li>• Organizations table for rental companies and individuals</li>
                  <li>• Sample staff members (staff, manager, coordinator)</li>
                  <li>• Sample vendor and rental organizations</li>
                  <li>• Integration with field/room assignment system</li>
                </ul>
              </div>
              
                              <Button
                  onClick={handleSetupDatabase}
                  className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200"
                  disabled={loading}
                >
                {loading ? 'Setting up...' : 'Setup Database & Create Sample Data'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isUserTab = activeTab !== 'organizations';
  const currentData = isUserTab ? users : organizations;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">People</h1>
            <p className="text-muted-foreground mt-2">
              Manage staff, coordinators, managers, vendors, and rental organizations
            </p>
          </div>
          {canInvite ? (
            <Button
              onClick={() => {
                if (activeTab === 'organizations') {
                  setIsAddOrgModalOpen(true);
                } else if (activeTab === 'renter') {
                  // Renters sign up through the public page
                  toast.info('Renters sign up through the public registration page');
                } else {
                  setIsInviteModalOpen(true);
                }
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 px-5 py-2.5 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              {activeTab === 'organizations' ? 'Add Organization' : 
               activeTab === 'renter' ? 'Renters Sign Up Publicly' : 
               'Invite ' + getTabLabel(activeTab).slice(0, -1)}
            </Button>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Only master and sub-master admins can invite users
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={`Search ${activeTab === 'organizations' ? 'organizations' : 'people'} by name, email, ${activeTab === 'organizations' ? 'contact, or city' : 'department, or company'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 bg-background border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border">
          {(['staff', 'manager', 'coordinator', 'vendor', 'renter', 'organizations', ...(userRole === 'master_admin' ? ['access-management'] : [])] as TabType[]).map((tab) => {
            const count = tab === 'organizations' 
              ? allOrganizations.filter(org => org.type === 'renter').length
              : tab === 'access-management'
              ? allUsers.filter(u => ['master_admin', 'sub_master', 'district_approver', 'site_approver'].includes(u.role)).length
              : allUsers.filter(u => u.role === tab).length;
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 -mb-[2px] transition-all duration-200 ${
                  activeTab === tab
                    ? 'border-primary text-foreground bg-accent/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/5'
                }`}
              >
                <span className={activeTab === tab ? 'text-primary' : ''}>
                  {getTabIcon(tab)}
                </span>
                {getTabLabel(tab)}
                <Badge 
                  variant="secondary" 
                  className={`ml-1 text-xs font-normal ${
                    activeTab === tab 
                      ? 'bg-primary/10 text-primary border-primary/20' 
                      : 'bg-muted text-muted-foreground border-transparent'
                  }`}
                >
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Content Grid/Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        ) : currentData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === 'access-management' ? (
              // Access Management View
              allUsers
                .filter(user => ['master_admin', 'sub_master', 'district_approver', 'site_approver'].includes(user.role))
                .map((user) => (
                  <Card key={user.id} className="bg-card border-border hover:shadow-md transition-all duration-200 hover:border-primary/20">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-foreground">
                            {user.full_name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {user.email}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsEditRoleModalOpen(true);
                            }}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {user.role !== 'master_admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id, user.full_name)}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Role and Status */}
                        <div className="flex items-center gap-2">
                          <Badge className={getRoleColor(user.role as UserRole)}>
                            {user.role === 'master_admin' ? 'Master Admin' :
                             user.role === 'sub_master' ? 'Sub-Master Admin' :
                             user.role === 'district_approver' ? 'District Approver' :
                             'Site Approver'}
                          </Badge>
                          <Badge className={getStatusColor(user)}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        {/* Assigned Facilities */}
                        {user.facilities && user.facilities.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Assigned Facilities:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {user.facilities.map((facility, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {facility.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Created Date */}
                        <p className="text-xs text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
                          Added {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : activeTab === 'organizations' ? (
              // Organizations cards
              organizations.map((org) => (
                <Card key={org.id} className="bg-card border-border hover:shadow-md transition-all duration-200 hover:border-primary/20">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-foreground">
                          {org.name}
                        </CardTitle>
                        {org.display_name && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {org.display_name}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOrganization(org.id, org.name)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Type and Status */}
                      <div className="flex items-center gap-2">
                        <Badge className={getOrgTypeColor(org.subtype)}>
                          {org.subtype === 'individual' ? 'Individual' : 
                           org.subtype === 'commercial' ? 'Commercial' : 'Non-Profit'}
                        </Badge>
                        <Badge className={org.is_active ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}>
                          {org.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      {/* Contact Info */}
                      {org.primary_contact_name && (
                        <p className="text-sm text-muted-foreground">
                          👤 {org.primary_contact_name}
                        </p>
                      )}
                      {org.primary_contact_email && (
                        <p className="text-sm text-muted-foreground">
                          ✉️ {org.primary_contact_email}
                        </p>
                      )}
                      {org.primary_contact_phone && (
                        <p className="text-sm text-muted-foreground">
                          📞 {org.primary_contact_phone}
                        </p>
                      )}

                      {/* Address */}
                      {(org.city || org.state) && (
                        <p className="text-sm text-muted-foreground">
                          📍 {[org.city, org.state].filter(Boolean).join(', ')}
                        </p>
                      )}

                      {/* Insurance Requirements */}
                      {org.requires_insurance && (
                        <p className="text-sm text-muted-foreground">
                          🛡️ Insurance Required: ${org.minimum_liability_coverage?.toLocaleString()}
                        </p>
                      )}

                      {/* Created Date */}
                      <p className="text-xs text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
                        Added {new Date(org.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // Users cards
              users.map((user) => (
                <Card key={user.id} className="bg-card border-border hover:shadow-md transition-all duration-200 hover:border-primary/20">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-foreground">
                          {user.full_name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {user.email}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.full_name)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Role and Status */}
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleColor(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                        <Badge className={getStatusColor(user)}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      {/* Contact Info */}
                      {user.phone && (
                        <p className="text-sm text-muted-foreground">
                          📞 {user.phone}
                        </p>
                      )}

                      {/* Role-specific Information */}
                      {(['staff', 'manager', 'coordinator'] as UserRole[]).includes(user.role) && (
                        <div className="space-y-1">
                          {user.department && (
                            <p className="text-sm text-muted-foreground">
                              🏢 {user.department}
                            </p>
                          )}
                          {user.position && (
                            <p className="text-sm text-muted-foreground">
                              💼 {user.position}
                            </p>
                          )}
                        </div>
                      )}

                      {user.role === 'vendor' && (
                        <div className="space-y-1">
                          {user.company && (
                            <p className="text-sm text-muted-foreground">
                              🏗️ {user.company}
                            </p>
                          )}
                          {user.services && user.services.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {user.services.slice(0, 3).map((service, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {service}
                                </Badge>
                              ))}
                              {user.services.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{user.services.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {user.role === 'renter' && user.organization_name && (
                        <p className="text-sm text-muted-foreground">
                          🏢 {user.organization_name}
                        </p>
                      )}

                      {/* Created Date */}
                      <p className="text-xs text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
                        Added {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="py-20 text-center">
              {getTabIcon(activeTab)}
              <h3 className="mt-4 text-lg font-medium text-foreground">
                No {getTabLabel(activeTab).toLowerCase()} found
              </h3>
              <p className="mt-2 text-muted-foreground">
                {searchQuery.trim() 
                  ? `No ${getTabLabel(activeTab).toLowerCase()} match your search criteria.`
                  : `Get started by adding your first ${activeTab === 'organizations' ? 'organization' : activeTab}.`
                }
              </p>
              {!searchQuery.trim() && (
                <Button
                  onClick={() => {
                    if (activeTab === 'organizations') {
                      setIsAddOrgModalOpen(true);
                    } else {
                      setIsAddModalOpen(true);
                    }
                  }}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {activeTab === 'organizations' ? 'Organization' : getTabLabel(activeTab).slice(0, -1)}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add User Modal */}
        <AddUserModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onUserAdded={loadData}
          defaultRole={isUserTab ? (activeTab as UserRole) : 'renter'}
        />

        {/* Add Organization Modal */}
        <AddOrganizationModal
          isOpen={isAddOrgModalOpen}
          onClose={() => setIsAddOrgModalOpen(false)}
          onOrganizationAdded={loadData}
        />

        {/* Invite User Modal */}
        <InviteUserModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          currentUserRole={userRole || ''}
          onInviteSent={loadData}
        />

        {/* Edit Role Modal */}
        <EditRoleModal
          isOpen={isEditRoleModalOpen}
          onClose={() => {
            setIsEditRoleModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onUserUpdated={loadData}
        />
      </div>
    </div>
  );
} 