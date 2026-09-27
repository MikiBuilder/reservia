import {
  Inject,
  Injectable,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service.js';
import { TransactionManager } from '../../../shared/application/transaction-manager.js';
import { PrismaTransactionContext } from './prisma-transaction-context.js';

@Injectable()
export class PrismaTransactionManager
  implements TransactionManager<PrismaTransactionContext>
{
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaClient,
  ) {}

  async run<T>(
    work: (
      context?: PrismaTransactionContext,
    ) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(
      async (client) => {
        const context =
          new PrismaTransactionContext(client);

        return work(context);
      },
    );
  }
}