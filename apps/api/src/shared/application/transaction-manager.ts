export interface TransactionManager<TContext = unknown> {
  run<T>(
    work: (context?: TContext) => Promise<T>,
  ): Promise<T>;
}