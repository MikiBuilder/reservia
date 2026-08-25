import { describe, expect, it } from 'vitest';
import { Resource } from '../src/modules/resources/domain/resource.js';

describe('Resource', () => {
  it('creates an active resource with valid data', () => {
    const resource = Resource.create({
      id: 'resource-1',
      name: 'Sala Mediterránea',
      description: 'Sala luminosa para reuniones',
      capacity: 8,
    });

    expect(resource.currentName).toBe('Sala Mediterránea');
    expect(resource.currentCapacity).toBe(8);
    expect(resource.currentStatus).toBe('ACTIVE');
    expect(resource.canBeBooked()).toBe(true);
  });

  it('rejects an empty name', () => {
    expect(() =>
      Resource.create({
        id: 'resource-1',
        name: ' ',
        capacity: 4,
      }),
    ).toThrow('RESOURCE_NAME_REQUIRED');
  });

  it('rejects invalid capacity', () => {
    expect(() =>
      Resource.create({
        id: 'resource-1',
        name: 'Sala pequeña',
        capacity: 0,
      }),
    ).toThrow('RESOURCE_CAPACITY_INVALID');
  });

  it('can be deactivated and activated', () => {
    const resource = Resource.create({
      id: 'resource-1',
      name: 'Sala Norte',
      capacity: 4,
    });

    resource.deactivate();

    expect(resource.currentStatus).toBe('INACTIVE');
    expect(resource.canBeBooked()).toBe(false);

    resource.activate();

    expect(resource.currentStatus).toBe('ACTIVE');
    expect(resource.canBeBooked()).toBe(true);
  });
});