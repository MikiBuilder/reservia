import { describe, expect, it } from 'vitest';

import {
  addDays,
  dayLabel,
  formatSlotRange,
} from '../src/lib/schedule';

describe('dayLabel', () => {
  it('returns the Spanish label of the day', () => {
    expect(dayLabel('MONDAY')).toBe('Lunes');
    expect(dayLabel('SUNDAY')).toBe('Domingo');
  });

  it('returns the raw value for unknown days', () => {
    expect(dayLabel('FUNDAY')).toBe('FUNDAY');
  });
});

describe('formatSlotRange', () => {
  it('formats a slot as HH:mm-HH:mm', () => {
    expect(
      formatSlotRange({
        startsAt: '2026-08-31T08:00:00.000Z',
        endsAt: '2026-08-31T09:00:00.000Z',
      }),
    ).toBe('08:00-09:00');
  });
});

describe('addDays', () => {
  it('moves the date forward and backward', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(addDays('2026-08-31', -1)).toBe('2026-08-30');
  });

  it('crosses month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
});