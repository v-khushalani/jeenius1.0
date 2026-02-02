import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, TrendingUp, Award, HelpCircle, 
  ClipboardCheck, ArrowUpRight, ArrowDownRight, Sparkles,
  Database, FileQuestion
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalUsers: number;
  activeToday: number;
  totalAttempts: number;
  premiumUsers: number;
  pendingReview: number;
  questionsBank: number;
  userGrowth: number;
}

export const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
        totalAttempts: attemptsResult.count || 0,
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Key Metrics Grid - 2x2 on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <AdminStatCard
          label="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          trend={stats?.userGrowth || 0}
          trendLabel="week"
          onClick={() => navigate('/admin/users')}
          colorScheme="blue"
        />
        <AdminStatCard
          label="Active Today"
          value={stats?.activeToday || 0}
          icon={TrendingUp}
          colorScheme="emerald"
        />
        <AdminStatCard
          label="Question Bank"
          value={stats?.questionsBank || 0}
          icon={Database}
          onClick={() => navigate('/admin/questions')}
          colorScheme="violet"
        />
        <AdminStatCard
          label="Premium Users"
          value={stats?.premiumUsers || 0}
          icon={Award}
          colorScheme="orange"
        />
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <AdminInsightCard
          title="Pending Review"
          value={stats?.pendingReview || 0}
          icon={ClipboardCheck}
          description="Questions awaiting approval"
          action="Review"
          onClick={() => navigate('/admin/review-queue')}
          colorScheme={stats?.pendingReview && stats.pendingReview > 0 ? "orange" : "slate"}
        />

        <AdminInsightCard
          title="Total Attempts"
          value={stats?.totalAttempts || 0}
          icon={FileQuestion}
          description="Questions answered overall"
          action="Analytics"
          onClick={() => navigate('/admin/analytics')}
          colorScheme="blue"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <AdminQuickAction icon={BookOpen} label="Chapters" onClick={() => navigate('/admin/content')} />
        <AdminQuickAction icon={HelpCircle} label="Questions" onClick={() => navigate('/admin/questions')} />
        <AdminQuickAction icon={Sparkles} label="Auto-Assign" onClick={() => navigate('/admin/auto-assign')} />
        <AdminQuickAction icon={Users} label="Users" onClick={() => navigate('/admin/users')} />
      </div>
    </div>
  );
};

// Admin Stat Card - Apple Style
interface AdminStatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  colorScheme: 'blue' | 'emerald' | 'violet' | 'orange' | 'slate';
  onClick?: () => void;
}

const getColorScheme = (scheme: string) => {
  const schemes = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-100', text: 'text-blue-700', icon: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-600' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', iconBg: 'bg-violet-100', text: 'text-violet-700', icon: 'text-violet-600' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', iconBg: 'bg-orange-100', text: 'text-orange-700', icon: 'text-orange-600' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', iconBg: 'bg-slate-100', text: 'text-slate-700', icon: 'text-slate-600' },
  };
  return schemes[scheme as keyof typeof schemes] || schemes.slate;
};

const AdminStatCard: React.FC<AdminStatCardProps> = ({ 
  label, value, icon: Icon, trend, trendLabel, colorScheme, onClick 
}) => {
  const colors = getColorScheme(colorScheme);
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow transition-all border-l-4",
        colors.bg,
        colors.border,
        onClick && "cursor-pointer"
      )}
    >
      <div className="flex items-start gap-2 mb-2">
        <div className={cn("p-1.5 sm:p-2 rounded-lg flex-shrink-0", colors.iconBg)}>
          <Icon className={cn("h-3 w-3 sm:h-4 sm:w-4", colors.icon)} />
        </div>
      </div>
      
      <p className="text-[10px] sm:text-xs font-medium text-slate-600 mb-1.5">
        {label}
      </p>
      
      <div className="flex items-baseline gap-1.5 mb-1">
        <h3 className={cn("text-lg sm:text-2xl lg:text-3xl font-bold", colors.text)}>
          {value.toLocaleString()}
        </h3>
      </div>
      
      {trend !== undefined && (
        <div className={cn(
          "flex items-center gap-1 text-[9px] sm:text-xs font-medium",
          trend >= 0 ? "text-emerald-600" : "text-slate-500"
        )}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          <span>{Math.abs(trend)}%</span>
          {trendLabel && <span className="text-slate-500">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
};

// Admin Insight Card
interface AdminInsightCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  description: string;
  action: string;
  onClick: () => void;
  colorScheme: 'blue' | 'emerald' | 'violet' | 'orange' | 'slate';
}

const AdminInsightCard: React.FC<AdminInsightCardProps> = ({ 
  title, value, icon: Icon, description, action, onClick, colorScheme
}) => {
  const colors = getColorScheme(colorScheme);

  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-lg sm:rounded-xl p-4 sm:p-5 shadow-sm hover:shadow transition-all border-l-4 cursor-pointer",
        colors.bg,
        colors.border
      )}
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className={cn("p-2 sm:p-2.5 rounded-lg flex-shrink-0", colors.iconBg)}>
          <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", colors.icon)} />
        </div>
        <span className={cn("text-2xl sm:text-3xl lg:text-4xl font-bold", colors.text)}>
          {value.toLocaleString()}
        </span>
      </div>
      
      <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-0.5">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-600 mb-3">{description}</p>
      
      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium transition-all">
        <span className={colors.text}>{action}</span>
        <ArrowUpRight className="w-4 h-4" />
      </div>
    </div>
  );
};

// Admin Quick Action
interface AdminQuickActionProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

const AdminQuickAction: React.FC<AdminQuickActionProps> = ({ icon: Icon, label, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm hover:shadow group"
    >
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 group-hover:scale-110 transition-transform" />
      </div>
      <span className="text-[10px] sm:text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors text-center">
        {label}
      </span>
    </button>
  );
};

export default DashboardOverview;
