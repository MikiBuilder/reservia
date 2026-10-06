import { PendingOutboxMessage } from './outbox-repository.js';

export interface OutboxEventProcessor {
  process(
    message: PendingOutboxMessage,
  ): Promise<void>;
}