/**
 * JEENIUS AI PLANNER — Main Component (v3)
 * The single entry point. Orchestrates all planner UI.
 * Premium, mobile-first, brand-colored.
 */

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { useAIPlanner } from '@/hooks/useAIPlanner';
import { PlannerHeader } from './planner/PlannerHeader';
import { WeekStrip } from './planner/WeekStrip';
import { DayPlanView } from './planner/DayPlanView';
import { StatsPanel } from './planner/StatsPanel';
import { EmptyState } from './planner/EmptyState';
import { QuickReplanSheet } from './planner/QuickReplanSheet';
import { SettingsSheet } from './planner/SettingsSheet';

export default function AIStudyPlanner() {
  const { state, toggleTask, selectDay, replan, updateSettings, refresh } = useAIPlanner();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [replanOpen, setReplanOpen] = useState(false);

  // Loading
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center space-y-3">
          <div className="relative">
            <div className="w-20 h-20 bg-[#013062]/10 rounded-full blur-xl absolute inset-0" />
            <div className="w-14 h-14 border-4 border-slate-200 border-t-[#013062] rounded-full animate-spin mx-auto relative" />
          </div>
          <p className="text-sm text-slate-600 font-medium">Building your plan...</p>
        </div>
      </div>
    );
  }

  // Not enough data
  if (!state.hasEnoughData) {
    return (
      <EmptyState
        studentName={state.studentName}
        totalQuestions={state.totalQuestions}
        needsDiagnostic={state.needsDiagnostic}
      />
    );
  }

  const selectedPlan = state.weekPlan[state.selectedDayIndex] || state.todayPlan;
  const isViewingToday = state.selectedDayIndex === 0;

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header — Brain score, rank, XP, streak */}
      <PlannerHeader
        greeting={state.greeting}
        motivation={state.motivation}
        stats={state.stats}
        brainScore={state.brainScore}
        rankPrediction={state.rankPrediction}
        targetExam={state.targetExam}
        onRefresh={refresh}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Week strip */}
      <div className="bg-white border-b border-slate-200/60 flex items-center">
        <div className="flex-1 overflow-hidden">
          <WeekStrip
            weekPlan={state.weekPlan}
            selectedIndex={state.selectedDayIndex}
            onSelect={selectDay}
          />
        </div>
        {isViewingToday && (
          <button
            onClick={() => setReplanOpen(true)}
            className="shrink-0 mr-3 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            title="Quick Replan"
          >
            <Clock className="w-4 h-4 text-[#013062]" />
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <DayPlanView
          plan={selectedPlan}
          onToggleTask={toggleTask}
          isViewOnly={!isViewingToday}
        />

        {isViewingToday && (
          <StatsPanel
            subjectBreakdowns={state.subjectBreakdowns}
            chapterPriorities={state.chapterPriorities}
            weeklyWins={state.weeklyWins}
            achievements={state.achievements}
            dailyChallenge={state.dailyChallenge}
          />
        )}

        <div className="h-20" />
      </div>

      {/* Sheets */}
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        dailyStudyHours={state.dailyStudyHours}
        targetExam={state.targetExam}
        onSave={updateSettings}
      />
      <QuickReplanSheet
        open={replanOpen}
        onOpenChange={setReplanOpen}
        currentHours={state.dailyStudyHours}
        onReplan={replan}
      />
    </div>
  );
}
