import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { GetResource } from '../application/get-resource.js';
import { ListResources } from '../application/list-resources.js';

@ApiTags('resources')
@Controller('resources')
export class ResourcesController {
  constructor(
    private readonly listResources: ListResources,
    private readonly getResource: GetResource,
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
}