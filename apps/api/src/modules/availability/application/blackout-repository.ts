import { BlackoutPeriod } from '../domain/blackout-period.js';

export interface BlackoutRepository {
  findByResourceId(
    resourceId: string,
  ): Promise<BlackoutPeriod[]>;
}