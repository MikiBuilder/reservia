import {
  Body,
  ConflictException,
  Controller,
  Headers,
  Inject,
  NotFoundException,
  Post,
} from '@nestjs/common';

import {
  ApiHeader,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { createHash } from 'node:crypto';

import { BusinessHoursRepository } from '../../availability/application/business-hours-repository.js';
import { BlackoutRepository } from '../../availability/application/blackout-repository.js';
import { ResourceRepository } from '../../resources/application/resource-repository.js';

import { IdempotentCreateBooking } from '../application/idempotent-create-booking.js';
import { TimeRange } from '../domain/time-range.js';

import { CreateBookingDto } from './create-booking.dto.js';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly createBooking: IdempotentCreateBooking,

    @Inject('ResourceRepository')
    private readonly resourceRepository: ResourceRepository,

    @Inject('BusinessHoursRepository')
    private readonly businessHoursRepository: BusinessHoursRepository,

    @Inject('BlackoutRepository')
    private readonly blackoutRepository: BlackoutRepository,
  ) {}

  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      'Clave única para evitar reservas duplicadas.',
  })
  @ApiResponse({
    status: 201,
    description: 'Reserva creada correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos.',
  })
  @ApiResponse({
    status: 404,
    description: 'Recurso no encontrado.',
  })
  @ApiResponse({
    status: 409,
    description:
      'Recurso no disponible o clave de idempotencia reutilizada.',
  })
  @Post()
  async create(
    @Body() body: CreateBookingDto,
    @Headers('idempotency-key')
    idempotencyKey?: string,
  ) {
    if (!idempotencyKey?.trim()) {
      throw new ConflictException(
        'The Idempotency-Key header is required',
      );
    }

    const resource =
      await this.resourceRepository.findById(
        body.resourceId,
      );

    if (!resource) {
      throw new NotFoundException(
        'Resource not found',
      );
    }

    const businessHours =
      await this.businessHoursRepository.findByResourceId(
        body.resourceId,
      );

    if (!businessHours) {
      throw new ConflictException(
        'Business hours not configured',
      );
    }

    const blackouts =
      await this.blackoutRepository.findByResourceId(
        body.resourceId,
      );

    const period = TimeRange.create(
      new Date(body.startsAt),
      new Date(body.endsAt),
    );

    const requestHash = createHash('sha256')
      .update(
        JSON.stringify({
          resourceId: body.resourceId,
          customerId: body.customerId,
          startsAt: body.startsAt,
          endsAt: body.endsAt,
        }),
      )
      .digest('hex');

    try {
      const booking =
        await this.createBooking.execute({
          id: body.id,
          resource,
          customerId: body.customerId,
          businessHours,
          period,
          blackouts,
          idempotencyKey,
          requestHash,
        });

      return {
        data: {
          id: booking.id,
          resourceId: booking.resourceId,
          customerId: booking.customerId,
          startsAt: booking.period.startsAt,
          endsAt: booking.period.endsAt,
          status: booking.currentStatus,
          createdAt: booking.createdAt,
        },
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'RESOURCE_NOT_AVAILABLE'
      ) {
        throw new ConflictException(
          'Resource is not available',
        );
      }

      if (
        error instanceof Error &&
        error.message === 'IDEMPOTENCY_KEY_REUSED'
      ) {
        throw new ConflictException(
          'Idempotency key was already used with different data',
        );
      }

      if (
        error instanceof Error &&
        error.message === 'IDEMPOTENCY_REQUEST_IN_PROGRESS'
      ) {
        throw new ConflictException(
          'An identical request is already being processed',
        );
      }

      if (
        error instanceof Error &&
        error.message === 'IDEMPOTENCY_PREVIOUS_REQUEST_FAILED'
      ) {
        throw new ConflictException(
          'The previous request with this key failed',
        );
      }

      throw error;
    }
  }
}