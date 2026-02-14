// src/utils/contentAccess.ts

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface AccessResult {
  allowed: boolean;
  reason: string;
  message?: string;
  remaining?: number;
}

interface UsageStats {
  chaptersAccessed: number;
  chaptersLimit: number;
  questionsToday: number;
  questionsDailyLimit: number;
  aiQueriesToday: number;
  aiDailyLimit: number;
}

/**
 * Check if user can access a specific chapter
 */
/**
 * Check if user can access a specific chapter
 * ✅ ALL CHAPTERS FREE FOR EVERYONE
 */
export const canAccessChapter = async (
  userId: string,
  subject: string,
  chapterName: string
): Promise<AccessResult> => {
  try {
    // Get chapter info
    const { data: chapter } = await supabase
      .from('chapters')
      .select('id, is_free')
      .eq('subject', subject)
      .eq('chapter_name', chapterName)
      .maybeSingle() as { data: { id: string; is_free: boolean } | null };

    if (!chapter) {
      return {
        allowed: false,
        reason: 'chapter_not_found',
        message: 'Chapter not found'
      };
    }

    // ✅ ALL CHAPTERS FREE - No restriction
    return { 
      allowed: true, 
      reason: 'all_chapters_free' 
    };

  } catch (error) {
    logger.error('Error checking chapter access:', error);
    return {
      allowed: false,
      reason: 'error',
      message: 'Unable to verify access. Please try again.'
    };
  }
};

/**
 * Check if user can attempt questions today
 */
export const canAttemptQuestion = async (userId: string): Promise<AccessResult> => {
  try {
    // 1. Check if user is premium via profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, subscription_end_date')
      .eq('id', userId)
      .single();

    const isPremium = profile?.is_premium && 
      (!profile.subscription_end_date || new Date(profile.subscription_end_date) > new Date());

    if (isPremium) {
      return { allowed: true, reason: 'premium_subscriber' };
    }

    // 2. Check daily question limit for free users
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attemptsQuery = supabase
      .from('user_content_access')
      .select('id')
      .eq('user_id', userId)
      .eq('content_type', 'question')
      .gte('accessed_at', today.toISOString());
    const attemptsResult: any = await attemptsQuery;
    
    const todayAttempts = attemptsResult.data || [];

    const { data: limit } = await supabase
      .from('free_content_limits')
      .select('limit_value')
      .eq('limit_type', 'questions_per_day')
      .single();

    const questionsAttempted = todayAttempts?.length || 0;
    const dailyLimit = limit?.limit_value || 50;

    if (questionsAttempted < dailyLimit) {
      return {
        allowed: true,
        reason: 'within_limit',
        remaining: dailyLimit - questionsAttempted
      };
    }

    return {
      allowed: false,
      reason: 'daily_limit_exceeded',
      message: `Daily limit of ${dailyLimit} questions reached! Upgrade to Premium for unlimited practice. 📚`
    };

  } catch (error) {
    logger.error('Error checking question access:', error);
    return {
      allowed: false,
      reason: 'error',
      message: 'Unable to verify access. Please try again.'
    };
  }
};

/**
 * Track question attempt
 */
export const trackQuestionAttempt = async (
  userId: string,
  questionId: string
): Promise<void> => {
  try {
    await supabase.from('user_content_access').insert([{
      user_id: userId,
      content_type: 'question',
      content_identifier: questionId,
      subject: ''
    }]);
  } catch (error) {
    logger.error('Error tracking question attempt:', error);
  }
};

/**
 * Check if user can use AI features
 */
