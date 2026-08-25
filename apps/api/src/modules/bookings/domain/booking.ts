import { TimeRange } from './time-range.js';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export class Booking {
  private constructor(
    readonly id: string,
    readonly resourceId: string,
    readonly customerId: string,
    readonly period: TimeRange,
    private status: BookingStatus,
    readonly createdAt: Date,
  ) {}

  static create(params: {
    id: string;
    resourceId: string;
    customerId: string;
    period: TimeRange;
    now?: Date;
  }): Booking {
    if (!params.id || !params.resourceId || !params.customerId) {
      throw new Error('BOOKING_REQUIRED_FIELDS');
    }
    return new Booking(params.id, params.resourceId, params.customerId, params.period, 'PENDING', params.now ?? new Date());
  }

  confirm(): void {
    if (this.status !== 'PENDING') throw new Error('BOOKING_CANNOT_CONFIRM');
    this.status = 'CONFIRMED';
  }

  cancel(): void {
    if (!['PENDING', 'CONFIRMED'].includes(this.status)) throw new Error('BOOKING_CANNOT_CANCEL');
    this.status = 'CANCELLED';
  }

  complete(): void {
    if (this.status !== 'CONFIRMED') throw new Error('BOOKING_CANNOT_COMPLETE');
    this.status = 'COMPLETED';
  }

  get currentStatus(): BookingStatus { return this.status; }
  isActive(): boolean { return this.status === 'PENDING' || this.status === 'CONFIRMED'; }
}
