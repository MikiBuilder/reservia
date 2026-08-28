import { AvailabilityService } from '../../availability/domain/availability-service.js';
import { BlackoutPeriod } from '../../availability/domain/blackout-period.js';
import { BusinessHours } from '../../availability/domain/business-hours.js';
import { Booking } from '../domain/booking.js';
import { TimeRange } from '../domain/time-range.js';
import { BookingRepository } from './booking-repository.js';
import { Resource } from '../../resources/domain/resource.js';

export class CreateBooking {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly availabilityService: AvailabilityService,
  ) {}

  async execute(params: {
    id: string;
    customerId: string;
    resource: Resource;
    businessHours: BusinessHours;
    period: TimeRange;
    blackouts: BlackoutPeriod[];
  }): Promise<Booking> {
    const existingBookings =
      await this.bookingRepository.findActiveByResourceId(
        params.resource.id,
      );

    const canBeBooked = this.availabilityService.canBeBooked({
      resource: params.resource,
      businessHours: params.businessHours,
      period: params.period,
      blackouts: params.blackouts,
      existingBookings,
    });

    if (!canBeBooked) {
      throw new Error('RESOURCE_NOT_AVAILABLE');
    }

    const booking = Booking.create({
      id: params.id,
      resourceId: params.resource.id,
      customerId: params.customerId,
      period: params.period,
    });

    booking.confirm();

    await this.bookingRepository.save(booking);

    return booking;
  }
}