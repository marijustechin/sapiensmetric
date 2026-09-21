import { DataSource } from 'typeorm';
import { AppConfig } from '../config/env.js';
import { User } from '../modules/users/user.entity.js';
import { AuthSession } from '../modules/auth/sessions/auth-session.entity.js';
import { EmailActionToken } from '../modules/auth/action-tokens/email-action-token.entity.js';
import { CreateAuthTables1781440000000 } from './migrations/1781440000000-CreateAuthTables.js';
import { CreateEmailActionTokens1781440000001 } from './migrations/1781440000001-CreateEmailActionTokens.js';

export function createDataSource(config: AppConfig): DataSource {
  return new DataSource({
    type: 'mysql',
    host: config.db.host,
    port: config.db.port,
    username: config.db.username,
    password: config.db.password,
    database: config.db.database,
    charset: 'utf8mb4',
    synchronize: false,
    entities: [User, AuthSession, EmailActionToken],
    migrations: [
      CreateAuthTables1781440000000,
      CreateEmailActionTokens1781440000001,
    ],
    migrationsTableName: 'migrations',
  });
}
