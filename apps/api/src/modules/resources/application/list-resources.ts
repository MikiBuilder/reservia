import { Inject, Injectable } from '@nestjs/common';
import { ResourceRepository } from './resource-repository.js';

@Injectable()
export class ListResources {
  constructor(
    @Inject('ResourceRepository')
    private readonly resourceRepository: ResourceRepository,
  ) {}

  async execute() {
    return this.resourceRepository.findAllActive();
  }
}