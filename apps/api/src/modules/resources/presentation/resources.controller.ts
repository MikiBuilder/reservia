import {
  Controller,
  Get,
  Inject,
  Param,
  Query,
} from '@nestjs/common';

import { ApiQuery, ApiTags } from '@nestjs/swagger';

import { GetResource } from '../application/get-resource.js';
import { GetResourceAvailability } from '../application/get-resource-availability.js';
import { ListResources } from '../application/list-resources.js';

@ApiTags('resources')
@Controller('resources')
export class ResourcesController {
  constructor(
    @Inject(ListResources)
    private readonly listResources: ListResources,

    @Inject(GetResource)
    private readonly getResource: GetResource,

    @Inject(GetResourceAvailability)
    private readonly getResourceAvailability: GetResourceAvailability,
  ) {}

  @Get()
  async getResources() {
    const resources =
      await this.listResources.execute();

    return {
      data: resources.map((resource) => ({
        id: resource.id,
        name: resource.currentName,
        description: resource.currentDescription,
        capacity: resource.currentCapacity,
        status: resource.currentStatus,
        createdAt: resource.createdAt,
      })),
    };
  }

  @Get(':id')
  async getResourceById(
    @Param('id') id: string,
  ) {
    const resource =
      await this.getResource.execute(id);

    return {
      data: {
        id: resource.id,
        name: resource.currentName,
        description: resource.currentDescription,
        capacity: resource.currentCapacity,
        status: resource.currentStatus,
        createdAt: resource.createdAt,
      },
    };
  }

  @ApiQuery({
    name: 'date',
    required: false,
    description:
      'Fecha en formato YYYY-MM-DD. Por defecto, hoy en UTC.',
  })
  @Get(':id/availability')
  async getResourceAvailabilityById(
    @Param('id') id: string,
    @Query('date') date?: string,
  ) {
    const availability =
      await this.getResourceAvailability.execute({
        resourceId: id,
        date,
      });

    return { data: availability };
  }
}