import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailActionToken } from './email-action-token.entity.js';
import {
  ACTION_TOKEN_STORE,
  TypeOrmActionTokenStore,
} from './action-token.store.js';

@Module({
  imports: [TypeOrmModule.forFeature([EmailActionToken])],
  providers: [
    { provide: ACTION_TOKEN_STORE, useClass: TypeOrmActionTokenStore },
  ],
  exports: [ACTION_TOKEN_STORE],
})
export class ActionTokensModule {}
