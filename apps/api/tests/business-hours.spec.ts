import { describe, expect, it } from 'vitest';
import { BusinessHours } from '../src/modules/availability/domain/business-hours.js';
import { DailySchedule } from '../src/modules/availability/domain/daily-schedule.js';
import { DayOfWeek } from '../src/modules/availability/domain/day-of-week.js';

describe('DailySchedule', () => {
  it('creates a valid daily schedule', () => {
    const schedule = DailySchedule.create('08:00', '20:00');

    expect(schedule.opensAt).toBe('08:00');
    expect(schedule.closesAt).toBe('20:00');
    expect(schedule.durationInMinutes()).toBe(720);
  });

  it('rejects invalid time order', () => {
    expect(() => DailySchedule.create('20:00', '08:00'))
      .toThrow('SCHEDULE_INVALID_TIME_ORDER');
  });

  it('rejects invalid time format', () => {
    expect(() => DailySchedule.create('8:00', '20:00'))
      .toThrow('SCHEDULE_INVALID_OPENING_TIME');
  });

  it('checks whether a time is inside the schedule', () => {
    const schedule = DailySchedule.create('08:00', '20:00');

    expect(schedule.containsTime('08:00')).toBe(true);
    expect(schedule.containsTime('13:30')).toBe(true);
    expect(schedule.containsTime('20:00')).toBe(false);
  });
});

describe('BusinessHours', () => {
  it('knows which days are open', () => {
    const businessHours = BusinessHours.create({
      [DayOfWeek.MONDAY]: DailySchedule.create('08:00', '20:00'),
      [DayOfWeek.FRIDAY]: DailySchedule.create('08:00', '15:00'),
    });

    expect(businessHours.isOpen(DayOfWeek.MONDAY)).toBe(true);
    expect(businessHours.isOpen(DayOfWeek.SATURDAY)).toBe(false);
  });

  it('checks availability for a specific day and time', () => {
    const businessHours = BusinessHours.create({
      [DayOfWeek.MONDAY]: DailySchedule.create('08:00', '20:00'),
    });

    expect(
      businessHours.isAvailableAt(DayOfWeek.MONDAY, '10:30'),
    ).toBe(true);

    expect(
      businessHours.isAvailableAt(DayOfWeek.MONDAY, '20:00'),
    ).toBe(false);

    expect(
      businessHours.isAvailableAt(DayOfWeek.SUNDAY, '10:30'),
    ).toBe(false);
  });
});