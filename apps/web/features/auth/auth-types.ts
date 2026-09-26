/**
 * Shared frontend auth types.
 *
 * These mirror the response shapes declared in
 * `packages/contracts/src/auth.ts`. The web package intentionally does not
 * depend on the contracts workspace package (no new dependency); the shapes are
 * kept in sync manually and must match the Zod contracts.
 */

import type {AppLocale} from '../../shared/lib/locale-navigation';

export type Locale = AppLocale;

export interface AuthUser {
  id: string;
  email: string;
}
