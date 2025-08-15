'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireMasterAdmin?: boolean;
  requireFacilitiesAccess?: boolean;
  requirePeopleAccess?: boolean;
  requireAnalyticsAccess?: boolean;
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireMasterAdmin = false,
  requireFacilitiesAccess = false,
  requirePeopleAccess = false,
  requireAnalyticsAccess = false,
  fallbackPath = '/facilities-map'
}: ProtectedRouteProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { 
    user, 
    loading, 
    isAdmin, 
    isMasterAdmin, 
    canAccessFacilities, 
    canAccessPeople, 
    canAccessAnalytics 
  } = useAuth();

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access this page",
        variant: "destructive"
      });
      router.push('/auth/sign-in');
      return;
    }

    // Check specific permission requirements
    if (requireMasterAdmin && !isMasterAdmin) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page",
        variant: "destructive"
      });
      router.push(fallbackPath);
      return;
    }

    if (requireAdmin && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page",
        variant: "destructive"
      });
      router.push(fallbackPath);
      return;
    }

    if (requireFacilitiesAccess && !canAccessFacilities) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page",
        variant: "destructive"
      });
      router.push(fallbackPath);
      return;
    }

    if (requirePeopleAccess && !canAccessPeople) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page",
        variant: "destructive"
      });
      router.push(fallbackPath);
      return;
    }

    if (requireAnalyticsAccess && !canAccessAnalytics) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page",
        variant: "destructive"
      });
      router.push(fallbackPath);
      return;
    }
  }, [
    user, 
    loading, 
    isAdmin, 
    isMasterAdmin, 
    canAccessFacilities, 
    canAccessPeople, 
    canAccessAnalytics,
    requireAdmin,
    requireMasterAdmin,
    requireFacilitiesAccess,
    requirePeopleAccess,
    requireAnalyticsAccess,
    router,
    fallbackPath
  ]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if user doesn't have access
  if (!user) return null;

  if (requireMasterAdmin && !isMasterAdmin) return null;
  if (requireAdmin && !isAdmin) return null;
  if (requireFacilitiesAccess && !canAccessFacilities) return null;
  if (requirePeopleAccess && !canAccessPeople) return null;
  if (requireAnalyticsAccess && !canAccessAnalytics) return null;

  return <>{children}</>;
}