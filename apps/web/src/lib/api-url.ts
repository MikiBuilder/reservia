export function apiUrl(path: string): string {
  const baseUrl =
    process.env.API_URL ?? 'http://localhost:3000';

  return `${baseUrl}${path}`;
}