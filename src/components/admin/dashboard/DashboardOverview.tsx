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
    <div className="space-y-8">
      {/* Hero Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <HeroStat
          label="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          trend={stats?.userGrowth || 0}
          trendLabel="this week"
          onClick={() => navigate('/admin/users')}
        />
        <HeroStat
          label="Active Today"
          value={stats?.activeToday || 0}
          icon={TrendingUp}
          accent
        />
        <HeroStat
          label="Question Bank"
          value={stats?.questionsBank || 0}
          icon={Database}
          onClick={() => navigate('/admin/questions')}
        />
        <HeroStat
          label="Premium"
          value={stats?.premiumUsers || 0}
          icon={Award}
          suffix={`/ ${stats?.totalUsers || 0}`}
        />
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Review - Attention Card */}
        <ActionCard
          title="Pending Review"
          value={stats?.pendingReview || 0}
          icon={ClipboardCheck}
          description="Questions awaiting approval"
          action="Review Now"
          onClick={() => navigate('/admin/review-queue')}
          variant={stats?.pendingReview && stats.pendingReview > 0 ? 'warning' : 'default'}
        />

        {/* Total Attempts */}
        <ActionCard
          title="Total Attempts"
          value={stats?.totalAttempts || 0}
          icon={FileQuestion}
          description="Questions answered by users"
          action="View Analytics"
          onClick={() => navigate('/admin/analytics')}
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction icon={BookOpen} label="Chapters" onClick={() => navigate('/admin/content')} />
        <QuickAction icon={HelpCircle} label="Questions" onClick={() => navigate('/admin/questions')} />
        <QuickAction icon={Sparkles} label="Auto-Assign" onClick={() => navigate('/admin/auto-assign')} />
        <QuickAction icon={Users} label="Users" onClick={() => navigate('/admin/users')} />
      </div>
    </div>
  );
};

// Hero Stat Component
interface HeroStatProps {
  label: string;
  value: number;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  suffix?: string;
  accent?: boolean;
  onClick?: () => void;
}

const HeroStat: React.FC<HeroStatProps> = ({ 
  label, value, icon: Icon, trend, trendLabel, suffix, accent, onClick 
}) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 transition-all duration-300 group",
        accent 
          ? "bg-primary text-primary-foreground" 
          : "bg-card border border-border hover:border-primary/30",
        onClick && "cursor-pointer hover:scale-[1.02]"
      )}
    >
      {/* Background Icon */}
      <Icon className={cn(
        "absolute -right-4 -bottom-4 w-24 h-24 transition-transform group-hover:scale-110",
        accent ? "text-primary-foreground/10" : "text-muted/30"
      )} />
      
      <div className="relative z-10">
        <div className={cn(
          "inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4",
          accent ? "bg-primary-foreground/20" : "bg-primary/10"
        )}>
          <Icon className={cn("w-5 h-5", accent ? "text-primary-foreground" : "text-primary")} />
        </div>
        
        <p className={cn(
          "text-xs font-medium uppercase tracking-wider mb-1",
          accent ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {label}
        </p>
        
        <div className="flex items-baseline gap-2">
          <span className="text-3xl lg:text-4xl font-black tracking-tight">
            {value.toLocaleString()}
          </span>
          {suffix && (
            <span className={cn(
              "text-sm font-medium",
              accent ? "text-primary-foreground/60" : "text-muted-foreground"
            )}>
              {suffix}
            </span>
          )}
        </div>
        
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 mt-2 text-xs font-medium",
            trend >= 0 ? "text-emerald-500" : "text-red-500"
          )}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{Math.abs(trend)}%</span>
            {trendLabel && <span className="text-muted-foreground ml-1">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

// Action Card Component
interface ActionCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  description: string;
  action: string;
  onClick: () => void;
  variant?: 'default' | 'warning' | 'success';
}

const ActionCard: React.FC<ActionCardProps> = ({ 
  title, value, icon: Icon, description, action, onClick, variant = 'default' 
}) => {
  const variantStyles = {
    default: 'border-border hover:border-primary/30',
    warning: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50',
    success: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50',
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    warning: 'bg-amber-500/20 text-amber-600',
    success: 'bg-emerald-500/20 text-emerald-600',
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative rounded-2xl border p-6 transition-all duration-300 cursor-pointer group hover:scale-[1.01]",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "inline-flex items-center justify-center w-12 h-12 rounded-xl",
          iconStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-4xl font-black text-foreground">
          {value.toLocaleString()}
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      
      <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
        <span>{action}</span>
        <ArrowUpRight className="w-4 h-4" />
      </div>
    </div>
  );
};

// Quick Action Component
interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon: Icon, label, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all duration-200 group"
    >
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
    </button>
  );
};

export default DashboardOverview;
