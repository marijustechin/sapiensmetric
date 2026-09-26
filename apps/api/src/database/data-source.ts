import { DataSource } from 'typeorm';
import { AppConfig } from '../config/env.js';
import { User } from '../modules/users/user.entity.js';
import { AuthSession } from '../modules/auth/sessions/auth-session.entity.js';
import { EmailActionToken } from '../modules/auth/action-tokens/email-action-token.entity.js';
import { UserIdentity } from '../modules/auth/identities/user-identity.entity.js';
import { AdminAuditLog } from '../modules/admin/admin-audit.entity.js';
import { CreateAuthTables1781440000000 } from './migrations/1781440000000-CreateAuthTables.js';
import { CreateEmailActionTokens1781440000001 } from './migrations/1781440000001-CreateEmailActionTokens.js';
import { CreateUserIdentities1781440000002 } from './migrations/1781440000002-CreateUserIdentities.js';
import { CreateRolesAndAdminAudit1781440000003 } from './migrations/1781440000003-CreateRolesAndAdminAudit.js';

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
    entities: [User, AuthSession, EmailActionToken, UserIdentity, AdminAuditLog],
    migrations: [
      CreateAuthTables1781440000000,
      CreateEmailActionTokens1781440000001,
      CreateUserIdentities1781440000002,
      CreateRolesAndAdminAudit1781440000003,
    ],
    migrationsTableName: 'migrations',
  });
}
