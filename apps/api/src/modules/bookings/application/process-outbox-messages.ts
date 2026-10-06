import {
  OutboxEventProcessor,
} from './outbox-event-processor.js';

import {
  OutboxRepository,
} from './outbox-repository.js';

export class ProcessOutboxMessages {
  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly eventProcessor: OutboxEventProcessor,
  ) {}

  async execute(limit = 50): Promise<{
    processed: number;
    failed: number;
  }> {
    const messages =
      await this.outboxRepository.findPending(
        limit,
      );

    let processed = 0;
    let failed = 0;

    for (const message of messages) {
      try {
        await this.eventProcessor.process(message);

        await this.outboxRepository.markProcessed(
          message.id,
        );

        processed += 1;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'UNKNOWN_OUTBOX_ERROR';

        await this.outboxRepository.markFailed(
          message.id,
          errorMessage,
        );

        failed += 1;
      }
    }

    return {
      processed,
      failed,
    };
  }
}