import { Prisma, PrismaClient } from '@prisma/client';
import type { PrismaTransactionClient } from './prisma-transaction-context.js';

import {
  IdempotencyRecordData,
  IdempotencyRepository,
} from '../application/idempotency-repository.js';

type PrismaDatabaseClient =
  | PrismaClient
  | PrismaTransactionClient;

export class PrismaIdempotencyRepository
  implements IdempotencyRepository
{
  constructor(
    private readonly prisma: PrismaDatabaseClient,
  ) {}

  async find(
    operation: string,
    key: string,
  ): Promise<IdempotencyRecordData | null> {
    const record =
      await this.prisma.idempotencyRecord.findUnique({
        where: {
          key,
        },
      });

    if (!record || record.operation !== operation) {
      return null;
    }

    return this.toDomain(record);
  }

  async createProcessing(params: {
    id: string;
    key: string;
    operation: string;
    requestHash: string;
    expiresAt: Date;
  }): Promise<IdempotencyRecordData> {
    const record =
      await this.prisma.idempotencyRecord.create({
        data: {
          id: params.id,
          key: params.key,
          operation: params.operation,
          requestHash: params.requestHash,
          status: 'PROCESSING',
          expiresAt: params.expiresAt,
        },
      });

    return this.toDomain(record);
  }

  async markCompleted(params: {
    id: string;
    responseStatus: number;
    responseBody: unknown;
  }): Promise<void> {
    await this.prisma.idempotencyRecord.update({
      where: {
        id: params.id,
      },
      data: {
        status: 'COMPLETED',
        responseStatus: params.responseStatus,
        responseBody: JSON.parse(
          JSON.stringify(params.responseBody),
        ),
        completedAt: new Date(),
      },
    });
  }

  async markFailed(params: {
    id: string;
    error: string;
  }): Promise<void> {
    await this.prisma.idempotencyRecord.update({
      where: {
        id: params.id,
      },
      data: {
        status: 'FAILED',
        responseBody: {
          error: params.error,
        },
      },
    });
  }

  private toDomain(record: {
    id: string;
    key: string;
    operation: string;
    requestHash: string;
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
    responseStatus: number | null;
    responseBody: Prisma.JsonValue | null;
    createdAt: Date;
    completedAt: Date | null;
    expiresAt: Date;
  }): IdempotencyRecordData {
    return {
      id: record.id,
      key: record.key,
      operation: record.operation,
      requestHash: record.requestHash,
      status: record.status,
      responseStatus: record.responseStatus,
      responseBody: record.responseBody,
      createdAt: record.createdAt,
      completedAt: record.completedAt,
      expiresAt: record.expiresAt,
    };
  }
}