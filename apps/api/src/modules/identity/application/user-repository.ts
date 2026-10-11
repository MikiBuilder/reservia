import { Email } from '../domain/email.js';
import { User } from '../domain/user.js';

export interface UserRepository {
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
}