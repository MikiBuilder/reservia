import { IdempotencyStatus } from '@prisma/client';
import {
  IdempotencyRecordData,
  IdempotencyRepository,
} from '../src/modules/bookings/application/idempotency-repository.js';

export class InMemoryIdempotencyRepository
  implements IdempotencyRepository
{
  readonly records: IdempotencyRecordData[] = [];

  async find(
    operation: string,
    key: string,
  ): Promise<IdempotencyRecordData | null> {
    const record = this.records.find(
      (item) =>
        item.operation === operation &&
        item.key === key,
    );

    return record ?? null;
  }

  async createProcessing(params: {
    id: string;
    key: string;
    operation: string;
    requestHash: string;
    expiresAt: Date;
  }): Promise<IdempotencyRecordData> {
    const record: IdempotencyRecordData = {
      id: params.id,
      key: params.key,
      operation: params.operation,
      requestHash: params.requestHash,
      status: IdempotencyStatus.PROCESSING,
      responseStatus: null,
      responseBody: null,
      createdAt: new Date(),
      completedAt: null,
      expiresAt: params.expiresAt,
    };

    this.records.push(record);

    return record;
  }

  async markCompleted(params: {
    id: string;
    responseStatus: number;
    responseBody: unknown;
  }): Promise<void> {
    const record = this.records.find(
      (item) => item.id === params.id,
    );

    if (!record) {
      throw new Error('IDEMPOTENCY_RECORD_NOT_FOUND');
    }

    record.status = IdempotencyStatus.COMPLETED;
    record.responseStatus = params.responseStatus;
    record.responseBody = params.responseBody;
    record.completedAt = new Date();
  }

  async markFailed(params: {
    id: string;
    error: string;
  }): Promise<void> {
    const record = this.records.find(
      (item) => item.id === params.id,
    );

    if (!record) {
      throw new Error('IDEMPOTENCY_RECORD_NOT_FOUND');
    }

    record.status = IdempotencyStatus.FAILED;
    record.responseBody = {
      error: params.error,
    };
  }
}