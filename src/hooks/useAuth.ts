import { useState, useEffect, useCallback } from 'react';
import { fetchMe, clearToken, getDiscordLoginUrl, type AuthUserResponse } from '@/lib/authClient';

export interface AuthUser {
  id: number;
  discordId: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  isAdmin: boolean;
  isEditor: boolean;
  loading: boolean;
  signInWithDiscord: () => void;
  signOut: () => void;
}

function mapUser(data: AuthUserResponse): AuthUser {
  const avatarUrl = data.avatar
    ? `https://cdn.discordapp.com/avatars/${data.discord_id}/${data.avatar}.png`
    : null;
  return {
    id: data.id,
    discordId: data.discord_id,
    displayName: data.username,
    avatarUrl,
  };
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const data = await fetchMe();
    if (data) {
      setUser(mapUser(data));
      setRoles(data.roles);
    } else {
      setUser(null);
      setRoles([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const signInWithDiscord = useCallback(() => {
    window.location.href = getDiscordLoginUrl();
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setUser(null);
    setRoles([]);
  }, []);

  const isAdmin = roles.includes('admin');
  const isEditor = roles.includes('editor') || isAdmin;

  return { user, isAdmin, isEditor, loading, signInWithDiscord, signOut };
}
