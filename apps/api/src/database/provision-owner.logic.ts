import { randomBytes } from 'node:crypto';

/**
 * Pure logic for the T-023 owner-account provisioning command. Kept separate so
 * it can be unit-tested without a database. This is an operator workflow, never
 * an HTTP endpoint: the closed review environment must not expose any bootstrap
 * surface.
 */

export interface ProvisionArgs {
  email?: string;
  /** Read the password from stdin instead of generating a strong one. */
  passwordStdin: boolean;
  /** Write a generated password to this file (0600) instead of printing it. */
  passwordOut?: string;
  /** Only grant closed-review eligibility to an existing account. */
  grantReview: boolean;
  apply: boolean;
  help: boolean;
}

export function parseProvisionArgs(argv: string[]): ProvisionArgs {
  const args: ProvisionArgs = {
    passwordStdin: false,
    grantReview: false,
    apply: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--') {
      // pnpm/tsx pass through the script-argument separator; ignore it.
      continue;
    }
    if (arg === '--apply') {
      args.apply = true;
    } else if (arg === '--password-stdin') {
      args.passwordStdin = true;
    } else if (arg === '--password-out') {
      args.passwordOut = argv[++i];
    } else if (arg === '--grant-review') {
      args.grantReview = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--email') {
      args.email = argv[++i];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

export function usage(): string {
  return [
    'Provision (or update) the owner account for the closed review environment (T-023).',
    'Runs as an operator workflow inside the API container; it is NOT an HTTP endpoint.',
    '',
    'Usage:',
    '  pnpm --filter @sapiensmetric/api owner:provision -- --email <email> [--password-stdin] [--apply]',
    '  pnpm --filter @sapiensmetric/api owner:provision -- --email <email> --grant-review [--apply]',
    '',
    '  --email <email>     required; the account to create or update',
    '  --password-stdin    read a password from stdin (default: generate a strong one)',
    '  --password-out <f>  write a generated password to file <f> (0600) instead of',
    '                      printing it (recommended for unattended installers)',
    '  --grant-review      only mark an existing account as a closed-review reviewer',
    '  --apply             make the change (without it this is a dry run)',
    '',
    'Without --password-stdin a strong password is generated and printed exactly',
    'once so the operator can hand it over. Generate/rotate secrets with secure',
    'tooling; never paste secret values into tickets or chat.',
  ].join('\n');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/**
 * A strong, URL-safe password (32 random bytes ⇒ 43 characters). Never derived
 * from the email or time.
 */
export function generatePassword(): string {
  return randomBytes(32).toString('base64url');
}

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export function assertPasswordAcceptable(password: string): void {
  if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    throw new Error(
      `Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters.`,
    );
  }
}
