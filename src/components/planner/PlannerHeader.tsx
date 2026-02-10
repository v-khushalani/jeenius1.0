/**
 * Planner Header — Brain score, rank prediction, XP bar, streak
 * The hero section. First thing student sees.
 */
import { Flame, Target, TrendingUp, TrendingDown, Minus, RefreshCw, Settings, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlannerStats, BrainScore, RankPrediction } from '@/lib/ai-planner/types';
import { PHASES } from '@/lib/ai-planner/constants';

interface PlannerHeaderProps {
  greeting: string;
  motivation: string;
  stats: PlannerStats;
  brainScore: BrainScore;
  rankPrediction: RankPrediction;
  targetExam: string;
  onRefresh: () => void;
  onOpenSettings: () => void;
}

export function PlannerHeader({
  greeting, motivation, stats, brainScore, rankPrediction, targetExam,
  onRefresh, onOpenSettings,
}: PlannerHeaderProps) {
  const phase = PHASES[stats.examPhase as keyof typeof PHASES];
  const TrendIcon = brainScore.trend === 'rising' ? TrendingUp : brainScore.trend === 'declining' ? TrendingDown : Minus;

  return (
    <div className="bg-gradient-to-br from-[#013062] via-[#01408a] to-[#013062] text-white px-4 pt-3 pb-4">
      {/* Top bar: greeting + actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate">{greeting}</h1>
          <p className="text-[11px] text-blue-200 mt-0.5 line-clamp-1">{motivation}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button onClick={onRefresh} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors active:scale-95">
            <RefreshCw className="w-4 h-4 text-blue-200" />
          </button>
          <button onClick={onOpenSettings} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors active:scale-95">
            <Settings className="w-4 h-4 text-blue-200" />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <StatBadge label="Brain" value={`${brainScore.overall}`} sub={
          <span className="flex items-center gap-0.5">
            <TrendIcon className="w-2.5 h-2.5" />
            {brainScore.weeklyDelta > 0 ? `+${brainScore.weeklyDelta}` : brainScore.weeklyDelta}
          </span>
        } />
        <StatBadge label="Rank" value={`~${formatRank(rankPrediction.estimatedRank)}`} sub={`${rankPrediction.confidence}% conf`} />
        <StatBadge label="D-Day" value={`${stats.daysToExam}`} sub={phase?.emoji || ''} />
        <StatBadge label="Streak" value={`${stats.currentStreak}`} sub={
          <Flame className="w-3 h-3 text-orange-400" />
        } />
      </div>

      {/* XP Bar */}
      <div className="bg-white/10 rounded-xl p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{stats.levelIcon}</span>
            <span className="text-xs font-bold">Lv.{stats.level}</span>
            <span className="text-[10px] text-blue-200">{stats.levelTitle}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-300">{stats.currentXP.toLocaleString()} XP</span>
          </div>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-700"
            style={{ width: `${stats.xpProgress}%` }}
          />
        </div>
        <p className="text-[9px] text-blue-300 mt-1 text-right">
          {stats.xpToNextLevel.toLocaleString()} XP to next level
        </p>
      </div>

      {/* Today progress */}
      <div className="flex items-center justify-between mt-3 bg-white/10 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-200" />
          <span className="text-xs font-medium">Today's Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold">{stats.todayTasksDone}/{stats.todayTasksTotal}</span>
          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${stats.todayTasksTotal > 0 ? (stats.todayTasksDone / stats.todayTasksTotal) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBadge({ label, value, sub }: { label: string; value: string; sub: React.ReactNode }) {
  return (
    <div className="bg-white/10 rounded-lg p-2 text-center">
      <p className="text-[9px] text-blue-300 uppercase font-medium tracking-wider">{label}</p>
      <p className="text-sm font-bold mt-0.5">{value}</p>
      <div className="text-[9px] text-blue-200 mt-0.5 flex items-center justify-center gap-0.5">{sub}</div>
    </div>
  );
}

function formatRank(rank: number): string {
  if (rank >= 100000) return `${Math.round(rank / 1000)}K`;
  if (rank >= 10000) return `${Math.round(rank / 1000)}K`;
  if (rank >= 1000) return `${(rank / 1000).toFixed(1)}K`;
  return `${rank}`;
}
