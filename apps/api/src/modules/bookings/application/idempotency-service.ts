import { randomUUID } from 'node:crypto';
import {
  IdempotencyRecordData,
  IdempotencyRepository,
} from './idempotency-repository.js';

export class IdempotencyService {
  constructor(
    private readonly repository: IdempotencyRepository,
  ) {}

  async findExisting(
    operation: string,
    key: string,
    requestHash: string,
  ): Promise<IdempotencyRecordData | null> {
    const record = await this.repository.find(
      operation,
      key,
    );

    if (!record) {
      return null;
    }

    if (record.requestHash !== requestHash) {
      throw new Error('IDEMPOTENCY_KEY_REUSED');
    }

    if (record.expiresAt <= new Date()) {
      return null;
    }

    return record;
  }

  async start(
    operation: string,
    key: string,
    requestHash: string,
    ttlInMinutes = 60,
  ): Promise<IdempotencyRecordData> {
    const expiresAt = new Date(
      Date.now() + ttlInMinutes * 60_000,
    );

    return this.repository.createProcessing({
      id: randomUUID(),
      key,
      operation,
      requestHash,
      expiresAt,
    });
  }
}