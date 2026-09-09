import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { z } from 'zod';

export const APP_CONFIG = Symbol('APP_CONFIG');

const envSchema = z.object({
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().positive().default(3307),
  MYSQL_DATABASE: z.string().min(1),
  MYSQL_USER: z.string().min(1),
  MYSQL_PASSWORD: z.string().min(1),
  CORS_ORIGIN: z.string().url(),
  JWT_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
  NODE_ENV: z.string().optional(),
});

export interface AppConfig {
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
  return {
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
  };
}

export const REFRESH_COOKIE_NAME = 'sm_refresh';
