import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { z } from 'zod';

export const APP_CONFIG = Symbol('APP_CONFIG');

/**
 * Validate and canonicalise an exact HTTP(S) origin. Rejects wildcard,
 * userinfo, any path other than "/", query strings, and fragments. The stored
 * value is the canonical `URL.origin`, so a harmless trailing slash cannot
 * break Origin checks.
 */
function parseCanonicalOrigin(value: string, ctx: z.RefinementCtx): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'must be an absolute HTTP(S) origin',
    });
    return value;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'must be an HTTP(S) origin',
    });
  }
  if (url.username || url.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'must not contain userinfo',
    });
  }
  if (url.pathname !== '/') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'must not contain a path',
    });
  }
  if (url.search || url.hash) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'must not contain a query or fragment',
    });
  }
  return url.origin;
}

const canonicalOriginSchema = z.string().min(1).transform(parseCanonicalOrigin);

/**
 * Validates a plain mailbox address or a display-name form
 * ("Name <user@example.test>").
 */
function isMailbox(value: string): boolean {
  const angle = /<([^<>]+)>\s*$/.exec(value.trim());
  const address = (angle ? angle[1] : value).trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address);
}

const mailboxSchema = z
  .string()
  .min(3)
  .refine(isMailbox, 'must be a valid mailbox address');

const envSchema = z.object({
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().positive().default(3307),
  // Local Nest listener port. It need not equal the public API URL port,
  // because production may sit behind a reverse proxy.
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  MYSQL_DATABASE: z.string().min(1),
  MYSQL_USER: z.string().min(1),
  MYSQL_PASSWORD: z.string().min(1),
  CORS_ORIGIN: canonicalOriginSchema,
  JWT_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
  NODE_ENV: z.string().optional(),

  // T-006 — generic authenticated SMTP. Validated strictly; invalid or
  // missing values fail closed.
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535),
  SMTP_SECURE: z.enum(['true', 'false']),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  SMTP_FROM: mailboxSchema,
  SMTP_TEST_RECIPIENT: z.string().email().optional(),
  EMAIL_VERIFICATION_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(86400),
  PASSWORD_RESET_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(1800),

  // T-007 — optional Google OAuth/OpenID Connect. All three values must be
  // present for Google sign-in to be available; otherwise it stays disabled and
  // password authentication is unaffected.
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),

  // Public web configuration. Only NEXT_PUBLIC_API_BASE_URL is exposed to the
  // browser (by the web build); no secret may use the NEXT_PUBLIC_ prefix.
  PUBLIC_APP_URL: canonicalOriginSchema,
});

export interface AppConfig {
  api: {
    port: number;
  };
  db: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
  cors: {
    origin: string;
  };
  jwt: {
    secret: string;
    accessTokenTtlSeconds: number;
  };
  auth: {
    refreshSessionTtlMs: number;
    refreshSessionTtlSeconds: number;
    cookieSecure: boolean;
  };
  mail: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    from: string;
    testRecipient: string | null;
  };
  tokens: {
    verificationTtlSeconds: number;
    passwordResetTtlSeconds: number;
  };
  publicAppUrl: string;
  google: {
    clientId: string | null;
    clientSecret: string | null;
    redirectUri: string | null;
    enabled: boolean;
  };
}

function findRootEnv(): string | undefined {
  let dir = process.cwd();
  for (let i = 0; i < 12; i++) {
    const candidate = resolve(dir, '.env');
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return undefined;
}

export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const envPath = findRootEnv();
  if (envPath) {
    loadDotenv({ path: envPath });
  }
  const parsed = envSchema.parse(env);

  // Binding public-origin policy: PUBLIC_APP_URL and CORS_ORIGIN must each be a
  // strict canonical HTTP(S) origin and must be equal after canonicalisation.
  // PUBLIC_APP_URL is the web/browser origin used in email links.
  // NEXT_PUBLIC_API_BASE_URL is a separately validated API base URL and may use
  // a different port/origin.
  if (parsed.PUBLIC_APP_URL !== parsed.CORS_ORIGIN) {
    throw new Error(
      'PUBLIC_APP_URL and CORS_ORIGIN must be equal after canonicalisation.',
    );
  }

  return {
    api: {
      port: parsed.API_PORT,
    },
    db: {
      host: parsed.DB_HOST,
      port: parsed.DB_PORT,
      database: parsed.MYSQL_DATABASE,
      username: parsed.MYSQL_USER,
      password: parsed.MYSQL_PASSWORD,
    },
    cors: {
      origin: parsed.CORS_ORIGIN,
    },
    jwt: {
      secret: parsed.JWT_SECRET,
      accessTokenTtlSeconds: parsed.ACCESS_TOKEN_TTL_SECONDS,
    },
    auth: {
      refreshSessionTtlMs:
        parsed.REFRESH_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
      refreshSessionTtlSeconds: parsed.REFRESH_SESSION_TTL_DAYS * 24 * 60 * 60,
      cookieSecure: parsed.NODE_ENV === 'production',
    },
    mail: {
      host: parsed.SMTP_HOST,
      port: parsed.SMTP_PORT,
      secure: parsed.SMTP_SECURE === 'true',
      user: parsed.SMTP_USER,
      password: parsed.SMTP_PASSWORD,
      from: parsed.SMTP_FROM,
      testRecipient: parsed.SMTP_TEST_RECIPIENT ?? null,
    },
    tokens: {
      verificationTtlSeconds: parsed.EMAIL_VERIFICATION_TOKEN_TTL_SECONDS,
      passwordResetTtlSeconds: parsed.PASSWORD_RESET_TOKEN_TTL_SECONDS,
    },
    publicAppUrl: parsed.PUBLIC_APP_URL,
    google: {
      clientId: parsed.GOOGLE_CLIENT_ID ?? null,
      clientSecret: parsed.GOOGLE_CLIENT_SECRET ?? null,
      redirectUri: parsed.GOOGLE_REDIRECT_URI ?? null,
      enabled: Boolean(
        parsed.GOOGLE_CLIENT_ID &&
          parsed.GOOGLE_CLIENT_SECRET &&
          parsed.GOOGLE_REDIRECT_URI,
      ),
    },
  };
}

export const REFRESH_COOKIE_NAME = 'sm_refresh';
