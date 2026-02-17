// src/services/pointsService.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { DIFFICULTY_CONFIG, STREAK_CONFIG, Difficulty } from '@/constants/unified';

export class PointsService {
  
  static async calculatePoints(
    userId: string,
    difficulty: string,
    isCorrect: boolean,
    timeSpent: number
  ): Promise<{
    points: number;
    breakdown: Array<{ type: string; points: number; label: string }>;
  }> {
    logger.info('calculatePoints', { userId, difficulty, isCorrect });
    
    let points = 0;
    const breakdown: Array<{ type: string; points: number; label: string }> = [];

    if (isCorrect) {
      // Base points
      const basePoints = this.getBasePoints(difficulty);
      points += basePoints;
      breakdown.push({
        type: 'base',
        points: basePoints,
        label: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} question`
      });

      // Streak bonus
      const streakBonus = await this.calculateStreakBonus(userId);
      if (streakBonus.points > 0) {
        points += streakBonus.points;
        breakdown.push({
          type: 'streak',
          points: streakBonus.points,
          label: `${streakBonus.streak} answer streak! 🔥`
        });
      }

      if (streakBonus.badgeEarned) {
        breakdown.push({
          type: 'badge',
          points: 0,
          label: `🏆 ${streakBonus.badgeName} Badge Unlocked!`
        });
      }

    } else {
      // Wrong answer penalty
      points = -2;
      breakdown.push({
        type: 'penalty',
        points: -2,
        label: 'Wrong answer'
      });

      await this.resetAnswerStreak(userId);
    }

    logger.info('Total points to add', { points });
    await this.updateUserPoints(userId, points);

    return { points, breakdown };
  }

  private static getBasePoints(difficulty: string): number {
    const normalized = difficulty.toUpperCase() as Difficulty;
    const config = DIFFICULTY_CONFIG[normalized];
    return config?.basePoints ?? 5;
  }

  private static async calculateStreakBonus(userId: string): Promise<{
    points: number;
    streak: number;
    badgeEarned: boolean;
    badgeName?: string;
  }> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, badges, longest_streak')
      .eq('id', userId)
      .single();

    if (!profile) {
      return { points: 0, streak: 0, badgeEarned: false };
    }

    const currentStreak = profile.current_streak || 0;
    const newStreak = currentStreak + 1;

    await supabase
      .from('profiles')
      .update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, profile.longest_streak || 0)
      })
      .eq('id', userId);

    const milestones = [
      { streak: 5, points: 20, badge: 'Hot Streak' },
      { streak: 10, points: 50, badge: 'On Fire' },
      { streak: 20, points: 150, badge: 'Unstoppable' },
      { streak: 50, points: 500, badge: 'BEAST MODE' }
    ];

    for (const milestone of milestones) {
      if (newStreak === milestone.streak) {
        const rawBadges = profile.badges;
        const badges: string[] = Array.isArray(rawBadges) 
          ? rawBadges.filter((b): b is string => typeof b === 'string')
          : [];
        const badgeEarned = !badges.includes(milestone.badge);
        
        if (badgeEarned) {
          badges.push(milestone.badge);
          await supabase
            .from('profiles')
            .update({ badges })
            .eq('id', userId);
        }

        return {
          points: milestone.points,
          streak: newStreak,
          badgeEarned,
          badgeName: milestone.badge
        };
      }
    }

    return { points: 0, streak: newStreak, badgeEarned: false };
  }

  private static async resetAnswerStreak(userId: string) {
    await supabase
      .from('profiles')
      .update({ current_streak: 0 })
      .eq('id', userId);
  }

  private static async updateUserPoints(userId: string, pointsToAdd: number): Promise<boolean> {
    logger.info('Updating points in database...');

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', userId)
        .single();

      if (!profile) return false;

      const currentPoints = profile.total_points || 0;
      const newTotal = Math.max(0, currentPoints + pointsToAdd);
      const level = this.calculateLevel(newTotal);

      await supabase
        .from('profiles')
        .update({
          total_points: newTotal,
          level: level.name,
          level_progress: level.progress
        })
        .eq('id', userId);

      logger.info('Points updated successfully', { totalPoints: newTotal });
      return true;
    } catch (error) {
      logger.error('Error updating points:', error);
      return false;
    }
  }

  private static calculateLevel(points: number): {
    name: string;
    progress: number;
    emoji: string;
    nextLevel: string;
    pointsToNext: number;
  } {
    const levels = [
      { name: 'BEGINNER', min: 0, max: 1000, emoji: '🌱', next: 'LEARNER' },
      { name: 'LEARNER', min: 1001, max: 3000, emoji: '📘', next: 'ACHIEVER' },
      { name: 'ACHIEVER', min: 3001, max: 7000, emoji: '📗', next: 'EXPERT' },
      { name: 'EXPERT', min: 7001, max: 20000, emoji: '🎓', next: 'MASTER' },
      { name: 'MASTER', min: 20001, max: 50000, emoji: '👑', next: 'LEGEND' },
      { name: 'LEGEND', min: 50001, max: Infinity, emoji: '⚡', next: 'MAX' }
    ];

    for (const level of levels) {
      if (points >= level.min && points <= level.max) {
        const progress = level.max === Infinity 
          ? 100 
          : ((points - level.min) / (level.max - level.min)) * 100;
        
        const pointsToNext = level.max === Infinity 
          ? 0 
          : level.max - points;

        return {
          name: level.name,
          progress: Math.min(progress, 100),
          emoji: level.emoji,
          nextLevel: level.next,
          pointsToNext
        };
      }
    }

    return {
      name: 'BEGINNER',
      progress: 0,
      emoji: '🌱',
      nextLevel: 'LEARNER',
      pointsToNext: 1000
    };
  }

  static async getUserPoints(userId: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      return {
        totalPoints: 0,
        level: 'BEGINNER',
        levelProgress: 0,
        answerStreak: 0,
        longestAnswerStreak: 0,
        badges: [],
        levelInfo: this.calculateLevel(0)
      };
    }

    return {
      totalPoints: profile.total_points || 0,
      level: profile.level || 'BEGINNER',
      levelProgress: profile.level_progress || 0,
      answerStreak: profile.answer_streak || 0,
      longestAnswerStreak: profile.longest_answer_streak || 0,
      badges: profile.badges || [],
      levelInfo: this.calculateLevel(profile.total_points || 0)
    };
  }

  static async getLeaderboard(limit: number = 100) {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, total_points, level, badges')
      .order('total_points', { ascending: false })
      .limit(limit);

    return (data || []).map((entry: any, index: number) => ({
      rank: index + 1,
      userId: entry.id,
      email: entry.email || 'Anonymous',
      points: entry.total_points || 0,
      level: entry.level || 'BEGINNER',
      badges: entry.badges || []
    }));
  }

  static async getUserRank(userId: string): Promise<number> {
    const { data: allUsers } = await supabase
      .from('profiles')
      .select('id, total_points')
      .order('total_points', { ascending: false });

    if (!allUsers) return 0;

    const rank = allUsers.findIndex(u => u.id === userId) + 1;
    return rank;
  }

  /**
   * Update user's question stats (total_questions_answered, correct_answers, overall_accuracy)
   * Call this after each question attempt to keep leaderboard stats up to date
   */
  static async updateUserQuestionStats(userId: string, isCorrect: boolean): Promise<boolean> {
    try {
      // Get current stats
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('total_questions_answered, correct_answers, overall_accuracy')
        .eq('id', userId)
        .single();

      if (fetchError || !profile) {
        logger.error('Failed to fetch profile for stats update:', fetchError);
        return false;
      }

      const totalQuestions = (profile.total_questions_answered || 0) + 1;
      const correctAnswers = (profile.correct_answers || 0) + (isCorrect ? 1 : 0);
      const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      // Update profile with new stats
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          total_questions_answered: totalQuestions,
          correct_answers: correctAnswers,
          overall_accuracy: Math.round(accuracy * 100) / 100 // Round to 2 decimal places
        })
        .eq('id', userId);

      if (updateError) {
        logger.error('Failed to update user question stats:', updateError);
        return false;
      }

      logger.info('User question stats updated', { userId, totalQuestions, correctAnswers, accuracy });
      return true;
    } catch (error) {
      logger.error('Error updating user question stats:', error);
      return false;
    }
  }
}

export default PointsService;
