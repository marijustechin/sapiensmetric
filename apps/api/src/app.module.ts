import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller.js';
import { loadAppConfig } from './config/env.js';
import { AppConfigModule } from './config/config.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { SessionsModule } from './modules/auth/sessions/sessions.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const config = loadAppConfig();
        return {
          type: 'mysql' as const,
          host: config.db.host,
          port: config.db.port,
          username: config.db.username,
          password: config.db.password,
          database: config.db.database,
          charset: 'utf8mb4',
          synchronize: false,
          autoLoadEntities: true,
        };
      },
    }),
    AuthModule,
    UsersModule,
    SessionsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
