import { createHash } from 'node:crypto';

import { PasswordHasher } from '../src/modules/identity/application/password-hasher.js';

export class InMemoryPasswordHasher implements PasswordHasher {
  hashCount = 0;

  async hash(plainPassword: string): Promise<string> {
    this.hashCount += 1;

    const digest = createHash('sha256')
      .update(plainPassword)
      .digest('hex');

    return `insecure-test-hash:${digest}`;
  }
}