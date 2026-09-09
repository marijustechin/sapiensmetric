import { Module } from '@nestjs/common';
import { SESSION_STORE, TypeOrmSessionStore } from './session-store.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSession } from './auth-session.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([AuthSession])],
  providers: [{ provide: SESSION_STORE, useClass: TypeOrmSessionStore }],
  exports: [SESSION_STORE],
})
export class SessionsModule {}