export const canUseAI = async (userId: string): Promise<AccessResult> => {
  try {
    // 1. Check subscription via profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, subscription_end_date')
      .eq('id', userId)
      .single();

    const isPremium = profile?.is_premium && 
      (!profile.subscription_end_date || new Date(profile.subscription_end_date) > new Date());

    if (isPremium) {
      return { allowed: true, reason: 'premium_subscriber' };
    }

    // 2. Check daily AI query limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const queriesQuery: any = supabase
      .from('user_content_access')
      .select('id')
      .eq('user_id', userId)
      .eq('content_type', 'ai_query')
      .gte('accessed_at', today.toISOString());
    const queriesResult = await queriesQuery;
    
    const todayQueries = queriesResult.data || [];

    const { data: limit } = await supabase
      .from('free_content_limits')
      .select('limit_value')
      .eq('limit_type', 'ai_queries_per_day')
      .single();

    const queriesUsed = todayQueries?.length || 0;
    const dailyLimit = limit?.limit_value || 20;

    if (queriesUsed < dailyLimit) {
      return {
        allowed: true,
        reason: 'within_limit',
        remaining: dailyLimit - queriesUsed
      };
    }

    return {
      allowed: false,
      reason: 'daily_limit_exceeded',
      message: `Daily AI limit of ${dailyLimit} queries reached! Upgrade for unlimited AI assistance. 🤖`
    };

  } catch (error) {
    logger.error('Error checking AI access:', error);
    return {
      allowed: false,
      reason: 'error',
      message: 'Unable to verify AI access. Please try again.'
    };
  }
};

/**
 * Track AI query usage
 */
export const trackAIQuery = async (userId: string): Promise<void> => {
  try {
    await supabase.from('user_content_access').insert([{
      user_id: userId,
      content_type: 'ai_query',
      content_identifier: 'ai_query',
      subject: ''
    }]);
  } catch (error) {
    logger.error('Error tracking AI query:', error);
  }
};

/**
 * Get user's current subscription status
 */
export const getUserSubscription = async (userId: string) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, subscription_end_date')
      .eq('id', userId)
      .single();

    if (!profile) return null;

    const isPremium = profile.is_premium && 
      (!profile.subscription_end_date || new Date(profile.subscription_end_date) > new Date());

    if (!isPremium) return null;

    return {
      status: 'active',
      end_date: profile.subscription_end_date
    };
  } catch (error) {
    logger.error('Error fetching subscription:', error);
    return null;
  }
};

/**
 * Check if user is premium subscriber
 */
export const isPremiumUser = async (userId: string): Promise<boolean> => {
  const subscription = await getUserSubscription(userId);
  return !!subscription;
};

/**
 * Get user's usage statistics
 */
export const getUserUsageStats = async (userId: string): Promise<UsageStats> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all limits
    const { data: limits } = await supabase
      .from('free_content_limits')
      .select('*');

    const limitsMap = limits?.reduce((acc, l) => {
      acc[l.limit_type] = l.limit_value;
      return acc;
    }, {} as Record<string, number>) || {};

    // Chapters accessed (all time, unique) - Simplify type
    const chaptersResult = await supabase
      .from('user_content_access')
      .select('content_identifier, subject')
      .eq('user_id', userId)
      .eq('content_type', 'chapter') as { data: Array<{ content_identifier: string; subject: string }> | null; error: any };
    
    const chaptersAccessed = chaptersResult.data || [];

    const uniqueChapters = new Set(
      chaptersAccessed?.map(c => `${c.subject}-${c.content_identifier}`) || []
    );

    // Questions attempted today - Simplify type
    const questionsTodayResult = await supabase
      .from('user_content_access')
      .select('id')
      .eq('user_id', userId)
      .eq('content_type', 'question')
      .gte('accessed_at', today.toISOString()) as { data: Array<{ id: string }> | null; error: any };
    
    const questionsToday = questionsTodayResult.data || [];

    // AI queries today - Cast to avoid deep type inference
    const { data: aiQueriesData } = await supabase
      .from('user_content_access')
      .select('id')
      .eq('user_id', userId)
      .eq('content_type', 'ai_query')
      .gte('accessed_at', today.toISOString()) as { data: Array<{ id: string }> | null };
    
    const aiQueriesToday = aiQueriesData || [];

    return {
      chaptersAccessed: uniqueChapters.size,
      chaptersLimit: limitsMap.chapters || 5,
      questionsToday: questionsToday?.length || 0,
      questionsDailyLimit: limitsMap.questions_per_day || 50,
      aiQueriesToday: aiQueriesToday?.length || 0,
      aiDailyLimit: limitsMap.ai_queries_per_day || 20
    };

  } catch (error) {
    logger.error('Error fetching usage stats:', error);
    return {
      chaptersAccessed: 0,
      chaptersLimit: 5,
      questionsToday: 0,
      questionsDailyLimit: 50,
      aiQueriesToday: 0,
      aiDailyLimit: 20
    };
  }
};

