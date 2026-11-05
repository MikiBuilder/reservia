import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  listResources,
  toResourceSummary,
} from '../src/lib/resources';

describe('toResourceSummary', () => {
  it('maps the API fields to the view model', () => {
    const summary = toResourceSummary({
      id: 'demo-resource-1',
      name: 'Sala Mediterránea',
      description: 'Sala para reuniones y talleres.',
      capacity: 8,
      status: 'ACTIVE',
      createdAt: '2026-08-28T10:00:00.000Z',
    });

    expect(summary).toEqual({
      id: 'demo-resource-1',
      name: 'Sala Mediterránea',
      description: 'Sala para reuniones y talleres.',
      capacity: 8,
    });
  });
});

describe('listResources', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the resources of the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: 'demo-resource-1',
              name: 'Sala Mediterránea',
              description: 'Sala para reuniones.',
              capacity: 8,
              status: 'ACTIVE',
              createdAt: '2026-08-28T10:00:00.000Z',
            },
          ],
        }),
      })),
    );

    const resources = await listResources();

    expect(resources).toHaveLength(1);
    expect(resources[0].name).toBe('Sala Mediterránea');
  });

  it('throws when the API responds with an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 503,
      })),
    );

    await expect(listResources()).rejects.toThrow(
      'Resources request failed with status 503',
    );
  });
});