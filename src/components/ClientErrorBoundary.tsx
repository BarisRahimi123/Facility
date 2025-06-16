'use client';

import React, { ReactNode } from 'react';
import AuthErrorBoundary from '@/components/AuthErrorBoundary';

// Client-side wrapper component
export default function ClientErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <AuthErrorBoundary>
      {children}
    </AuthErrorBoundary>
  );
} 