/**
 * Get list of accessible chapters for user
 */
/**
 * Get list of accessible chapters for user
 * ✅ ALL CHAPTERS FREE FOR EVERYONE - No premium restrictions
 */
export const getAccessibleChapters = async (
  userId: string,
  subject?: string
) => {
  try {
    const query = supabase
      .from('chapters')
      .select('*')
      .order('chapter_number');

    if (subject) {
      query.eq('subject', subject);
    }

    const { data } = await query;
    // All chapters are unlocked for everyone
    return data?.map(chapter => ({ ...chapter, locked: false })) || [];

  } catch (error) {
    logger.error('Error fetching accessible chapters:', error);
    return [];
  }
};

/**
 * Format remaining count message
 */
export const formatRemainingMessage = (
  type: 'chapters' | 'questions' | 'ai',
  remaining: number
): string => {
  if (remaining === 0) {
    return `No free ${type} remaining today`;
  }
  if (remaining === 1) {
    return `${remaining} free ${type.slice(0, -1)} remaining`;
  }
  return `${remaining} free ${type} remaining`;
};

/**
 * BATCH SYSTEM - Get user's current active batch subscription
 * Returns the batch they currently have access to
 */
export const getCurrentBatch = async (userId: string) => {
  try {
    const { data: subscription, error } = await supabase
      .from('user_batch_subscriptions')
      .select(`
        id,
        batch_id,
        status,
        expires_at,
        batches (
          id,
          name,
          grade,
          exam_type,
          price,
          offer_price,
          validity_days,
          is_active,
          batch_subjects (subject)
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !subscription) {
      return null;
    }

    return {
      subscription_id: subscription.id,
      batch_id: subscription.batch_id,
      batch: subscription.batches,
      expires_at: subscription.expires_at
    };
  } catch (error) {
    logger.error('Error getting current batch:', error);
    return null;
  }
};

/**
 * Check if user has access to a specific batch
 * Verifies subscription is active and not expired
 */
export const hasBatchAccess = async (userId: string, batchId: string): Promise<boolean> => {
  try {
    const { data: subscription, error } = await supabase
      .from('user_batch_subscriptions')
      .select('id, expires_at')
      .eq('user_id', userId)
      .eq('batch_id', batchId)
      .eq('status', 'active')
      .single();

    if (error || !subscription) {
      return false;
    }

    // Check if subscription is not expired
    return new Date(subscription.expires_at) > new Date();
  } catch (error) {
    logger.error('Error checking batch access:', error);
    return false;
  }
};

/**
 * Get all of user's batch subscriptions
 */
export const getUserBatchSubscriptions = async (userId: string) => {
  try {
    const { data: subscriptions, error } = await supabase
      .from('user_batch_subscriptions')
      .select(`
        id,
        batch_id,
        status,
        expires_at,
        purchased_at,
        batches (
          id,
          name,
          grade,
          exam_type,
          price,
          validity_days,
          is_active,
          batch_subjects (subject)
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('expires_at', { ascending: false });

    if (error) {
      return [];
    }

    return subscriptions || [];
  } catch (error) {
    logger.error('Error fetching batch subscriptions:', error);
    return [];
  }
};

/**
 * Get subjects available in user's current batch
 */
export const getBatchSubjects = async (batchId: string): Promise<string[]> => {
  try {
    const { data: subjects, error } = await supabase
      .from('batch_subjects')
      .select('subject')
      .eq('batch_id', batchId);

    if (error || !subjects) {
      return [];
    }

    return subjects.map(s => s.subject);
  } catch (error) {
    logger.error('Error fetching batch subjects:', error);
    return [];
  }
};

// =============================================
// TIER-BASED ACCESS SYSTEM
// =============================================

interface TierFeatures {
  videos: boolean;
  pdfs: boolean;
  tests: boolean;
  solutions: boolean;
  liveClasses: boolean;
  doubtSupport: boolean;
}

interface TierAccessResult {
  hasAccess: boolean;
  tier: 'free' | 'pro' | 'none';
  features: TierFeatures;
  expiresAt?: Date;
  daysRemaining?: number;
  contentLimit?: number | null;
}

/**
 * Check user's tier-based access to a batch
 * Returns tier info, features unlocked, and expiry
 */
export const checkBatchTierAccess = async (
  userId: string,
  batchId: string
): Promise<TierAccessResult> => {
  const noAccess: TierAccessResult = {
    hasAccess: false,
    tier: 'none',
    features: {
      videos: false,
      pdfs: false,
      tests: false,
      solutions: false,
      liveClasses: false,
      doubtSupport: false
    }
  };

  try {
    // Get user's subscription with tier info
    const { data: subscription, error } = await supabase
      .from('user_batch_subscriptions')
      .select('expires_at, status')
      .eq('user_id', userId)
      .eq('batch_id', batchId)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !subscription) {
      return noAccess;
    }

    // Check expiry
    const expiresAt = new Date(subscription.expires_at);
    const now = new Date();

    if (expiresAt < now) {
      return noAccess;
    }

    const daysRemaining = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      hasAccess: true,
      tier: 'pro' as 'free' | 'pro',
      features: {
        videos: true,
        pdfs: true,
        tests: true,
        solutions: true,
        liveClasses: true,
        doubtSupport: true
      } as TierFeatures,
      expiresAt,
      daysRemaining,
      contentLimit: undefined
    };
  } catch (error) {
    logger.error('Error checking batch tier access:', error);
    return noAccess;
  }
};

