import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface Question {
  id: string;
  topic_id: string | null;
  chapter_id: string | null;
  subject: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  difficulty?: string;
  explanation?: string | null;
}

export const useQuestions = (topicId: string | null) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!topicId) {
      setQuestions([]);
      return;
    }

    fetchQuestions();
  }, [topicId]);

  const fetchQuestions = async () => {
    if (!topicId) return;

    try {
      setIsLoading(true);
      setError(null);

      logger.log('🔍 Fetching questions for topic:', topicId);

      const { data, error: queryError, count } = await supabase
        .from('questions')
        .select(
          'id, topic_id, chapter_id, subject, question, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation',
          { count: 'exact' }
        )
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true });

      if (queryError) throw queryError;

      setQuestions(data || []);
      logger.log(`✅ Loaded ${count} questions`);
    } catch (err: any) {
      logger.error('Error in useQuestions:', err);
      setError(err.message || 'Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  return { questions, isLoading, error };
};
