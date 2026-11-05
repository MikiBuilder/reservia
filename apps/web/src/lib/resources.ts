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
  const baseUrl =
    process.env.API_URL ?? 'http://localhost:3000';

  const response = await fetch(
    `${baseUrl}/api/resources`,
    { cache: 'no-store' },
  );

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