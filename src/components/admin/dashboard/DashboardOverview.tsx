import React, { useState, useEffect } from 'react';
import { Users, BookOpen, TrendingUp, Award, HelpCircle, ClipboardCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StatsGrid } from './StatsCards';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';
import { SystemHealth } from './SystemHealth';
import { logger } from '@/utils/logger';

interface DashboardStats {
  totalUsers: number;
  activeToday: number;
  totalQuestions: number;
  premiumUsers: number;
  pendingReview: number;
  questionsBank: number;
  userGrowth: number;
}

export const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      const [
        usersResult,
        activeTodayResult,
        attemptsResult,
        premiumResult,
        lastWeekResult,
        questionsResult,
        pendingReviewResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('question_attempts')
          .select('user_id')
          .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabase.from('question_attempts').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_premium', true),
        supabase.from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('questions').select('id', { count: 'exact', head: true }),
        supabase.from('extracted_questions_queue')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);

      const totalUsers = usersResult.count || 0;
      const uniqueActiveToday = new Set(activeTodayResult.data?.map(a => a.user_id) || []).size;
      const premiumUsers = premiumResult.count || 0;
      const lastWeekUsers = lastWeekResult.count || 0;
      const questionsBank = questionsResult.count || 0;
      const pendingReview = pendingReviewResult.count || 0;

      const userGrowth = totalUsers > 0 
        ? parseFloat(((lastWeekUsers / totalUsers) * 100).toFixed(1))
        : 0;

      setStats({
        totalUsers,
        activeToday: uniqueActiveToday,
        totalQuestions: attemptsResult.count || 0,
        premiumUsers,
        pendingReview,
        questionsBank,
        userGrowth,
      });
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = stats ? [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'blue' as const,
      trend: {
        value: stats.userGrowth,
        label: 'from last week'
      }
    },
    {
      title: 'Active Today',
      value: stats.activeToday,
      icon: TrendingUp,
      color: 'green' as const,
      trend: {
        value: 0,
        label: 'users active now'
      }
    },
    {
      title: 'Question Bank',
      value: stats.questionsBank,
      icon: HelpCircle,
      color: 'purple' as const,
    },
    {
      title: 'Premium Users',
      value: stats.premiumUsers,
      icon: Award,
      color: 'amber' as const,
      trend: {
        value: stats.totalUsers > 0 
          ? parseFloat(((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1))
          : 0,
        label: 'of total users'
      }
    },
    {
      title: 'Pending Review',
      value: stats.pendingReview,
      icon: ClipboardCheck,
      color: 'rose' as const,
    },
    {
      title: 'Total Attempts',
      value: stats.totalQuestions,
      icon: BookOpen,
      color: 'cyan' as const,
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Stats Grid - Show 6 cards */}
      <StatsGrid stats={statsCards.slice(0, 4)} loading={loading} />
      
      {/* Secondary Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatsGrid stats={statsCards.slice(4, 6)} loading={loading} />
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions />

      {/* Activity and Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <SystemHealth />
      </div>
    </div>
  );
};

export default DashboardOverview;
