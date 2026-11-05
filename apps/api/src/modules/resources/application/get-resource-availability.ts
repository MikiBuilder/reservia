import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { BlackoutRepository } from '../../availability/application/blackout-repository.js';
import { BusinessHoursRepository } from '../../availability/application/business-hours-repository.js';
import { AvailabilityService } from '../../availability/domain/availability-service.js';
import { DayOfWeek } from '../../availability/domain/day-of-week.js';

import { BookingRepository } from '../../bookings/application/booking-repository.js';

import { ResourceRepository } from './resource-repository.js';

export interface DailyBusinessHours {
  day: DayOfWeek;
  opensAt: string;
  closesAt: string;
}

export interface AvailableSlot {
  startsAt: Date;
  endsAt: Date;
}

export interface ResourceAvailability {
  resourceId: string;
  date: string;
  businessHours: DailyBusinessHours[];
  availableSlots: AvailableSlot[];
}

@Injectable()
export class GetResourceAvailability {
  constructor(
    @Inject('ResourceRepository')
    private readonly resourceRepository: ResourceRepository,

    @Inject('BusinessHoursRepository')
    private readonly businessHoursRepository: BusinessHoursRepository,

    @Inject('BlackoutRepository')
    private readonly blackoutRepository: BlackoutRepository,

    @Inject('BookingRepository')
    private readonly bookingRepository: BookingRepository,

    @Inject(AvailabilityService)
    private readonly availabilityService: AvailabilityService,
  ) {}

  async execute(params: {
    resourceId: string;
    date?: string | undefined;
  }): Promise<ResourceAvailability> {
    const { date, iso } =
      GetResourceAvailability.parseDate(params.date);

    const resource =
      await this.resourceRepository.findById(
        params.resourceId,
      );

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    const businessHours =
      await this.businessHoursRepository.findByResourceId(
        params.resourceId,
      );

    const blackouts =
      await this.blackoutRepository.findByResourceId(
        params.resourceId,
      );

    const existingBookings =
      await this.bookingRepository.findActiveByResourceId(
        params.resourceId,
      );

    if (!businessHours) {
      return {
        resourceId: resource.id,
        date: iso,
        businessHours: [],
        availableSlots: [],
      };
    }

    const weeklyHours: DailyBusinessHours[] = [];

    for (const day of Object.values(DayOfWeek)) {
      const schedule = businessHours.getScheduleFor(day);

      if (schedule) {
        weeklyHours.push({
          day,
          opensAt: schedule.opensAt,
          closesAt: schedule.closesAt,
        });
      }
    }

    const availableSlots =
      this.availabilityService
        .findAvailableSlots({
          resource,
          businessHours,
          blackouts,
          existingBookings,
          date,
        })
        .map((slot) => ({
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
        }));

    return {
      resourceId: resource.id,
      date: iso,
      businessHours: weeklyHours,
      availableSlots,
    };
  }

  private static parseDate(value?: string): {
    date: Date;
    iso: string;
  } {
    const iso =
      value ?? new Date().toISOString().slice(0, 10);

    const date = new Date(`${iso}T00:00:00.000Z`);

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(iso) ||
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== iso
    ) {
      throw new BadRequestException(
        'Invalid date, expected format YYYY-MM-DD',
      );
    }

    return { date, iso };
  }
}