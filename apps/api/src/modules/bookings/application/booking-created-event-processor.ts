import {
  OutboxEventProcessor,
} from './outbox-event-processor.js';

import {
  PendingOutboxMessage,
} from './outbox-repository.js';

export class BookingCreatedEventProcessor
  implements OutboxEventProcessor
{
  async process(
    message: PendingOutboxMessage,
  ): Promise<void> {
    if (message.eventType !== 'BookingCreated') {
      throw new Error(
        'OUTBOX_EVENT_TYPE_NOT_SUPPORTED',
      );
    }

    if (
      typeof message.payload !== 'object' ||
      message.payload === null
    ) {
      throw new Error(
        'OUTBOX_EVENT_PAYLOAD_INVALID',
      );
    }

    // Primera implementación deliberadamente
    // sencilla. Más adelante aquí se enviarán
    // notificaciones y se actualizarán métricas.
  }
}