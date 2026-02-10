/**
 * AI Study Planner — Complete Rebuild
 * Zero mock data. Every pixel driven by real student performance.
 * Designed to be the study tool students can't put down.
 */

import { useState } from 'react';
import { useSmartPlanner } from '@/hooks/useSmartPlanner';
import { PlannerHeader } from './planner/PlannerHeader';
import { TodayView } from './planner/TodayView';
import { WeekView } from './planner/WeekView';
import { ProgressView } from './planner/ProgressView';
import { SettingsSheet } from './planner/SettingsSheet';
import { EmptyState } from './planner/EmptyState';
import { CalendarDays, BarChart3, Crosshair } from 'lucide-react';

const MIN_QUESTIONS = 10;

type Tab = 'today' | 'week' | 'progress';

export default function AIStudyPlanner() {
  const { state, toggleTask, updateSettings, refresh } = useSmartPlanner();
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Loading
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
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

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'today', label: 'Today', icon: <Crosshair className="h-4 w-4" /> },
    { key: 'week', label: 'Week', icon: <CalendarDays className="h-4 w-4" /> },
    { key: 'progress', label: 'Growth', icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <PlannerHeader
        greeting={state.greeting}
        motivation={state.motivation}
        stats={state.stats}
        targetExam={state.targetExam}
        examDate={state.examDate}
        onRefresh={refresh}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Tab navigation */}
      <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-[#013062] shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[300px]">
        {activeTab === 'today' && (
          <TodayView
            todayPlan={state.todayPlan}
            revisionDue={state.revisionDue}
            weeklyWins={state.weeklyWins}
            onToggleTask={toggleTask}
          />
        )}
        {activeTab === 'week' && (
          <WeekView weekPlan={state.weekPlan} />
        )}
        {activeTab === 'progress' && (
          <ProgressView
            subjectBreakdowns={state.subjectBreakdowns}
            topics={state.topics}
            stats={state.stats}
          />
        )}
      </div>

      {/* Settings sheet */}
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        dailyStudyHours={state.dailyStudyHours}
        targetExam={state.targetExam}
        timeAllocation={state.timeAllocation}
        onSave={updateSettings}
      />
    </div>
  );
}
