'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/**
 * Small reusable toast notifications (T-022 UX follow-up).
 *
 * Used **selectively** for completed actions (e.g. "Answers saved", "Attempt
 * submitted"). It is deliberately not an autosave logger: persistent inline
 * errors and actionable recovery (save errors, revision conflicts, ambiguous
 * submissions) stay inline. Toasts carry no assessment data: prompts, responses
 * and results are exchanged only with the authorised application API and must
 * never enter GA4/GTM analytics payloads.
 */
export interface ToastOptions {
  variant?: 'success' | 'info';
  durationMs?: number;
}

interface Toast {
  id: number;
  message: string;
  variant: 'success' | 'info';
}

const ToastContext = createContext<
  ((message: string, options?: ToastOptions) => void) | null
>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, options?: ToastOptions) => {
      const id = nextId.current++;
      const variant = options?.variant ?? 'success';
      setToasts((current) => [...current, { id, message, variant }]);
      const duration = options?.durationMs ?? 5000;
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  const value = useMemo(() => notify, [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded border p-3 text-sm shadow-lg ${
              toast.variant === 'success'
                ? 'border-green-300 bg-green-50 text-green-900'
                : 'border-slate-300 bg-white text-slate-800'
            }`}
          >
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="text-slate-500 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): (message: string, options?: ToastOptions) => void {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider.');
  }
  return context;
}
