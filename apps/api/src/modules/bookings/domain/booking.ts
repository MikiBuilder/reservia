import { TimeRange } from './time-range.js';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

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
    if (!params.id.trim()) {
      throw new Error('BOOKING_ID_REQUIRED');
    }

    if (!params.resourceId.trim()) {
      throw new Error('BOOKING_RESOURCE_ID_REQUIRED');
    }

    if (!params.customerId.trim()) {
      throw new Error('BOOKING_CUSTOMER_ID_REQUIRED');
    }

    return new Booking(
      params.id,
      params.resourceId,
      params.customerId,
      params.period,
      'PENDING',
      params.now ?? new Date(),
    );
  }

  static rehydrate(params: {
    id: string;
    resourceId: string;
    customerId: string;
    period: TimeRange;
    status: BookingStatus;
    createdAt: Date;
  }): Booking {
    if (!params.id.trim()) {
      throw new Error('BOOKING_ID_REQUIRED');
    }

    if (!params.resourceId.trim()) {
      throw new Error('BOOKING_RESOURCE_ID_REQUIRED');
    }

    if (!params.customerId.trim()) {
      throw new Error('BOOKING_CUSTOMER_ID_REQUIRED');
    }

    return new Booking(
      params.id,
      params.resourceId,
      params.customerId,
      params.period,
      params.status,
      params.createdAt,
    );
  }

  confirm(): void {
    if (this.status !== 'PENDING') {
      throw new Error('BOOKING_CANNOT_CONFIRM');
    }

    this.status = 'CONFIRMED';
  }

  cancel(): void {
    if (!['PENDING', 'CONFIRMED'].includes(this.status)) {
      throw new Error('BOOKING_CANNOT_CANCEL');
    }

    this.status = 'CANCELLED';
  }

  complete(): void {
    if (this.status !== 'CONFIRMED') {
      throw new Error('BOOKING_CANNOT_COMPLETE');
    }

    this.status = 'COMPLETED';
  }

  markAsNoShow(): void {
    if (this.status !== 'CONFIRMED') {
      throw new Error('BOOKING_CANNOT_MARK_AS_NO_SHOW');
    }

    this.status = 'NO_SHOW';
  }

  get currentStatus(): BookingStatus {
    return this.status;
  }

  isActive(): boolean {
    return (
      this.status === 'PENDING' ||
      this.status === 'CONFIRMED'
    );
  }
}