import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  getResource,
  getResourceAvailability,
  listResources,
  toResourceSummary,
} from '../src/lib/resources';

const apiResource = {
  id: 'demo-resource-1',
  name: 'Sala Mediterránea',
  description: 'Sala para reuniones y talleres.',
  capacity: 8,
  status: 'ACTIVE',
  createdAt: '2026-08-28T10:00:00.000Z',
};

function stubFetch(options: {
  ok: boolean;
  status: number;
  body?: unknown;
}) {
  const fetchMock = vi.fn(async () => ({
    ok: options.ok,
    status: options.status,
    json: async () => options.body,
  }));

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

describe('toResourceSummary', () => {
  it('maps the API fields to the view model', () => {
    expect(toResourceSummary(apiResource)).toEqual({
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
    stubFetch({
      ok: true,
      status: 200,
      body: { data: [apiResource] },
    });

    const resources = await listResources();

    expect(resources).toHaveLength(1);
    expect(resources[0].name).toBe('Sala Mediterránea');
  });

  it('throws when the API responds with an error', async () => {
    stubFetch({ ok: false, status: 503 });

    await expect(listResources()).rejects.toThrow(
      'Resources request failed with status 503',
    );
  });
});

describe('getResource', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the resource of the API', async () => {
    stubFetch({
      ok: true,
      status: 200,
      body: { data: apiResource },
    });

    const resource = await getResource('demo-resource-1');

    expect(resource).toEqual({
      id: 'demo-resource-1',
      name: 'Sala Mediterránea',
      description: 'Sala para reuniones y talleres.',
      capacity: 8,
    });
  });

  it('returns null when the resource does not exist', async () => {
    stubFetch({ ok: false, status: 404 });

    const resource = await getResource('recurso-inexistente');

    expect(resource).toBeNull();
  });

  it('throws when the API responds with an error', async () => {
    stubFetch({ ok: false, status: 503 });

    await expect(
      getResource('demo-resource-1'),
    ).rejects.toThrow(
      'Resource request failed with status 503',
    );
  });
});

describe('getResourceAvailability', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the availability of the requested date', async () => {
    const fetchMock = stubFetch({
      ok: true,
      status: 200,
      body: {
        data: {
          resourceId: 'demo-resource-1',
          date: '2026-08-31',
          businessHours: [
            {
              day: 'MONDAY',
              opensAt: '08:00',
              closesAt: '20:00',
            },
          ],
          availableSlots: [
            {
              startsAt: '2026-08-31T08:00:00.000Z',
              endsAt: '2026-08-31T09:00:00.000Z',
            },
          ],
        },
      },
    });

    const availability = await getResourceAvailability(
      'demo-resource-1',
      '2026-08-31',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/resources/demo-resource-1/availability?date=2026-08-31',
      { cache: 'no-store' },
    );
    expect(availability.date).toBe('2026-08-31');
    expect(availability.businessHours[0].day).toBe(
      'MONDAY',
    );
    expect(availability.availableSlots).toHaveLength(1);
  });

  it('requests the default date when none is given', async () => {
    const fetchMock = stubFetch({
      ok: true,
      status: 200,
      body: {
        data: {
          resourceId: 'demo-resource-1',
          date: '2026-08-31',
          businessHours: [],
          availableSlots: [],
        },
      },
    });

    await getResourceAvailability('demo-resource-1');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/resources/demo-resource-1/availability',
      { cache: 'no-store' },
    );
  });

  it('throws when the API responds with an error', async () => {
    stubFetch({ ok: false, status: 503 });

    await expect(
      getResourceAvailability('demo-resource-1'),
    ).rejects.toThrow(
      'Availability request failed with status 503',
    );
  });
});