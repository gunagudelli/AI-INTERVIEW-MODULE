import { useState, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface ToastNotification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

export const useNotification = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showNotification = useCallback((type: NotificationType, message: string, duration: number = 3000) => {
    const id = Date.now().toString();
    const toast: ToastNotification = { id, type, message, duration };
    
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, [removeNotification]);

  const success = useCallback((message: string, duration?: number) => {
    return showNotification('success', message, duration);
  }, [showNotification]);

  const error = useCallback((message: string, duration?: number) => {
    return showNotification('error', message, duration);
  }, [showNotification]);

  const warning = useCallback((message: string, duration?: number) => {
    return showNotification('warning', message, duration);
  }, [showNotification]);

  const info = useCallback((message: string, duration?: number) => {
    return showNotification('info', message, duration);
  }, [showNotification]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showNotification,
    removeNotification,
    success,
    error,
    warning,
    info,
    clearAll,
  };
};

export default useNotification;
