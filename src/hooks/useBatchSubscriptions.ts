import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserBatchSubscriptions, hasBatchAccess } from '@/utils/contentAccess';
import { logger } from '@/utils/logger';

export interface BatchSubscription {
  id: string;
  batch_id: string;
  status: 'active' | 'expired' | 'cancelled';
  expires_at: string;
  purchased_at: string;
  batches?: {
    id: string;
    name: string;
    grade: number;
    exam_type: string;
    price: number;
    validity_days: number;
    is_active: boolean;
  };
}

export const useBatchSubscriptions = () => {
  const { user, isAuthenticated } = useAuth();
  const [subscriptions, setSubscriptions] = useState<BatchSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setSubscriptions([]);
      return;
    }

    const fetchSubscriptions = async () => {
      setIsLoading(true);
      try {
        const data = await getUserBatchSubscriptions(user.id);
        setSubscriptions(data as BatchSubscription[]);
        logger.log('✅ Batch subscriptions fetched:', data.length);
      } catch (error) {
        logger.error('Error fetching batch subscriptions:', error);
        setSubscriptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptions();
  }, [user, isAuthenticated]);

  // Helper function to check if user has access to a specific batch
  const hasAccessToBatch = async (batchId: string): Promise<boolean> => {
    if (!user) return false;
    return await hasBatchAccess(user.id, batchId);
  };

  // Helper function to get batch names
  const getBatchNames = (): string[] => {
    return subscriptions
      .filter(sub => sub.batches?.name)
      .map(sub => sub.batches!.name);
  };

  // Check if user has any active batch subscription (for AI Doubt Solver)
  const hasAnyBatchAccess = (): boolean => {
    return subscriptions.length > 0;
  };

  return {
    subscriptions,
    isLoading,
    hasAccessToBatch,
    getBatchNames,
    hasAnyBatchAccess,
  };
};
