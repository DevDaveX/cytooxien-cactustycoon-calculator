
const AUTH_API_BASE = 'https://api-server.dev-dave.de/api/auth';

function getToken(): string | null {
  return localStorage.getItem('cactus_auth_token');
}

export function setToken(token: string) {
  localStorage.setItem('cactus_auth_token', token);
}

export function clearToken() {
  localStorage.removeItem('cactus_auth_token');
}

export function getDiscordLoginUrl(): string {
  const redirect = encodeURIComponent(window.location.origin + '/auth/callback');
  return `${AUTH_API_BASE}/discord?redirect=${redirect}`;
}

export interface AuthUserResponse {
  id: number;
  discord_id: string;
  username: string;
  avatar: string | null;
  roles: string[];
}

export async function fetchMe(): Promise<AuthUserResponse | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${AUTH_API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      if (res.status === 401) clearToken();
      return null;
    }
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchRoles(adminKey: string): Promise<any[]> {
  const token = getToken();
  const res = await fetch(`${AUTH_API_BASE}/admin/roles`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Admin-Key': adminKey,
    },
  });
  if (!res.ok) throw new Error('Fehler beim Laden der Rollen');
  return res.json();
}

export async function addRoleApi(adminKey: string, userId: number, role: string) {
  const token = getToken();
  const res = await fetch(`${AUTH_API_BASE}/admin/roles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Admin-Key': adminKey,
    },
    body: JSON.stringify({ user_id: userId, role }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Fehler' }));
    throw new Error(body.error || 'Fehler');
  }
  return res.json();
}

export async function removeRoleApi(adminKey: string, roleId: number) {
  const token = getToken();
  const res = await fetch(`${AUTH_API_BASE}/admin/roles/${roleId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Admin-Key': adminKey,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Fehler' }));
    throw new Error(body.error || 'Fehler');
  }
  return res.json();
}
