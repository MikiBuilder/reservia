export class Email {
  private constructor(readonly value: string) {}

  static create(rawEmail: string): Email {
    const normalized = rawEmail.trim().toLowerCase();

    if (!Email.isWellFormed(normalized)) {
      throw new Error('EMAIL_INVALID');
    }

    return new Email(normalized);
  }

  private static isWellFormed(email: string): boolean {
    if (email.length === 0 || email.length > 254) {
      return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}