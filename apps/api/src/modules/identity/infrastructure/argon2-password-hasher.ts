import {
  Algorithm,
  hash as argon2Hash,
  verify as argon2Verify,
} from '@node-rs/argon2';

import { PasswordHasher } from '../application/password-hasher.js';

const ARGON2_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

export class Argon2PasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return argon2Hash(plainPassword, ARGON2_OPTIONS);
  }

  async verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    return argon2Verify(passwordHash, plainPassword);
  }
}