/**
 * Pure logic for the T-012 administrator bootstrap command. Kept separate from
 * the runner so it can be unit-tested without a database.
 */
import type { UserRole, UserStatus } from '@sapiensmetric/contracts';

export interface PromoteArgs {
  email?: string;
  id?: string;
  apply: boolean;
  help: boolean;
}

export function parseArgs(argv: string[]): PromoteArgs {
  const args: PromoteArgs = { apply: false, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--') {
      // pnpm/tsx pass through the script-argument separator; ignore it.
      continue;
    }
    if (arg === '--apply') {
      args.apply = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--email') {
      args.email = argv[++i];
    } else if (arg === '--id') {
      args.id = argv[++i];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

export function usage(): string {
  return [
    'Promote an existing, active, verified account to administrator.',
    '',
    'Usage:',
    '  pnpm --filter @sapiensmetric/api admin:promote -- --email <email> [--apply]',
    '  pnpm --filter @sapiensmetric/api admin:promote -- --id <uuid> [--apply]',
    '',
    'Without --apply this is a dry run. Requires exactly one of --email/--id.',
  ].join('\n');
}

export interface PromoteTarget {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: Date | null;
}

export type PromotionDecision =
  | { kind: 'already-admin' }
  | { kind: 'dry-run' }
  | { kind: 'apply' };

/**
 * Decide what to do for a target. Throws when the account is unverified or
 * suspended; already-admin is a safe no-op.
 */
export function decidePromotion(
  target: PromoteTarget,
  apply: boolean,
): PromotionDecision {
  if (!target.emailVerifiedAt) {
    throw new Error(`Account ${target.email} is not email-verified.`);
  }
  if (target.status !== 'active') {
    throw new Error(`Account ${target.email} is suspended.`);
  }
  if (target.role === 'admin') {
    return { kind: 'already-admin' };
  }
  return apply ? { kind: 'apply' } : { kind: 'dry-run' };
}
