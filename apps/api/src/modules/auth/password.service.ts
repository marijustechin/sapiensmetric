import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';

export const PASSWORD_SERVICE = Symbol('PASSWORD_SERVICE');

export interface PasswordService {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

@Injectable()
export class Argon2PasswordService implements PasswordService {
  async hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  async verify(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }
}
