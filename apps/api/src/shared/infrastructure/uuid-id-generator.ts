import { randomUUID } from 'node:crypto';

import { IdGenerator } from '../application/id-generator.js';

export class UuidIdGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}