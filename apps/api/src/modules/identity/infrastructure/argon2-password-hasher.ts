import { Algorithm, hash } from '@node-rs/argon2';

import { PasswordHasher } from '../application/password-hasher.js';

const ARGON2_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

export class Argon2PasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return hash(plainPassword, ARGON2_OPTIONS);
  }
}