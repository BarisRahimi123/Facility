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
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { clearAuthCache } from '@/utils/authCache';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: isLoading } = useAuth();
  const userRole = user?.role || null;
  const isActive = (href: string) => pathname === href;
  
  // Use a consistent initial href to prevent hydration mismatches
  // Default to "/" during initial render, will update after hydration
  const [logoHref, setLogoHref] = useState('/');
  const [menuReady, setMenuReady] = useState(false);
  
  // Update logo href after hydration based on user state
  useEffect(() => {
    setLogoHref(user ? '/facilities-map' : '/');
    // Only show menu items after initial load to prevent flashing
    if (!isLoading) {
      setMenuReady(true);
    }
  }, [user, isLoading]);

  const handleSignOut = async () => {
    try {
      // Call the API route to handle sign-out
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Sign-out failed');
      }

      // Clear all auth cache immediately to avoid stale UI
      clearAuthCache();

      toast({
        title: "Signed out successfully",
        variant: "default"
      });

      // Force redirect to sign-in page
      setTimeout(() => {
        window.location.href = '/auth/sign-in';
      }, 500);
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive"
      });
      
      // Still redirect even if there's an error
      clearAuthCache();
      setTimeout(() => {
        window.location.href = '/auth/sign-in';
      }, 1000);
    }
  };

  // Role-based navigation
  const getNavigationForRole = (role: string | null) => {
    // Master admin and sub-admin: Full access
    if (role === 'master_admin' || role === 'sub_admin' || role === 'district_approver' || role === 'site_approver') {
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
        <Link href={logoHref} className="flex items-center gap-3 group">
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
        {/* Show menu immediately if user exists (even from cache), only show loading for initial auth check */}
        {!user && isLoading ? (
          <div className="space-y-4">
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Loading navigation...
            </div>
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

      {/* Sign Out Button - Always visible */}
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