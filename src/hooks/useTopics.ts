import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface Topic {
  id: string;
  chapter_id: string | null;
  topic_number: number | null;
  topic_name: string;
  description?: string | null;
}

export const useTopics = (chapterId: string | null) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chapterId) {
      setTopics([]);
      return;
    }

    fetchTopics();
  }, [chapterId]);

  const fetchTopics = async () => {
    if (!chapterId) return;

    try {
      setIsLoading(true);
      setError(null);

      logger.log('🔍 Fetching topics for chapter:', chapterId);

      const { data, error: queryError, count } = await supabase
        .from('topics')
        .select('id, chapter_id, topic_number, topic_name, description', {
          count: 'exact',
        })
        .eq('chapter_id', chapterId)
        .order('topic_number', { ascending: true });

      if (queryError) throw queryError;

      setTopics(data || []);
      logger.log(`✅ Loaded ${count} topics`);
    } catch (err: any) {
      logger.error('Error in useTopics:', err);
      setError(err.message || 'Failed to load topics');
    } finally {
      setIsLoading(false);
    }
  };

  return { topics, isLoading, error };
};
