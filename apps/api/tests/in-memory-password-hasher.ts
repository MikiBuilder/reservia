import { createHash } from 'node:crypto';

import { PasswordHasher } from '../src/modules/identity/application/password-hasher.js';

export class InMemoryPasswordHasher implements PasswordHasher {
  hashCount = 0;
  verifyCount = 0;

  async hash(plainPassword: string): Promise<string> {
    this.hashCount += 1;

    return this.computeHash(plainPassword);
  }

  async verify(
    plainPassword: string,
    passwordHash: string,
  ): Promise<boolean> {
    this.verifyCount += 1;

    return this.computeHash(plainPassword) === passwordHash;
  }

  private computeHash(plainPassword: string): string {
    const digest = createHash('sha256')
      .update(plainPassword)
      .digest('hex');

    return `insecure-test-hash:${digest}`;
  }
}