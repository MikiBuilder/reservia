import { DailySchedule } from './daily-schedule.js';
import { DayOfWeek } from './day-of-week.js';

export type WeeklySchedule = Partial<
  Record<DayOfWeek, DailySchedule>
>;

export class BusinessHours {
  private constructor(
    private readonly weeklySchedule: WeeklySchedule,
  ) {}

  static create(schedule: WeeklySchedule): BusinessHours {
    return new BusinessHours({ ...schedule });
  }

  isOpen(day: DayOfWeek): boolean {
    return this.weeklySchedule[day] !== undefined;
  }

  getScheduleFor(day: DayOfWeek): DailySchedule | undefined {
    return this.weeklySchedule[day];
  }

  isAvailableAt(day: DayOfWeek, time: string): boolean {
    const schedule = this.weeklySchedule[day];

    if (!schedule) {
      return false;
    }

    return schedule.containsTime(time);
  }
}