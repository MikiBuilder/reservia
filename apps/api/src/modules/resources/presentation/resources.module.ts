import { Module } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service.js';

import { BlackoutRepository } from '../../availability/application/blackout-repository.js';
import { BusinessHoursRepository } from '../../availability/application/business-hours-repository.js';

import { AvailabilityService } from '../../availability/domain/availability-service.js';

import { PrismaBlackoutRepository } from '../../availability/infrastructure/prisma-blackout-repository.js';
import { PrismaBusinessHoursRepository } from '../../availability/infrastructure/prisma-business-hours-repository.js';

import { BookingRepository } from '../../bookings/application/booking-repository.js';

import { BookingConflictPolicy } from '../../bookings/domain/booking-conflict.js';

import { PrismaBookingRepository } from '../../bookings/infrastructure/prisma-booking-repository.js';

import { GetResource } from '../application/get-resource.js';
import { GetResourceAvailability } from '../application/get-resource-availability.js';
import { ListResources } from '../application/list-resources.js';
import { ResourceRepository } from '../application/resource-repository.js';

import { PrismaResourceRepository } from '../infrastructure/prisma-resource-repository.js';

import { ResourcesController } from './resources.controller.js';

@Module({
  controllers: [ResourcesController],
  providers: [
    PrismaService,

    ListResources,
    GetResource,
    GetResourceAvailability,

    AvailabilityService,
    BookingConflictPolicy,

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
  ],
})
export class ResourcesModule {}