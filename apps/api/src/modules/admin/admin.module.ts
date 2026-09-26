import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity.js';
import { UserIdentity } from '../auth/identities/user-identity.entity.js';
import { AuthSession } from '../auth/sessions/auth-session.entity.js';
import { UsersModule } from '../users/users.module.js';
import { SessionsModule } from '../auth/sessions/sessions.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AdminAuditLog } from './admin-audit.entity.js';
import { ADMIN_STORE, TypeOrmAdminStore } from './admin-store.js';
import { AdminService } from './admin.service.js';
import { AdminGuard } from './admin.guard.js';
import { AdminController } from './admin.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserIdentity, AuthSession, AdminAuditLog]),
    UsersModule,
    SessionsModule,
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminGuard,
    { provide: ADMIN_STORE, useClass: TypeOrmAdminStore },
  ],
})
export class AdminModule {}
