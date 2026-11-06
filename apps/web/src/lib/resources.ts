import { apiUrl } from './api-url';

export interface ResourceSummary {
  id: string;
  name: string;
  description: string;
  capacity: number;
}

interface ApiResource {
  id: string;
  name: string;
  description: string;
  capacity: number;
  status: string;
  createdAt: string;
}

export interface DailyBusinessHours {
  day: string;
  opensAt: string;
  closesAt: string;
}

export interface AvailableSlot {
  startsAt: string;
  endsAt: string;
}

export interface ResourceAvailability {
  resourceId: string;
  date: string;
  businessHours: DailyBusinessHours[];
  availableSlots: AvailableSlot[];
}

export function toResourceSummary(
  resource: ApiResource,
): ResourceSummary {
  return {
    id: resource.id,
    name: resource.name,
    description: resource.description,
    capacity: resource.capacity,
  };
}

export async function listResources(): Promise<
  ResourceSummary[]
> {
  const response = await fetch(apiUrl('/api/resources'), {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `Resources request failed with status ${response.status}`,
    );
  }

  const body = (await response.json()) as {
    data: ApiResource[];
  };

  return body.data.map(toResourceSummary);
}

export async function getResource(
  resourceId: string,
): Promise<ResourceSummary | null> {
  const response = await fetch(
    apiUrl(`/api/resources/${resourceId}`),
    { cache: 'no-store' },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Resource request failed with status ${response.status}`,
    );
  }

  const body = (await response.json()) as {
    data: ApiResource;
  };

  return toResourceSummary(body.data);
}

export async function getResourceAvailability(
  resourceId: string,
  date?: string,
): Promise<ResourceAvailability> {
  const query =
    date === undefined ? '' : `?date=${date}`;

  const response = await fetch(
    apiUrl(
      `/api/resources/${resourceId}/availability${query}`,
    ),
    { cache: 'no-store' },
  );

  if (!response.ok) {
    throw new Error(
      `Availability request failed with status ${response.status}`,
    );
  }

  const body = (await response.json()) as {
    data: ResourceAvailability;
  };

  return body.data;
}