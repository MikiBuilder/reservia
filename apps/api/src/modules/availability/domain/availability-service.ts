import { Booking } from '../../bookings/domain/booking.js';
import { BookingConflictPolicy } from '../../bookings/domain/booking-conflict.js';
import { TimeRange } from '../../bookings/domain/time-range.js';
import { Resource } from '../../resources/domain/resource.js';
import { BusinessHours } from './business-hours.js';
import { BlackoutPeriod } from './blackout-period.js';
import { DayOfWeek } from './day-of-week.js';

export class AvailabilityService {
  constructor(
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

    const day = AvailabilityService.dayOfWeekFromDate(
      params.period.startsAt,
    );

    if (!params.businessHours.isAvailableAt(
      day,
      AvailabilityService.formatTime(params.period.startsAt),
    )) {
      return false;
    }

    if (!params.businessHours.isAvailableAt(
      day,
      AvailabilityService.formatTime(params.period.endsAt),
    )) {
      return false;
    }

    const hasBlackout = params.blackouts.some((blackout) =>
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
      if (error instanceof Error && error.message === 'BOOKING_CONFLICT') {
        return false;
      }

      throw error;
    }
  }

private static dayOfWeekFromDate(date: Date): DayOfWeek {
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
    throw new Error('AVAILABILITY_INVALID_DATE');
  }

  return day;
}

  private static formatTime(date: Date): string {
    return date.toISOString().slice(11, 16);
  }
}