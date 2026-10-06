import {
  IdempotencyRepository,
} from './idempotency-repository.js';

export class CleanupExpiredIdempotency {
  constructor(
    private readonly repository: IdempotencyRepository,
  ) {}

  async execute(
    now = new Date(),
    limit = 100,
  ): Promise<{ deleted: number }> {
    const deleted =
      await this.repository.deleteExpired(
        now,
        limit,
      );

    return {
      deleted,
    };
  }
}