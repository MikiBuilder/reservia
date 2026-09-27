import { PrismaClient } from '@prisma/client';

import { BlackoutRepository } from '../application/blackout-repository.js';
import { BlackoutPeriod } from '../domain/blackout-period.js';
import { TimeRange } from '../../bookings/domain/time-range.js';

const supportedReasons = [
  'MAINTENANCE',
  'PRIVATE_EVENT',
  'CLEANING',
  'HOLIDAY',
  'TEMPORARY_CLOSURE',
] as const;

type BlackoutReason =
  (typeof supportedReasons)[number];

export class PrismaBlackoutRepository
  implements BlackoutRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async findByResourceId(
    resourceId: string,
  ): Promise<BlackoutPeriod[]> {
    const records =
      await this.prisma.blackoutPeriod.findMany({
        where: {
          resourceId,
        },
        orderBy: {
          startsAt: 'asc',
        },
      });

    return records.map((record) => {
      if (
        !supportedReasons.includes(
          record.reason as BlackoutReason,
        )
      ) {
        throw new Error(
          'BLACKOUT_REASON_INVALID',
        );
      }

      return BlackoutPeriod.create({
        id: record.id,
        resourceId: record.resourceId,
        period: TimeRange.create(
          record.startsAt,
          record.endsAt,
        ),
        reason: record.reason as BlackoutReason,
        description: record.description,
        now: record.createdAt,
      });
    });
  }
}