'use client';

import { useState } from 'react';

type ToastVariant = 'default' | 'destructive' | 'success';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

interface Toast extends ToastProps {
  id: string;
  visible: boolean;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, variant = 'default' }: ToastProps) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    setToasts((prev) => [
      ...prev,
      {
        id,
        title,
        description,
        variant,
        visible: true,
      },
    ]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, visible: false } : t
        )
      );
    }, 5000);
  };

  return {
    toast,
    toasts: toasts.filter((t) => t.visible),
  };
} 