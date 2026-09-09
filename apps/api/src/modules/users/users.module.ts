import { Module } from '@nestjs/common';
import { USER_STORE, TypeOrmUserStore } from './user-store.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [{ provide: USER_STORE, useClass: TypeOrmUserStore }],
  exports: [USER_STORE],
})
export class UsersModule {}
