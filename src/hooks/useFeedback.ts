import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cactusApi } from '@/lib/cactusApi';

export interface FeedbackEntry {
  id: number;
  feedback_id: string;
  title: string;
  description: string;
  type: 'bug' | 'feature' | 'feedback';
  status: 'open' | 'in_progress' | 'done' | 'rejected';
  admin_notes: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export function useAllFeedback(adminKey: string | null) {
  return useQuery({
    queryKey: ['feedback-all'],
    queryFn: () => cactusApi<FeedbackEntry[]>('/feedback', {}, adminKey),
    enabled: !!adminKey,
  });
}

export function useMyFeedback() {
  const token = localStorage.getItem('cactus_auth_token');
  return useQuery({
    queryKey: ['feedback-mine'],
    queryFn: () => cactusApi<FeedbackEntry[]>('/feedback/mine', {}, null, token),
    enabled: !!token,
  });
}

export function useFeedbackById(feedbackId: string) {
  return useQuery({
    queryKey: ['feedback', feedbackId],
    queryFn: () => cactusApi<FeedbackEntry>(`/feedback/track/${feedbackId}`),
    enabled: !!feedbackId,
    retry: false,
  });
}

export function useSubmitFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: { title: string; description: string; type: string; author_name?: string }) => {
      const token = localStorage.getItem('cactus_auth_token');
      const result = await cactusApi<{ success: boolean; feedback_id: string }>('/feedback', {
        method: 'POST',
        body: JSON.stringify(entry),
      }, null, token);
      return result.feedback_id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback-mine'] });
    },
  });
}

export function useUpdateFeedback(adminKey: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: number; status?: string; admin_notes?: string }) =>
      cactusApi<{ success: boolean }>(`/feedback/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }, adminKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback-all'] });
      qc.invalidateQueries({ queryKey: ['feedback-mine'] });
    },
  });
}

export function useDeleteFeedback(adminKey: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      cactusApi<{ success: boolean }>(`/feedback/${id}`, {
        method: 'DELETE',
      }, adminKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback-all'] });
    },
  });
}
