import { AvailabilityService } from '../../availability/domain/availability-service.js';
import { BlackoutPeriod } from '../../availability/domain/blackout-period.js';
import { BusinessHours } from '../../availability/domain/business-hours.js';
import { Resource } from '../../resources/domain/resource.js';
import { Booking } from '../domain/booking.js';
import { TimeRange } from '../domain/time-range.js';
import { BookingCreatedEvent, bookingCreatedEventFrom } from './booking-events.js';
import { BookingRepository } from './booking-repository.js';
import { OutboxRepository } from './outbox-repository.js';
import { TransactionManager } from '../../../shared/application/transaction-manager.js';

export class CreateBooking {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly outboxRepository: OutboxRepository,
    private readonly transactionManager: TransactionManager,
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
    return this.transactionManager.run(async () => {
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

      const event: BookingCreatedEvent =
        bookingCreatedEventFrom(booking);

      await this.outboxRepository.saveBookingCreated(event);

      return booking;
    });
  }
}