'use client';

import {
  LayoutDashboard,
  Users,
  Settings,
  Wrench,
  Building2,
  Activity,
  LogOut,
  Map,
  CheckSquare,
  UserCircle,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isActive = (href: string) => pathname === href;

  useEffect(() => {
    async function getUserRole() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('role')
            .eq('email', user.email)
            .single();
          
          setUserRole(userProfile?.role || null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setIsLoading(false);
      }
    }

    getUserRole();
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Signed out successfully",
        variant: "success"
      });

      // Use router.push instead of replace to ensure proper navigation
      router.push('/auth/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  // Role-based navigation
  const getNavigationForRole = (role: string | null) => {
    // Master admin and sub-master admin: Full access
    if (role === 'master_admin' || role === 'sub_master' || role === 'district_approver' || role === 'site_approver') {
      return [
        {
          href: '/user-dashboard',
          label: 'My Dashboard',
          icon: UserCircle,
        },
        {
          href: '/facilities',
          label: 'Facilities',
          icon: LayoutDashboard,
        },
        {
          href: '/facilities-map',
          label: 'Facilities Map',
          icon: Map,
        },
        {
          href: '/staff',
          label: 'Staff Dashboard',
          icon: Users,
        },
        {
          href: '/people',
          label: 'People',
          icon: UserPlus,
        },
        {
          href: '/analytics',
          label: 'Analytics',
          icon: Activity,
        },
        {
          href: '/buildings',
          label: 'Buildings',
          icon: Building2,
        },
        {
          href: '/maintenance',
          label: 'Maintenance',
          icon: Wrench,
        },
        {
          href: '/admin/reservations',
          label: 'Reservations',
          icon: CheckSquare,
        },
        {
          href: '/settings',
          label: 'Settings',
          icon: Settings,
        },
      ];
    } else if (role === 'staff' || role === 'manager' || role === 'coordinator' || role === 'maintenance' || role === 'vendor') {
      // Staff users: Access to staff dashboard and limited admin functions
      return [
        {
          href: '/staff',
          label: 'Staff Dashboard',
          icon: Users,
        },
        {
          href: '/facilities-map',
          label: 'Facilities Map',
          icon: Map,
        },
        {
          href: '/people',
          label: 'People',
          icon: UserPlus,
        },
        {
          href: '/maintenance',
          label: 'Maintenance',
          icon: Wrench,
        },
        {
          href: '/admin/reservations',
          label: 'Reservations',
          icon: CheckSquare,
        },
      ];
    } else if (role === 'renter') {
      // Renter users: Limited access for browsing and booking facilities
      return [
        {
          href: '/user-dashboard',
          label: 'My Dashboard',
          icon: UserCircle,
        },
        {
          href: '/facilities-map',
          label: 'Browse Facilities',
          icon: Map,
        },
      ];
    } else {
      // Any other role or null gets renter-level access as fallback
      return [
        {
          href: '/user-dashboard',
          label: 'My Dashboard',
          icon: UserCircle,
        },
        {
          href: '/facilities-map',
          label: 'Browse Facilities',
          icon: Map,
        },
      ];
    }
  };

  const navigation = getNavigationForRole(userRole);

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      {/* Logo/Brand Section */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-foreground">FacilityCore</span>
            <span className="text-xs text-muted-foreground">Management System</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {isActive(item.href) && (
                    <div className="absolute left-0 top-0 h-full w-1 bg-primary-foreground rounded-r-full" />
                  )}
                  <item.icon className={`w-5 h-5 ${
                    isActive(item.href) 
                      ? 'text-primary-foreground' 
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`} />
                  <span className={isActive(item.href) ? 'text-primary-foreground' : ''}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 group-hover:text-red-500 transition-colors" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
} 