import { TimeRange } from '../../bookings/domain/time-range.js';
import { BlackoutReason } from './blackout-reason.js';

export class BlackoutPeriod {
  private constructor(
    readonly id: string,
    readonly resourceId: string,
    readonly period: TimeRange,
    readonly reason: BlackoutReason,
    readonly description: string,
    readonly createdAt: Date,
  ) {}

  static create(params: {
    id: string;
    resourceId: string;
    period: TimeRange;
    reason: BlackoutReason;
    description?: string;
    now?: Date;
  }): BlackoutPeriod {
    if (!params.id.trim()) {
      throw new Error('BLACKOUT_ID_REQUIRED');
    }

    if (!params.resourceId.trim()) {
      throw new Error('BLACKOUT_RESOURCE_ID_REQUIRED');
    }

    if (!params.reason) {
      throw new Error('BLACKOUT_REASON_REQUIRED');
    }

    return new BlackoutPeriod(
      params.id,
      params.resourceId,
      params.period,
      params.reason,
      params.description?.trim() ?? '',
      params.now ?? new Date(),
    );
  }

  affects(period: TimeRange): boolean {
    return this.period.overlaps(period);
  }
}