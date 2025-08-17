'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  User,
  Settings,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
  ChevronDown,
  Building2,
  CreditCard,
  HelpCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,

  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function TopBar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user, loading: userLoading } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

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
        console.error('Sign-out API returned error:', response.status);
      }

      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }

      // Force redirect to sign-in page
      setTimeout(() => {
        window.location.href = '/auth/sign-in';
      }, 100);
    } catch (error) {
      console.error('Error during sign out:', error);
      // Still redirect even if there's an error
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/auth/sign-in';
    }
  };

  const getUserDisplay = () => {
    if (userLoading) return { name: 'Loading...', email: '', avatar: '…' };
    if (!user) return { name: 'Guest', email: '', avatar: 'G' };
    
    return {
      name: user.full_name || 'User',
      email: user.email || '',
      avatar: user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'
    };
  };

  const userDisplay = getUserDisplay();

  return (
    <header className={cn(
      "sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4",
      "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8"
    )}>


      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Facility Management System
            </span>
          </div>
          
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="relative"
            >
              {mounted && (
                <>
                  <Sun className={cn(
                    "h-5 w-5 transition-all",
                    theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
                  )} />
                  <Moon className={cn(
                    "absolute h-5 w-5 transition-all",
                    theme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
                  )} />
                </>
              )}
            </Button>

            {/* Help Button */}
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-5 w-5" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 px-3" aria-label="User menu">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      "bg-primary text-primary-foreground font-semibold text-sm"
                    )}>
                      {userDisplay.avatar}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium">{userDisplay.name}</p>
                      <p className="text-xs text-muted-foreground">{userDisplay.email}</p>
                    </div>
                    <ChevronDown className="ml-1 h-4 w-4 text-muted-foreground" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="px-2 py-1.5 text-sm font-semibold">My Account</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/user-dashboard')}>
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings/billing')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
} 