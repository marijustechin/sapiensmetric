'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

/**
 * Reusable application confirmation dialog (T-022 UX follow-up).
 *
 * Replaces `window.confirm` for application-controlled decisions. It provides:
 * - a modal in the existing visual language, responsive and translated;
 * - keyboard operation with focus entering the dialog, contained while modal,
 *   and returned to the trigger on close;
 * - an accessible name (`role="dialog"` + `aria-labelledby`);
 * - a distinct destructive treatment;
 * - Escape, backdrop activation and dismissal **cancel** (never confirm).
 *
 * It does NOT and cannot replace the browser's native warning for closing or
 * reloading a tab with unsaved work; that stays `beforeunload` (see
 * `shared/lib/use-unsaved-changes-warning.ts`).
 */
export interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Destructive actions get a distinct (red) confirm button. */
  destructive?: boolean;
}

type ConfirmRequest = ConfirmOptions & { resolve: (value: boolean) => void };

const ConfirmContext = createContext<
  ((options: ConfirmOptions) => Promise<boolean>) | null
>(null);

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setRequest({ ...options, resolve })),
    [],
  );

  const close = useCallback((value: boolean) => {
    setRequest((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!request) return;
    restoreRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    // Initial focus: the safe (cancel) action.
    cancelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const items = panelRef.current
        ? Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
        : [];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = active ? panelRef.current?.contains(active) : false;
      if (event.shiftKey) {
        if (!inside || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!inside || active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      restoreRef.current?.focus?.();
    };
  }, [request, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-slate-900/50"
                aria-hidden="true"
                onClick={() => close(false)}
              />
              <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                className="relative z-10 w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
              >
                <h2 id="confirm-dialog-title" className="text-lg font-semibold text-slate-900">
                  {request.title}
                </h2>
                {request.body ? (
                  <p className="mt-2 text-sm text-slate-700">{request.body}</p>
                ) : null}
                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <button
                    ref={cancelRef}
                    type="button"
                    onClick={() => close(false)}
                    className="inline-flex min-h-[44px] items-center rounded border border-slate-400 px-4 text-sm text-slate-800 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {request.cancelLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => close(true)}
                    className={`inline-flex min-h-[44px] items-center rounded px-4 text-sm font-medium text-white focus:outline-none focus:ring-2 ${
                      request.destructive
                        ? 'bg-red-700 hover:bg-red-800 focus:ring-red-500'
                        : 'bg-blue-700 hover:bg-blue-800 focus:ring-blue-500'
                    }`}
                  >
                    {request.confirmLabel}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider.');
  }
  return context;
}
