import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PointsService from '@/services/pointsService';
import { logger } from '@/utils/logger';

export const useRealtimePoints = () => {
  const { user } = useAuth();
  const [pointsData, setPointsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    const fetchPoints = async () => {
      const data = await PointsService.getUserPoints(user.id);
      setPointsData(data);
      setLoading(false);
    };

    fetchPoints();

    // Set up realtime subscription for points log
    const pointsChannel = supabase
      .channel('points-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'points_log',
          filter: `user_id=eq.${user.id}`
        },
        async () => {
          logger.log('Points updated');
          const data = await PointsService.getUserPoints(user.id);
          setPointsData(data);
        }
      )
      .subscribe();

    // Also listen to profile updates for total_points
    const profileChannel = supabase
      .channel('profile-points-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        async (payload) => {
          logger.log('Profile points updated:', payload);
          if (payload.new && 'total_points' in payload.new) {
            const data = await PointsService.getUserPoints(user.id);
            setPointsData(data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pointsChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [user]);

  return { pointsData, loading };
};
