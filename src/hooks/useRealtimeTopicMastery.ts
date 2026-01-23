import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

export const useRealtimeTopicMastery = () => {
  const { user } = useAuth();
  const [topicData, setTopicData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    const fetchTopics = async () => {
      const { data } = await supabase
        .from('topic_mastery')
        .select('*')
        .eq('user_id', user.id);
      
      setTopicData(data || []);
      setLoading(false);
    };

    fetchTopics();

    // Set up realtime subscription
    const channel = supabase
      .channel('topic-mastery-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topic_mastery',
          filter: `user_id=eq.${user.id}`
        },
        async () => {
          logger.info('Topic mastery updated');
          // Refetch all data when any change occurs
          const { data } = await supabase
            .from('topic_mastery')
            .select('*')
            .eq('user_id', user.id);
          
          setTopicData(data || []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { topicData, loading };
};
