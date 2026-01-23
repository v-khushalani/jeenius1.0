import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

export const useRealtimeQuestionAttempts = () => {
  const { user } = useAuth();
  const [attemptCount, setAttemptCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    const fetchCount = async () => {
      const { count } = await supabase
        .from('question_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setAttemptCount(count || 0);
      setLoading(false);
    };

    fetchCount();

    // Set up realtime subscription
    const channel = supabase
      .channel('question-attempts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'question_attempts',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          logger.info('New question attempt detected');
          setAttemptCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { attemptCount, loading };
};
