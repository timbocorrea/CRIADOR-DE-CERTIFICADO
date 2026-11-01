import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration }: Omit<ToastItem, 'id'>) => {
      // WCAG 2.2 AA (Criterion 2.2.1 Timing Adjustable) - Errors require longer duration (6000ms)
      const defaultDuration = type === 'error' ? 6000 : 4000;
      const actualDuration = duration !== undefined ? duration : defaultDuration;
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration: actualDuration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

      if (actualDuration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, actualDuration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message, duration: 6000 });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      {/* Toast Notification Container */}
      <div
        className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-1.5rem)] sm:max-w-sm w-full"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-xl shadow-lg border text-sm transition-all animate-fadeIn ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : toast.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="shrink-0 text-base mt-0.5">
              {toast.type === 'success' && <i className="fa-solid fa-circle-check text-emerald-600" aria-hidden="true"></i>}
              {toast.type === 'error' && <i className="fa-solid fa-circle-xmark text-red-600" aria-hidden="true"></i>}
              {toast.type === 'warning' && <i className="fa-solid fa-triangle-exclamation text-amber-600" aria-hidden="true"></i>}
              {toast.type === 'info' && <i className="fa-solid fa-circle-info text-blue-600" aria-hidden="true"></i>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs sm:text-sm">{toast.title}</p>
              {toast.message && <p className="text-xs opacity-90 mt-0.5 break-words">{toast.message}</p>}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 shrink-0 text-xs p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              aria-label="Fechar notificação"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
};
