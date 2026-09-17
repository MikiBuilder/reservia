import { Resource } from '../domain/resource.js';

export interface ResourceRepository {
  findAllActive(): Promise<Resource[]>;
  findById(id: string): Promise<Resource | null>;
}