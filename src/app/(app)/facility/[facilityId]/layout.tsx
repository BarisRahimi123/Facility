'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import {
  Building2,
  FileText,
  Box,
  Camera,
  Settings,
  Users,
  Wrench,
  AlertTriangle,
  ChevronRight,
  Home
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function FacilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const facilityId = params?.facilityId as string;

  // Simply return the children without any additional layout
  return <>{children}</>;
} 