const API_BASE = 'https://api-server.dev-dave.de/api/cactus';

export function cactusApi<T>(
  path: string,
  options: RequestInit = {},
  adminKey?: string | null,
  authToken?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (adminKey) {
    headers['X-Admin-Key'] = adminKey;
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  }).then(async res => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return res.json();
  });
}
