import { PrismaClient } from '@prisma/client';
import { ResourceRepository } from '../application/resource-repository.js';
import { Resource } from '../domain/resource.js';

export class PrismaResourceRepository
  implements ResourceRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async findAllActive(): Promise<Resource[]> {
    const resources = await this.prisma.resource.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        name: 'asc',
      },
    });

    return resources.map((resource) =>
      Resource.rehydrate({
        id: resource.id,
        name: resource.name,
        description: resource.description,
        capacity: resource.capacity,
        status: resource.status,
        createdAt: resource.createdAt,
      }),
    );
  }

  async findById(id: string): Promise<Resource | null> {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      return null;
    }

    return Resource.rehydrate({
      id: resource.id,
      name: resource.name,
      description: resource.description,
      capacity: resource.capacity,
      status: resource.status,
      createdAt: resource.createdAt,
    });
  }
}