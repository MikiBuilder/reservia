import {
  Prisma,
  PrismaClient,
} from '@prisma/client';

import type { PrismaTransactionClient } from './prisma-transaction-context.js';

import { Booking } from '../domain/booking.js';
import { TimeRange } from '../domain/time-range.js';
import { BookingRepository } from '../application/booking-repository.js';

type PrismaDatabaseClient =
  | PrismaClient
  | PrismaTransactionClient;

export class PrismaBookingRepository
  implements BookingRepository
{
  constructor(
    private readonly prisma: PrismaDatabaseClient,
  ) {}

  async findActiveByResourceId(
    resourceId: string,
  ): Promise<Booking[]> {
    const records = await this.prisma.booking.findMany({
      where: {
        resourceId,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      orderBy: {
        startsAt: 'asc',
      },
    });

    return records.map((record) =>
      Booking.rehydrate({
        id: record.id,
        resourceId: record.resourceId,
        customerId: record.customerId,
        period: TimeRange.create(
          record.startsAt,
          record.endsAt,
        ),
        status: record.status,
        createdAt: record.createdAt,
      }),
    );
  }

  async save(booking: Booking): Promise<void> {
    await this.prisma.booking.create({
      data: {
        id: booking.id,
        resourceId: booking.resourceId,
        customerId: booking.customerId,
        startsAt: booking.period.startsAt,
        endsAt: booking.period.endsAt,
        status: booking.currentStatus,
        createdAt: booking.createdAt,
      },
    });
  }
}