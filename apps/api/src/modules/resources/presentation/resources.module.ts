import { Module } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import { ListResources } from '../application/list-resources.js';
import { ResourceRepository } from '../application/resource-repository.js';
import { PrismaResourceRepository } from '../infrastructure/prisma-resource-repository.js';
import { ResourcesController } from './resources.controller.js';

@Module({
  controllers: [ResourcesController],
  providers: [
    PrismaService,
    ListResources,
    {
      provide: 'ResourceRepository',
      useFactory: (
        prisma: PrismaService,
      ): ResourceRepository =>
        new PrismaResourceRepository(prisma),
      inject: [PrismaService],
    },
  ],
})
export class ResourcesModule {}