/**
 * Check if user can access specific content type based on tier
 */
export const canAccessContent = async (
  userId: string,
  batchId: string,
  contentType: keyof TierFeatures
): Promise<boolean> => {
  const access = await checkBatchTierAccess(userId, batchId);
  return access.hasAccess && access.features[contentType];
};

/**
 * Get user's goal (immutable after first set)
 */
export const getUserGoal = async (userId: string): Promise<string | null> => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('target_exam, goal_locked')
      .eq('id', userId)
      .maybeSingle();

    return profile?.target_exam || null;
  } catch (error) {
    logger.error('Error fetching user goal:', error);
    return null;
  }
};

/**
 * Check if user's goal is locked
 */
export const isGoalLocked = async (userId: string): Promise<boolean> => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('goal_locked')
      .eq('id', userId)
      .single();

    return profile?.goal_locked || false;
  } catch (error) {
    logger.error('Error checking goal lock:', error);
    return false;
  }
};

/**
 * Get batches aligned with user's goal
 */
export const getGoalAlignedBatches = async (userId: string) => {
  try {
    const goal = await getUserGoal(userId);
    if (!goal) return [];

    const { data: batches, error } = await supabase
      .from('batches')
      .select(`
        id,
        name,
        slug,
        description,
        grade,
        exam_type,
        price,
        offer_price,
        validity_days,
        is_active,
        batch_subjects (subject)
      `)
      .eq('is_active', true)
      .order('grade');

    if (error) {
      return [];
    }

    return batches || [];
  } catch (error) {
    logger.error('Error fetching goal-aligned batches:', error);
    return [];
  }
};
