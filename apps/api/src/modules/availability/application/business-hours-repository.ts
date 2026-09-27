import { BusinessHours } from '../domain/business-hours.js';

export interface BusinessHoursRepository {
  findByResourceId(
    resourceId: string,
  ): Promise<BusinessHours | null>;
}