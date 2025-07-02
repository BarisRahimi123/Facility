'use client';

import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/layout/ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000,
          className: '',
          style: {
            background: 'var(--popover)',
            color: 'var(--popover-foreground)',
            border: '1px solid var(--border)',
          },
          success: {
            style: {
              background: '#00b16a',
              color: '#ffffff',
            },
          },
          error: {
            style: {
              background: '#ef4444',
              color: '#ffffff',
            },
          },
        }}
      />
    </ThemeProvider>
  );
} 