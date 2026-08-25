export type ResourceStatus = 'ACTIVE' | 'INACTIVE';

export class Resource {
  private constructor(
    readonly id: string,
    private name: string,
    private description: string,
    private capacity: number,
    private status: ResourceStatus,
    readonly createdAt: Date,
  ) {}

  static create(params: {
    id: string;
    name: string;
    description?: string;
    capacity: number;
    now?: Date;
  }): Resource {
    if (!params.id.trim()) {
      throw new Error('RESOURCE_ID_REQUIRED');
    }

    if (!params.name.trim()) {
      throw new Error('RESOURCE_NAME_REQUIRED');
    }

    if (params.capacity <= 0) {
      throw new Error('RESOURCE_CAPACITY_INVALID');
    }

    return new Resource(
      params.id,
      params.name.trim(),
      params.description?.trim() ?? '',
      params.capacity,
      'ACTIVE',
      params.now ?? new Date(),
    );
  }

  activate(): void {
    this.status = 'ACTIVE';
  }

  deactivate(): void {
    this.status = 'INACTIVE';
  }

  get currentName(): string {
    return this.name;
  }

  get currentDescription(): string {
    return this.description;
  }

  get currentCapacity(): number {
    return this.capacity;
  }

  get currentStatus(): ResourceStatus {
    return this.status;
  }

  canBeBooked(): boolean {
    return this.status === 'ACTIVE';
  }
}