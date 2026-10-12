'use client';

import { useEffect, useState } from 'react';

/**
 * Reusable accessible back-to-top control (T-022 correction).
 *
 * - Appears only after meaningful scrolling.
 * - Keyboard operable; translated accessible name via the `label` prop.
 * - Honours `prefers-reduced-motion` (instant jump instead of smooth scroll).
 * - Sits below the consent banner (z-50), drawer (z-70), confirm dialog (z-80)
 *   and toasts (top), so it never covers them.
 * - Hydration-safe: rendered only after a client effect reports scroll position.
 */
export function BackToTop({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  const onClick = () => {
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-6 right-6 z-[45] inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-lg hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <span aria-hidden="true" className="text-lg leading-none">
        ↑
      </span>
    </button>
  );
}
