export class TimeRange {
  private constructor(
    readonly startsAt: Date,
    readonly endsAt: Date,
  ) {}

  static create(startsAt: Date, endsAt: Date): TimeRange {
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new Error('TIME_RANGE_INVALID_DATE');
    }
    if (startsAt >= endsAt) throw new Error('TIME_RANGE_INVALID_ORDER');
    return new TimeRange(new Date(startsAt), new Date(endsAt));
  }

  durationInMinutes(): number {
    return (this.endsAt.getTime() - this.startsAt.getTime()) / 60_000;
  }

  overlaps(other: TimeRange): boolean {
    return this.startsAt < other.endsAt && other.startsAt < this.endsAt;
  }
}
