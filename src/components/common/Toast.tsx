import React, { useEffect } from 'react';
import { NotificationType } from '../../hooks/useNotification';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
  id: string;
  type: NotificationType;
  message: string;
  onClose: (id: string) => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ id, type, message, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getStyles = () => {
    const baseStyles =
      'pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-md animate-toastIn w-[min(92vw,420px)]';
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-emerald-50/95 border-emerald-200 text-emerald-950`;
      case 'error':
        return `${baseStyles} bg-rose-50/95 border-rose-200 text-rose-950`;
      case 'warning':
        return `${baseStyles} bg-amber-50/95 border-amber-200 text-amber-950`;
      case 'info':
        return `${baseStyles} bg-sky-50/95 border-sky-200 text-sky-950`;
      default:
        return `${baseStyles} bg-slate-50/95 border-slate-200 text-slate-950`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />;
      case 'error':
        return <AlertCircle className="mt-0.5 h-5 w-5 text-rose-600" />;
      case 'warning':
        return <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />;
      case 'info':
        return <Info className="mt-0.5 h-5 w-5 text-sky-600" />;
    }
  };

  return (
    <div className={getStyles()} role="status" aria-live="polite">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 ring-1 ring-black/5">
        {getIcon()}
      </div>
      <p className="flex-1 pt-0.5 text-sm font-medium leading-6">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="rounded-full p-1 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-700"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<{ toasts: any[]; onClose: (id: string) => void }> = ({ toasts, onClose }) => {
  return (
    <div className="fixed left-1/2 top-4 z-[9999] flex w-full -translate-x-1/2 flex-col items-center gap-3 px-4 sm:left-auto sm:right-4 sm:translate-x-0 sm:items-end sm:px-0">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
};

export default Toast;
