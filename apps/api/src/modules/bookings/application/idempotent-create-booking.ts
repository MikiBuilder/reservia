import { Booking } from '../domain/booking.js';
import { TimeRange } from '../domain/time-range.js';
import { CreateBooking } from './create-booking.js';
import { IdempotencyService } from './idempotency-service.js';
import { IdempotencyRepository } from './idempotency-repository.js';

export type CreateBookingParams = Parameters<
  CreateBooking['execute']
>[0];

type PersistedBookingResponse = {
  id: string;
  resourceId: string;
  customerId: string;
  startsAt: string;
  endsAt: string;
  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'CANCELLED'
    | 'COMPLETED'
    | 'NO_SHOW';
  createdAt: string;
};

export class IdempotentCreateBooking {
  constructor(
    private readonly createBooking: CreateBooking,
    private readonly idempotencyRepository: IdempotencyRepository,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async execute(
    params: CreateBookingParams & {
      idempotencyKey: string;
      requestHash: string;
    },
  ): Promise<Booking> {
    if (!params.idempotencyKey.trim()) {
      throw new Error('IDEMPOTENCY_KEY_REQUIRED');
    }

    if (!params.requestHash.trim()) {
      throw new Error(
        'IDEMPOTENCY_REQUEST_HASH_REQUIRED',
      );
    }

    const existing =
      await this.idempotencyService.findExisting(
        'CreateBooking',
        params.idempotencyKey,
        params.requestHash,
      );

    if (existing) {
      if (existing.status === 'PROCESSING') {
        throw new Error(
          'IDEMPOTENCY_REQUEST_IN_PROGRESS',
        );
      }

      if (existing.status === 'FAILED') {
        throw new Error(
          'IDEMPOTENCY_PREVIOUS_REQUEST_FAILED',
        );
      }

      if (
        existing.status === 'COMPLETED' &&
        existing.responseBody
      ) {
        return this.bookingFromResponse(
          existing.responseBody,
        );
      }
    }

    const idempotencyRecord =
      await this.idempotencyService.start(
        'CreateBooking',
        params.idempotencyKey,
        params.requestHash,
      );

    try {
      const booking = await this.createBooking.execute(
        params,
      );

      await this.idempotencyRepository.markCompleted({
        id: idempotencyRecord.id,
        responseStatus: 201,
        responseBody: this.bookingToResponse(booking),
      });

      return booking;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'UNKNOWN_ERROR';

      await this.idempotencyRepository.markFailed({
        id: idempotencyRecord.id,
        error: message,
      });

      throw error;
    }
  }

  private bookingToResponse(
    booking: Booking,
  ): PersistedBookingResponse {
    return {
      id: booking.id,
      resourceId: booking.resourceId,
      customerId: booking.customerId,
      startsAt: booking.period.startsAt.toISOString(),
      endsAt: booking.period.endsAt.toISOString(),
      status: booking.currentStatus,
      createdAt: booking.createdAt.toISOString(),
    };
  }

  private bookingFromResponse(
    responseBody: unknown,
  ): Booking {
    if (
      typeof responseBody !== 'object' ||
      responseBody === null
    ) {
      throw new Error(
        'IDEMPOTENCY_RESPONSE_INVALID',
      );
    }

    const response = responseBody as Partial<
      PersistedBookingResponse
    >;

    if (
      typeof response.id !== 'string' ||
      typeof response.resourceId !== 'string' ||
      typeof response.customerId !== 'string' ||
      typeof response.startsAt !== 'string' ||
      typeof response.endsAt !== 'string' ||
      typeof response.status !== 'string' ||
      typeof response.createdAt !== 'string'
    ) {
      throw new Error(
        'IDEMPOTENCY_RESPONSE_INVALID',
      );
    }

    const startsAt = new Date(response.startsAt);
    const endsAt = new Date(response.endsAt);
    const createdAt = new Date(response.createdAt);

    if (
      Number.isNaN(startsAt.getTime()) ||
      Number.isNaN(endsAt.getTime()) ||
      Number.isNaN(createdAt.getTime())
    ) {
      throw new Error(
        'IDEMPOTENCY_RESPONSE_INVALID',
      );
    }

    return Booking.rehydrate({
      id: response.id,
      resourceId: response.resourceId,
      customerId: response.customerId,
      period: TimeRange.create(
        startsAt,
        endsAt,
      ),
      status: response.status,
      createdAt,
    });
  }
}