/**
 * Shared frontend auth types.
 *
 * These mirror the response shapes declared in
 * `packages/contracts/src/auth.ts`. The web package intentionally does not
 * depend on the contracts workspace package (no new dependency); the shapes are
 * kept in sync manually and must match the Zod contracts.
 */

export type Locale = 'lt' | 'en';

export interface AuthUser {
  id: string;
  email: string;
}
