import { randomUUID } from 'node:crypto';

import { PrismaClient } from '@prisma/client';

import type { PrismaTransactionClient } from './prisma-transaction-context.js';

import {
  BookingCreatedEvent,
} from '../application/booking-events.js';

import {
  OutboxRepository,
  PendingOutboxMessage,
} from '../application/outbox-repository.js';

type PrismaDatabaseClient =
  | PrismaClient
  | PrismaTransactionClient;

export class PrismaOutboxRepository
  implements OutboxRepository
{
  constructor(
    private readonly prisma: PrismaDatabaseClient,
  ) {}

  async saveBookingCreated(
    event: BookingCreatedEvent,
  ): Promise<void> {
    await this.prisma.outboxMessage.create({
      data: {
        id: randomUUID(),
        eventType: event.type,
        aggregateId: event.bookingId,
        payload: JSON.parse(
          JSON.stringify(event),
        ),
        status: 'PENDING',
        occurredAt: event.occurredAt,
      },
    });
  }

  async findPending(
    limit: number,
  ): Promise<PendingOutboxMessage[]> {
    const messages =
      await this.prisma.outboxMessage.findMany({
        where: {
          status: 'PENDING',
        },
        orderBy: {
          occurredAt: 'asc',
        },
        take: limit,
      });

    return messages.map((message) => ({
      id: message.id,
      eventType: message.eventType,
      aggregateId: message.aggregateId,
      payload: message.payload,
      attempts: message.attempts,
      occurredAt: message.occurredAt,
    }));
  }

  async markProcessed(id: string): Promise<void> {
    await this.prisma.outboxMessage.update({
      where: {
        id,
      },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    });
  }

  async markFailed(
    id: string,
    error: string,
  ): Promise<void> {
    await this.prisma.outboxMessage.update({
      where: {
        id,
      },
      data: {
        status: 'FAILED',
        attempts: {
          increment: 1,
        },
        lastError: error,
      },
    });
  }
}