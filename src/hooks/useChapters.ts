import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface Chapter {
  id: string;
  batch_id: string | null;
  subject: string;
  chapter_number: number;
  chapter_name: string;
  description?: string | null;
}

export const useChapters = (batchId: string | null, subject: string | null) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId || !subject) {
      setChapters([]);
      return;
    }

    fetchChapters();
  }, [batchId, subject]);

  const fetchChapters = async () => {
    if (!batchId || !subject) return;

    try {
      setIsLoading(true);
      setError(null);

      logger.log('🔍 Fetching chapters:', { batch: batchId, subject });

      const { data, error: queryError, count } = await supabase
        .from('chapters')
        .select('id, batch_id, subject, chapter_number, chapter_name, description', {
          count: 'exact',
        })
        .eq('subject', subject)
        .eq('batch_id', batchId)
        .order('chapter_number', { ascending: true });

      if (queryError) throw queryError;

      setChapters(data || []);
      logger.log(`✅ Loaded ${count} chapters for batch ${batchId}`);
    } catch (err: any) {
      logger.error('Error in useChapters:', err);
      setError(err.message || 'Failed to load chapters');
    } finally {
      setIsLoading(false);
    }
  };

  return { chapters, isLoading, error };
};
