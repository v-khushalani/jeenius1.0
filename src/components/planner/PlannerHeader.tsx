/**
 * Planner Header — Greeting, exam countdown, daily progress ring
 * Clean, premium, data-driven.
 */

import { Settings, RefreshCw, Flame, Target } from 'lucide-react';
import type { PlannerStats } from '@/lib/planner/types';

interface Props {
  greeting: string;
  motivation: string;
  stats: PlannerStats;
  targetExam: string;
  examDate: string;
  onRefresh: () => void;
  onOpenSettings: () => void;
}

function CircularProgress({ percent, size = 56, stroke = 5, children }: {
  percent: number; size?: number; stroke?: number; children?: React.ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="currentColor" strokeWidth={stroke} className="text-white/15" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="currentColor" strokeWidth={stroke} className="text-white"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export function PlannerHeader({ greeting, motivation, stats, targetExam, examDate, onRefresh, onOpenSettings }: Props) {
  const completionPercent = stats.todayTasksTotal > 0
    ? Math.round((stats.todayTasksDone / stats.todayTasksTotal) * 100)
    : 0;

  const examDateFormatted = new Date(examDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div className="bg-gradient-to-br from-[#013062] to-[#024a8c] rounded-2xl p-4 text-white relative overflow-hidden shrink-0">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px' }} />

      <div className="relative z-10">
        {/* Single compact row: greeting + stats + actions */}
        <div className="flex items-center gap-3">
          {/* Daily progress ring */}
          <CircularProgress percent={completionPercent} size={48} stroke={4}>
            <span className="text-[11px] font-bold">{completionPercent}%</span>
          </CircularProgress>

          {/* Greeting + motivation */}
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold tracking-tight truncate">{greeting}</h2>
            <p className="text-[11px] text-white/60 mt-0.5 line-clamp-1">{motivation}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onRefresh}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors active:scale-95"
              title="Refresh plan">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors active:scale-95"
              title="Settings">
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Compact stats strip */}
        <div className="mt-2.5 flex items-center gap-2 justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-white/50" />
              <span className="text-xs font-bold tabular-nums">{stats.daysToExam}</span>
              <span className="text-[9px] text-white/40">days</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-400" />
              <span className="text-xs font-bold tabular-nums">{stats.currentStreak}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold tabular-nums">{stats.avgAccuracy}%</span>
              <span className="text-[9px] text-white/40">acc</span>
            </div>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">
            {targetExam} · {examDateFormatted}
          </span>
        </div>
      </div>
    </div>
  );
}
