import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserIdentity } from './user-identity.entity.js';
import { IDENTITY_STORE, TypeOrmIdentityStore } from './identity-store.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserIdentity])],
  providers: [{ provide: IDENTITY_STORE, useClass: TypeOrmIdentityStore }],
  exports: [IDENTITY_STORE],
})
export class IdentitiesModule {}
