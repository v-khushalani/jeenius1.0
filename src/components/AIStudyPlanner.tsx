/**
 * AI Study Planner — Complete Rebuild
 * Zero mock data. Every pixel driven by real student performance.
 * Single-screen, non-scrollable, hyper-minimalist.
 */

import { useState } from 'react';
import { useSmartPlanner } from '@/hooks/useSmartPlanner';
import { CompactPlannerLayout } from './planner/CompactPlannerLayout';
import { SettingsSheet } from './planner/SettingsSheet';
import { EmptyState } from './planner/EmptyState';

const MIN_QUESTIONS = 10;

export default function AIStudyPlanner() {
  const { state, toggleTask, updateSettings, refresh } = useSmartPlanner();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Loading
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="text-center space-y-3">
          <div className="relative">
            <div className="w-20 h-20 bg-[#013062]/10 rounded-full blur-xl absolute inset-0" />
            <div className="w-14 h-14 border-4 border-slate-200 border-t-[#013062] rounded-full animate-spin mx-auto relative" />
          </div>
          <p className="text-slate-600 font-medium">Building your plan...</p>
        </div>
      </div>
    );
  }

  // Not enough data
  if (!state.hasEnoughData) {
    return (
      <EmptyState
        totalQuestions={state.totalQuestions}
        minRequired={MIN_QUESTIONS}
        studentName={state.studentName}
      />
    );
  }

  return (
    <>
      <CompactPlannerLayout
        state={state}
        onToggleTask={toggleTask}
        onRefresh={refresh}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        dailyStudyHours={state.dailyStudyHours}
        targetExam={state.targetExam}
        timeAllocation={state.timeAllocation}
        onSave={updateSettings}
      />
    </>
  );
}
