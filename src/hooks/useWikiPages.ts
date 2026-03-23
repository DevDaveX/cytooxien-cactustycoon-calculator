import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WikiPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  icon: string;
  author_id: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export function useWikiPages() {
  return useQuery({
    queryKey: ['wiki-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wiki_pages')
        .select('*')
        .order('category')
        .order('title');
      if (error) throw error;
      return data as WikiPage[];
    },
  });
}

export function useWikiPage(slug: string) {
  return useQuery({
    queryKey: ['wiki-page', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wiki_pages')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data as WikiPage | null;
    },
    enabled: !!slug,
  });
}

export function useSaveWikiPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (page: Partial<WikiPage> & { slug: string; title: string }) => {
      if (page.id) {
        const { error } = await supabase
          .from('wiki_pages')
          .update({ ...page, updated_at: new Date().toISOString() })
          .eq('id', page.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('wiki_pages')
          .insert(page);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wiki-pages'] });
      qc.invalidateQueries({ queryKey: ['wiki-page'] });
    },
  });
}

export function useDeleteWikiPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('wiki_pages')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wiki-pages'] });
    },
  });
}
