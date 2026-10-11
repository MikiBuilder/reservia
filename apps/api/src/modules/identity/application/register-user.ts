import { IdGenerator } from '../../../shared/application/id-generator.js';

import { Email } from '../domain/email.js';
import { PasswordPolicy } from '../domain/password-policy.js';
import { User } from '../domain/user.js';

import { PasswordHasher } from './password-hasher.js';
import { UserRepository } from './user-repository.js';

export class RegisterUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly passwordPolicy: PasswordPolicy,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(params: {
    email: string;
    password: string;
    name: string;
  }): Promise<User> {
    const email = Email.create(params.email);

    this.passwordPolicy.assertSecure({
      password: params.password,
      email,
    });

    const existingUser =
      await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new Error('EMAIL_ALREADY_REGISTERED');
    }

    const passwordHash = await this.passwordHasher.hash(
      params.password,
    );

    const user = User.create({
      id: this.idGenerator.generate(),
      email,
      passwordHash,
      name: params.name,
    });

    await this.userRepository.save(user);

    return user;
  }
}