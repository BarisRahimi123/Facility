'use client';

import {
  LayoutDashboard,
  Users,
  Settings,
  Wrench,
  Building2,
  ClipboardList,
  Eye,
  Files,
  Activity,
  LogOut,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const isActive = (href: string) => pathname === href;

  const handleSignOut = async () => {
    try {
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

  const navigation = [
    {
      href: '/facilities',
      label: 'Facilities',
      icon: LayoutDashboard,
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
      href: '/tasks',
      label: 'Tasks',
      icon: ClipboardList,
    },
    {
      href: '/virtual-tour',
      label: 'Virtual Tour',
      icon: Eye,
    },
    {
      href: '/plans',
      label: 'Plans',
      icon: Files,
    },
    {
      href: '/people',
      label: 'People',
      icon: Users,
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Logo/Brand Section */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white">FacilityCore</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-white' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
} 