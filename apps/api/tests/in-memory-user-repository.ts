import { UserRepository } from '../src/modules/identity/application/user-repository.js';
import { Email } from '../src/modules/identity/domain/email.js';
import { User } from '../src/modules/identity/domain/user.js';

export class InMemoryUserRepository implements UserRepository {
  readonly users: User[] = [];

  async findByEmail(email: Email): Promise<User | null> {
    return (
      this.users.find((user) => user.email.equals(email)) ?? null
    );
  }

  async save(user: User): Promise<void> {
    const alreadyRegistered = await this.findByEmail(user.email);

    if (alreadyRegistered) {
      throw new Error('EMAIL_ALREADY_REGISTERED');
    }

    this.users.push(user);
  }
}