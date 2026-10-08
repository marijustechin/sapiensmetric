'use client';

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

/**
 * Generic, auth-free modal drawer (T-020).
 *
 * Rendered in a portal on `document.body` so the rest of the page can be marked
 * `inert` while the drawer is modal. It provides the shared focus/scroll/escape
 * behaviour used by the public navigation; it carries no navigation or auth
 * semantics (the caller supplies the dialog `label` and content).
 *
 * Accessibility guarantees:
 * - focus is moved into the dialog on open and returned to the previously
 *   focused element (the trigger) on close;
 * - Tab / Shift+Tab are contained within the dialog;
 * - Escape and backdrop activation dismiss it;
 * - the element with `inertTargetId` (the app content) is made `inert` while the
 *   drawer is open, and body scrolling is locked;
 * - transition motion is disabled under `prefers-reduced-motion`.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableWithin(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-hidden') !== 'true',
  );
}

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the dialog (translated by the caller). */
  label: string;
  /** id of the page region to make `inert` while the drawer is modal. */
  inertTargetId?: string;
  /** The element that opened the drawer; focus returns here on close. */
  triggerRef?: { current: HTMLElement | null };
  /** Extra classes for the sliding panel (e.g. width constraints). */
  className?: string;
  children: ReactNode;
}

export function Drawer({
  open,
  onClose,
  label,
  inertTargetId,
  triggerRef,
  className = '',
  children,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);

  // Portals need the DOM; avoid rendering during the static export pass.
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }

    const active =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    restoreFocusRef.current = active;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const inertTarget = inertTargetId
      ? document.getElementById(inertTargetId)
      : null;
    inertTarget?.setAttribute('inert', '');

    const frame = requestAnimationFrame(() => setEntered(true));
    panelRef.current?.focus();

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      inertTarget?.removeAttribute('inert');
      // Prefer the explicit trigger so focus returns there even when the drawer
      // was opened programmatically (a programmatic click does not focus it).
      const restore = triggerRef?.current ?? restoreFocusRef.current;
      if (restore && typeof restore.focus === 'function') {
        restore.focus();
      }
    };
  }, [open, inertTargetId, triggerRef]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusableWithin(panelRef.current);
      if (items.length === 0) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }
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
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div
        className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-200 motion-reduce:transition-none ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`absolute inset-y-0 right-0 flex h-full w-[92%] max-w-sm flex-col overflow-y-auto bg-white shadow-xl outline-none transition-transform duration-200 ease-out motion-reduce:transition-none ${
          entered ? 'translate-x-0' : 'translate-x-full'
        } ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
