import { PrismaClient } from '@prisma/client';

import { BusinessHoursRepository } from '../application/business-hours-repository.js';
import { BusinessHours } from '../domain/business-hours.js';
import { DailySchedule } from '../domain/daily-schedule.js';
import { DayOfWeek } from '../domain/day-of-week.js';

type PersistedSchedule = Record<
  string,
  {
    opensAt?: unknown;
    closesAt?: unknown;
  }
>;

const supportedDays: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

export class PrismaBusinessHoursRepository
  implements BusinessHoursRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async findByResourceId(
    resourceId: string,
  ): Promise<BusinessHours | null> {
    const record =
      await this.prisma.resourceBusinessHours.findUnique({
        where: {
          resourceId,
        },
      });

    if (!record) {
      return null;
    }

    return BusinessHours.create(
      this.toWeeklySchedule(record.schedule),
    );
  }

  private toWeeklySchedule(
    value: unknown,
  ): Partial<Record<DayOfWeek, DailySchedule>> {
    if (
      typeof value !== 'object' ||
      value === null ||
      Array.isArray(value)
    ) {
      throw new Error(
        'BUSINESS_HOURS_SCHEDULE_INVALID',
      );
    }

    const schedule = value as PersistedSchedule;

    const weeklySchedule: Partial<
      Record<DayOfWeek, DailySchedule>
    > = {};

    for (const day of supportedDays) {
      const dailySchedule = schedule[day];

      if (!dailySchedule) {
        continue;
      }

      if (
        typeof dailySchedule.opensAt !== 'string' ||
        typeof dailySchedule.closesAt !== 'string'
      ) {
        throw new Error(
          'BUSINESS_HOURS_SCHEDULE_INVALID',
        );
      }

      weeklySchedule[day] = DailySchedule.create(
        dailySchedule.opensAt,
        dailySchedule.closesAt,
      );
    }

    return weeklySchedule;
  }
}