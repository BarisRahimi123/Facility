'use client';

import { useToast } from '@/components/ui/use-toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-md shadow-lg border flex flex-col gap-1 min-w-[300px] max-w-md animate-in slide-in-from-bottom ${
            toast.variant === 'destructive'
              ? 'bg-red-50 border-red-200 text-red-800'
              : toast.variant === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          {toast.title && (
            <div className="font-semibold text-sm">{toast.title}</div>
          )}
          {toast.description && (
            <div className="text-sm opacity-90">{toast.description}</div>
          )}
        </div>
      ))}
    </div>
  );
} 