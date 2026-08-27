import { describe, expect, it } from 'vitest';
import { BlackoutPeriod } from '../src/modules/availability/domain/blackout-period.js';
import { TimeRange } from '../src/modules/bookings/domain/time-range.js';

const period = (from: string, to: string): TimeRange =>
  TimeRange.create(new Date(from), new Date(to));

describe('BlackoutPeriod', () => {
  it('creates a blackout period with valid data', () => {
    const blackout = BlackoutPeriod.create({
      id: 'blackout-1',
      resourceId: 'resource-1',
      period: period(
        '2026-09-01T10:00:00Z',
        '2026-09-01T12:00:00Z',
      ),
      reason: 'MAINTENANCE',
      description: 'Revisión del aire acondicionado',
    });

    expect(blackout.id).toBe('blackout-1');
    expect(blackout.resourceId).toBe('resource-1');
    expect(blackout.reason).toBe('MAINTENANCE');
    expect(blackout.description).toBe(
      'Revisión del aire acondicionado',
    );
  });

  it('detects an affected period', () => {
    const blackout = BlackoutPeriod.create({
      id: 'blackout-1',
      resourceId: 'resource-1',
      period: period(
        '2026-09-01T10:00:00Z',
        '2026-09-01T12:00:00Z',
      ),
      reason: 'PRIVATE_EVENT',
    });

    expect(
      blackout.affects(
        period(
          '2026-09-01T11:00:00Z',
          '2026-09-01T13:00:00Z',
        ),
      ),
    ).toBe(true);
  });

  it('does not affect an adjacent period', () => {
    const blackout = BlackoutPeriod.create({
      id: 'blackout-1',
      resourceId: 'resource-1',
      period: period(
        '2026-09-01T10:00:00Z',
        '2026-09-01T12:00:00Z',
      ),
      reason: 'CLEANING',
    });

    expect(
      blackout.affects(
        period(
          '2026-09-01T12:00:00Z',
          '2026-09-01T13:00:00Z',
        ),
      ),
    ).toBe(false);
  });

  it('rejects a missing resource id', () => {
    expect(() =>
      BlackoutPeriod.create({
        id: 'blackout-1',
        resourceId: ' ',
        period: period(
          '2026-09-01T10:00:00Z',
          '2026-09-01T12:00:00Z',
        ),
        reason: 'HOLIDAY',
      }),
    ).toThrow('BLACKOUT_RESOURCE_ID_REQUIRED');
  });
});