'use client';

import { useEffect, useState } from 'react';
import * as authApi from './auth-api';

export interface AuthCapabilities {
  google: boolean;
  registration: boolean;
}

/**
 * Fetch the public auth capability flags (T-023) once per mount.
 *
 * Fail closed: while unknown this returns `null` (callers hide the controls),
 * and on a network/HTTP error it returns both flags `false` so a closed
 * environment never shows a registration CTA it cannot honour.
 */
export function useAuthCapabilities(): AuthCapabilities | null {
  const [capabilities, setCapabilities] = useState<AuthCapabilities | null>(null);

  useEffect(() => {
    let active = true;
    void authApi.getCapabilities().then((result) => {
      if (!active) return;
      setCapabilities(
        result.kind === 'success'
          ? result.data
          : { google: false, registration: false },
      );
    });
    return () => {
      active = false;
    };
  }, []);

  return capabilities;
}
