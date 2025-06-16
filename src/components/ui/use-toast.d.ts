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

export interface UseToastReturn {
  toast: (props: ToastProps) => void;
  toasts: Toast[];
}

export function useToast(): UseToastReturn; 