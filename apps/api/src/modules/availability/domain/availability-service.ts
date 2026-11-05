import {
  Inject,
  Injectable,
} from '@nestjs/common';

import { Booking } from '../../bookings/domain/booking.js';
import { BookingConflictPolicy } from '../../bookings/domain/booking-conflict.js';
import { TimeRange } from '../../bookings/domain/time-range.js';
import { Resource } from '../../resources/domain/resource.js';

import { BusinessHours } from './business-hours.js';
import { BlackoutPeriod } from './blackout-period.js';
import { DayOfWeek } from './day-of-week.js';

const SLOT_MINUTES = 60;

@Injectable()
export class AvailabilityService {
  constructor(
    @Inject(BookingConflictPolicy)
    private readonly bookingConflictPolicy: BookingConflictPolicy,
  ) {}

  canBeBooked(params: {
    resource: Resource;
    businessHours: BusinessHours;
    period: TimeRange;
    blackouts: BlackoutPeriod[];
    existingBookings: Booking[];
  }): boolean {
    if (!params.resource.canBeBooked()) {
      return false;
    }

    const day =
      AvailabilityService.dayOfWeekFromDate(
        params.period.startsAt,
      );

    const schedule =
      params.businessHours.getScheduleFor(day);

    if (!schedule) {
      return false;
    }

    const startsAt = AvailabilityService.formatTime(
      params.period.startsAt,
    );

    const endsAt = AvailabilityService.formatTime(
      params.period.endsAt,
    );

    if (!schedule.containsTime(startsAt)) {
      return false;
    }

    if (
      !AvailabilityService.isSameUtcDay(
        params.period.startsAt,
        params.period.endsAt,
      )
    ) {
      return false;
    }

    if (endsAt > schedule.closesAt) {
      return false;
    }

    const hasBlackout = params.blackouts.some(
      (blackout) =>
        blackout.resourceId === params.resource.id &&
        blackout.affects(params.period),
    );

    if (hasBlackout) {
      return false;
    }

    try {
      this.bookingConflictPolicy.ensureNoConflict(
        params.resource.id,
        params.period,
        params.existingBookings,
      );

      return true;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'BOOKING_CONFLICT'
      ) {
        return false;
      }

      throw error;
    }
  }

  findAvailableSlots(params: {
    resource: Resource;
    businessHours: BusinessHours;
    blackouts: BlackoutPeriod[];
    existingBookings: Booking[];
    date: Date;
  }): TimeRange[] {
    const day =
      AvailabilityService.dayOfWeekFromDate(params.date);

    const schedule =
      params.businessHours.getScheduleFor(day);

    if (!schedule) {
      return [];
    }

    const opensAt = AvailabilityService.timeOnDate(
      params.date,
      schedule.opensAt,
    );

    const closesAt = AvailabilityService.timeOnDate(
      params.date,
      schedule.closesAt,
    );

    const slots: TimeRange[] = [];
    let startsAt = opensAt;

    while (startsAt.getTime() < closesAt.getTime()) {
      const endsAt = new Date(
        startsAt.getTime() + SLOT_MINUTES * 60_000,
      );

      if (endsAt.getTime() > closesAt.getTime()) {
        break;
      }

      const period = TimeRange.create(startsAt, endsAt);

      if (
        this.canBeBooked({
          resource: params.resource,
          businessHours: params.businessHours,
          period,
          blackouts: params.blackouts,
          existingBookings: params.existingBookings,
        })
      ) {
        slots.push(period);
      }

      startsAt = endsAt;
    }

    return slots;
  }

  private static dayOfWeekFromDate(
    date: Date,
  ): DayOfWeek {
    const days: DayOfWeek[] = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];

    const day = days[date.getUTCDay()];

    if (!day) {
      throw new Error(
        'AVAILABILITY_INVALID_DATE',
      );
    }

    return day;
  }

  private static formatTime(date: Date): string {
    return date.toISOString().slice(11, 16);
  }

  private static isSameUtcDay(a: Date, b: Date): boolean {
    return (
      a.toISOString().slice(0, 10) ===
      b.toISOString().slice(0, 10)
    );
  }

  private static timeOnDate(
    date: Date,
    time: string,
  ): Date {
    return new Date(
      `${date.toISOString().slice(0, 10)}T${time}:00.000Z`,
    );
  }
}