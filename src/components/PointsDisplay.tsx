// src/components/PointsDisplay.tsx
// ✅ REAL-TIME VERSION - Auto-updates with useRealtimePoints

import React from 'react';
import { Trophy, Flame, Target, Sparkles } from 'lucide-react';
import { useStreakData } from '@/hooks/useStreakData';
import { useRealtimePoints } from '@/hooks/useRealtimePoints';
import { useRealtimeQuestionAttempts } from '@/hooks/useRealtimeQuestionAttempts';

const PointsDisplay = () => {
  const { streak } = useStreakData();
  const { pointsData, loading: pointsLoading } = useRealtimePoints();
  const { attemptCount, loading: attemptsLoading } = useRealtimeQuestionAttempts();

  const loading = pointsLoading || attemptsLoading;

  if (loading || !pointsData) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100 animate-pulse">
        <div className="h-4 w-4 bg-slate-200 rounded"></div>
        <div className="h-4 w-16 bg-slate-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* JEEnius Points with Level */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 via-pink-100 to-indigo-100 rounded-lg border-2 border-purple-300 hover:shadow-lg transition-all">
        <div className="flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-purple-700" />
          <Sparkles className="h-3 w-3 text-pink-600 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
            JEEnius Points
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-purple-900">
              {pointsData.totalPoints}
            </span>
            <span className="text-xs font-semibold px-1.5 py-0.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded">
              {pointsData.level}
            </span>
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-100 hover:shadow-md transition-shadow">
        <Flame className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-bold text-amber-900">
          {streak}
        </span>
        <span className="text-xs text-slate-500">day{streak !== 1 ? 's' : ''}</span>
      </div>

      {/* Today's Goal */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100 hover:shadow-md transition-shadow">
        <Target className="h-4 w-4 text-green-600" />
        <span className="text-sm font-bold text-green-900">
          {attemptCount}/15
        </span>
        <span className="text-xs text-slate-500">today</span>
      </div>
    </div>
  );
};

export default PointsDisplay;
