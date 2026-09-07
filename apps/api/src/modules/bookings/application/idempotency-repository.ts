import { IdempotencyStatus } from '@prisma/client';

export interface IdempotencyRecordData {
  id: string;
  key: string;
  operation: string;
  requestHash: string;
  status: IdempotencyStatus;
  responseStatus: number | null;
  responseBody: unknown | null;
  createdAt: Date;
  completedAt: Date | null;
  expiresAt: Date;
}

export interface IdempotencyRepository {
  find(
    operation: string,
    key: string,
  ): Promise<IdempotencyRecordData | null>;

  createProcessing(params: {
    id: string;
    key: string;
    operation: string;
    requestHash: string;
    expiresAt: Date;
  }): Promise<IdempotencyRecordData>;

  markCompleted(params: {
    id: string;
    responseStatus: number;
    responseBody: unknown;
  }): Promise<void>;

  markFailed(params: {
    id: string;
    error: string;
  }): Promise<void>;
}