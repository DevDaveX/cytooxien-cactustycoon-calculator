import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cactusApi } from '@/lib/cactusApi';

export interface ChangelogEntry {
  id: number;
  version: string;
  title: string;
  description: string;
  type: 'feature' | 'change' | 'bugfix' | 'removal';
  created_at: string;
}

export function useChangelog() {
  return useQuery({
    queryKey: ['changelog'],
    queryFn: () => cactusApi<ChangelogEntry[]>('/changelog'),
  });
}

export function useSaveChangelogEntry(adminKey: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: { version: string; title: string; description?: string; type: string }) =>
      cactusApi<{ success: boolean; id: number }>('/changelog', {
        method: 'POST',
        body: JSON.stringify(entry),
      }, adminKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['changelog'] });
    },
  });
}

export function useDeleteChangelogEntry(adminKey: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      cactusApi<{ success: boolean }>(`/changelog/${id}`, {
        method: 'DELETE',
      }, adminKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['changelog'] });
    },
  });
}
