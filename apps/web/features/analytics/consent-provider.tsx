'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from '../../shared/i18n/navigation';
import {
  readConsent,
  writeConsent,
  type ConsentState,
} from '../../shared/lib/consent';
import {
  buildPageContext,
  deleteAnalyticsCookies,
  ensureGtmLoaded,
  isEligibleAnalyticsPath,
  isProductionHost,
  markPageViewSent,
  pushPageView,
  type PageContext,
} from '../../shared/lib/analytics';

interface ConsentContextValue {
  decision: ConsentState | null;
  settingsOpen: boolean;
  openSettings: () => void;
  accept: () => void;
  reject: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function eligibleNow(pathname: string): boolean {
  if (typeof window === 'undefined') return false;
  return isProductionHost(window.location.hostname) && isEligibleAnalyticsPath(pathname);
}

function currentContext(): PageContext {
  return buildPageContext({
    origin: window.location.origin,
    pathname: window.location.pathname,
    title: typeof document === 'undefined' ? '' : document.title,
    referrer: typeof document === 'undefined' ? '' : document.referrer,
  });
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const [decision, setDecision] = useState<ConsentState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const busy = useRef(false);

  // Read the stored decision once on mount (no network before consent).
  useEffect(() => {
    setDecision(readConsent(storage()));
  }, []);

  // Load GTM only after consent, only on eligible production routes. This
  // effect is declared BEFORE the page-view effect so consent is established
  // (and GTM bootstrapped) before the first spa_page_view is pushed.
  useEffect(() => {
    if (decision === 'granted' && eligibleNow(pathname)) {
      ensureGtmLoaded(currentContext());
    }
  }, [decision, pathname]);

  // One page_view per eligible page after consent, including client navigation.
  useEffect(() => {
    if (decision !== 'granted' || !eligibleNow(pathname)) return;
    const browserPath = window.location.pathname;
    if (markPageViewSent(browserPath)) {
      pushPageView(currentContext());
    }
  }, [decision, pathname]);

  const accept = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    writeConsent(storage(), 'granted');
    setDecision('granted');
    setSettingsOpen(false);
    busy.current = false;
  }, []);

  const reject = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    const wasGranted = decision === 'granted';
    writeConsent(storage(), 'denied');
    setDecision('denied');
    setSettingsOpen(false);
    if (wasGranted) {
      // Withdrawal: stop collection, remove cookies, and reload so any loaded
      // (or still-loading) GTM/GA4 state is discarded. This also interrupts a
      // GTM load that is in flight, so collection cannot start afterwards.
      deleteAnalyticsCookies();
      busy.current = false;
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
      return;
    }
    busy.current = false;
  }, [decision]);

  const openSettings = useCallback(() => setSettingsOpen(true), []);

  const value = useMemo<ConsentContextValue>(
    () => ({ decision, settingsOpen, openSettings, accept, reject }),
    [decision, settingsOpen, openSettings, accept, reject],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider.');
  }
  return context;
}
