import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ResourceRepository } from './resource-repository.js';

@Injectable()
export class GetResource {
  constructor(
    @Inject('ResourceRepository')
    private readonly resourceRepository: ResourceRepository,
  ) {}

  async execute(id: string) {
    const resource =
      await this.resourceRepository.findById(id);

    if (!resource) {
      throw new NotFoundException(
        'Resource not found',
      );
    }

    return resource;
  }
}