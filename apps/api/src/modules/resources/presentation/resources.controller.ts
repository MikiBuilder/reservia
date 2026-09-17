import { Controller, Get } from '@nestjs/common';
import { ListResources } from '../application/list-resources.js';

@Controller('resources')
export class ResourcesController {
  constructor(
    private readonly listResources: ListResources,
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
}