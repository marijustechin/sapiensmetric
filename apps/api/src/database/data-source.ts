import { DataSource } from 'typeorm';
import { AppConfig } from '../config/env.js';
import { User } from '../modules/users/user.entity.js';
import { AuthSession } from '../modules/auth/sessions/auth-session.entity.js';
import { CreateAuthTables1781440000000 } from './migrations/1781440000000-CreateAuthTables.js';

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
    entities: [User, AuthSession],
    migrations: [CreateAuthTables1781440000000],
    migrationsTableName: 'migrations',
  });
}
