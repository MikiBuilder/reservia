export class DailySchedule {
  private constructor(
    readonly opensAt: string,
    readonly closesAt: string,
  ) {}

  static create(opensAt: string, closesAt: string): DailySchedule {
    if (!DailySchedule.isValidTime(opensAt)) {
      throw new Error('SCHEDULE_INVALID_OPENING_TIME');
    }

    if (!DailySchedule.isValidTime(closesAt)) {
      throw new Error('SCHEDULE_INVALID_CLOSING_TIME');
    }

    if (opensAt >= closesAt) {
      throw new Error('SCHEDULE_INVALID_TIME_ORDER');
    }

    return new DailySchedule(opensAt, closesAt);
  }

  durationInMinutes(): number {
  return (
    DailySchedule.toMinutes(this.closesAt) -
    DailySchedule.toMinutes(this.opensAt)
  );
}

  containsTime(time: string): boolean {
    if (!DailySchedule.isValidTime(time)) {
      throw new Error('SCHEDULE_INVALID_TIME');
    }

    return this.opensAt <= time && time < this.closesAt;
  }

  private static isValidTime(value: string): boolean {
    return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
  }
private static toMinutes(value: string): number {
  const [hours, minutes] = value.split(':');

  return Number(hours) * 60 + Number(minutes);
}
}