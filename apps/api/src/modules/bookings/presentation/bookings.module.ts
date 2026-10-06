import { Module } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service.js';

import { AvailabilityService } from '../../availability/domain/availability-service.js';
import { BusinessHoursRepository } from '../../availability/application/business-hours-repository.js';
import { BlackoutRepository } from '../../availability/application/blackout-repository.js';
import { PrismaBusinessHoursRepository } from '../../availability/infrastructure/prisma-business-hours-repository.js';
import { PrismaBlackoutRepository } from '../../availability/infrastructure/prisma-blackout-repository.js';

import { ResourceRepository } from '../../resources/application/resource-repository.js';
import { PrismaResourceRepository } from '../../resources/infrastructure/prisma-resource-repository.js';

import { BookingConflictPolicy } from '../domain/booking-conflict.js';
import { BookingRepository } from '../application/booking-repository.js';
import { CreateBooking } from '../application/create-booking.js';
import { IdempotentCreateBooking } from '../application/idempotent-create-booking.js';
import { IdempotencyRepository } from '../application/idempotency-repository.js';
import { IdempotencyService } from '../application/idempotency-service.js';
import { OutboxRepository } from '../application/outbox-repository.js';

import { PrismaBookingRepository } from '../infrastructure/prisma-booking-repository.js';
import { PrismaIdempotencyRepository } from '../infrastructure/prisma-idempotency-repository.js';
import { PrismaOutboxRepository } from '../infrastructure/prisma-outbox-repository.js';
import { PrismaTransactionManager } from '../infrastructure/prisma-transaction-manager.js';

import { BookingsController } from './bookings.controller.js';

import { BookingCreatedEventProcessor } from '../application/booking-created-event-processor.js';
import { ProcessOutboxMessages } from '../application/process-outbox-messages.js';

@Module({
  controllers: [BookingsController],
  providers: [
    PrismaService,

    AvailabilityService,
    BookingConflictPolicy,
    PrismaTransactionManager,

    {
      provide: 'ResourceRepository',
      useFactory: (
        prisma: PrismaService,
      ): ResourceRepository =>
        new PrismaResourceRepository(prisma),
      inject: [PrismaService],
    },

    {
      provide: 'BusinessHoursRepository',
      useFactory: (
        prisma: PrismaService,
      ): BusinessHoursRepository =>
        new PrismaBusinessHoursRepository(prisma),
      inject: [PrismaService],
    },

    {
      provide: 'BlackoutRepository',
      useFactory: (
        prisma: PrismaService,
      ): BlackoutRepository =>
        new PrismaBlackoutRepository(prisma),
      inject: [PrismaService],
    },

    {
      provide: 'BookingRepository',
      useFactory: (
        prisma: PrismaService,
      ): BookingRepository =>
        new PrismaBookingRepository(prisma),
      inject: [PrismaService],
    },

    {
      provide: 'OutboxRepository',
      useFactory: (
        prisma: PrismaService,
      ): OutboxRepository =>
        new PrismaOutboxRepository(prisma),
      inject: [PrismaService],
    },

    {
      provide: 'IdempotencyRepository',
      useFactory: (
        prisma: PrismaService,
      ): IdempotencyRepository =>
        new PrismaIdempotencyRepository(prisma),
      inject: [PrismaService],
    },

    {
      provide: CreateBooking,
      useFactory: (
        bookingRepository: BookingRepository,
        outboxRepository: OutboxRepository,
        transactionManager: PrismaTransactionManager,
        availabilityService: AvailabilityService,
      ) =>
        new CreateBooking(
          bookingRepository,
          outboxRepository,
          transactionManager,
          availabilityService,
        ),
      inject: [
        'BookingRepository',
        'OutboxRepository',
        PrismaTransactionManager,
        AvailabilityService,
      ],
    },

    {
      provide: 'IdempotentCreateBooking',
      useFactory: (
        createBooking: CreateBooking,
        idempotencyRepository: IdempotencyRepository,
      ) =>
        new IdempotentCreateBooking(
          createBooking,
          idempotencyRepository,
          new IdempotencyService(
            idempotencyRepository,
          ),
        ),
      inject: [
        CreateBooking,
        'IdempotencyRepository',
      ],
    },

BookingCreatedEventProcessor,

{
  provide: ProcessOutboxMessages,
  useFactory: (
    outboxRepository: OutboxRepository,
    eventProcessor: BookingCreatedEventProcessor,
  ) =>
    new ProcessOutboxMessages(
      outboxRepository,
      eventProcessor,
    ),
  inject: [
    'OutboxRepository',
    BookingCreatedEventProcessor,
  ],
},

  ],
})
export class BookingsModule {}