import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import type { PrismaTransactionClient } from './prisma-transaction-context.js';
import { BookingCreatedEvent } from '../application/booking-events.js';
import { OutboxRepository } from '../application/outbox-repository.js';

type PrismaDatabaseClient =
  | PrismaClient
  | Prisma.TransactionClient;

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
        payload: JSON.parse(JSON.stringify(event)),
        status: 'PENDING',
        occurredAt: event.occurredAt,
      },
    });
  }
}