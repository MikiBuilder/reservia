import { TransactionManager } from '../src/shared/application/transaction-manager.js';

export class InMemoryTransactionManager
  implements TransactionManager
{
  async run<T>(
    work: () => Promise<T>,
  ): Promise<T> {
    return work();
  }
}