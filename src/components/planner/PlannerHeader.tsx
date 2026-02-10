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
    <div className="bg-gradient-to-br from-[#013062] to-[#024a8c] rounded-2xl p-5 text-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px' }} />

      <div className="relative z-10">
        {/* Top row: greeting + actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold tracking-tight truncate">{greeting}</h2>
            <p className="text-sm text-white/70 mt-0.5 line-clamp-2">{motivation}</p>
          </div>
          <div className="flex items-center gap-1.5 ml-3 shrink-0">
            <button onClick={onRefresh}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors active:scale-95"
              title="Refresh plan">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={onOpenSettings}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors active:scale-95"
              title="Settings">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4">
          {/* Daily progress ring */}
          <CircularProgress percent={completionPercent} size={60} stroke={5}>
            <span className="text-sm font-bold">{completionPercent}%</span>
          </CircularProgress>

          <div className="flex-1 grid grid-cols-3 gap-3">
            {/* Exam countdown */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Target className="h-3.5 w-3.5 text-white/60" />
              </div>
              <p className="text-xl font-bold tabular-nums">{stats.daysToExam}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Days Left</p>
            </div>

            {/* Streak */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
              </div>
              <p className="text-xl font-bold tabular-nums">{stats.currentStreak}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Streak</p>
            </div>

            {/* Accuracy */}
            <div className="text-center">
              <p className="text-xl font-bold tabular-nums">{stats.avgAccuracy}%</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Accuracy</p>
            </div>
          </div>
        </div>

        {/* Exam tag */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 uppercase tracking-wider">
            {targetExam} · {examDateFormatted}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
            {stats.totalTopicsPracticed} topics · {stats.masteredCount} mastered
          </span>
        </div>
      </div>
    </div>
  );
}
