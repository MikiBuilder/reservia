import { IdGenerator } from '../src/shared/application/id-generator.js';

export class InMemoryIdGenerator implements IdGenerator {
  private counter = 0;

  generate(): string {
    this.counter += 1;
    return `generated-id-${String(this.counter)}`;
  }
}