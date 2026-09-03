import { PrismaClient } from '@prisma/client';
import { PrismaBookingRepository } from './prisma-booking-repository.js';
import { PrismaOutboxRepository } from './prisma-outbox-repository.js';

export type PrismaTransactionClient =
  Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export class PrismaTransactionContext {
  readonly bookings: PrismaBookingRepository;
  readonly outbox: PrismaOutboxRepository;

  constructor(client: PrismaTransactionClient) {
    this.bookings = new PrismaBookingRepository(client);
    this.outbox = new PrismaOutboxRepository(client);
  }
}