/**
 * Compact Planner — Single Screen, Zero Scrolling
 * Everything visible at once. Minimalist. Effective.
 */

import { useState } from 'react';
import { ChevronDown, Target, Flame, RefreshCw, Settings } from 'lucide-react';
import type { SmartPlannerState } from '@/lib/planner/types';

interface CompactPlannerLayoutProps {
  state: SmartPlannerState;
  onToggleTask: (taskId: string) => Promise<void>;
  onRefresh: () => void;
  onOpenSettings: () => void;
}

export function CompactPlannerLayout({
  state,
  onToggleTask,
  onRefresh,
  onOpenSettings,
}: CompactPlannerLayoutProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['today', 'upcoming'])
  );

  const toggleSection = (sectionId: string) => {
    const next = new Set(expandedSections);
    if (next.has(sectionId)) {
      next.delete(sectionId);
    } else {
      next.add(sectionId);
    }
    setExpandedSections(next);
  };

  const todayTasks = state.todayPlan?.tasks || [];
  const completedToday = todayTasks.filter(t => t.status === 'completed').length;
  const totalToday = todayTasks.length;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      {/* ━━━━━━ ULTRA-COMPACT HEADER ━━━━━━ */}
      <div className="px-3 py-2.5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2 justify-between">
          {/* Left: Greeting + Countdown */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-bold text-slate-900 truncate">
              {state.greeting}
            </h2>
            <p className="text-[10px] text-slate-500 line-clamp-1">
              {state.targetExam} · {state.stats.daysToExam} days · {state.stats.avgAccuracy}% accuracy
            </p>
          </div>

          {/* Right: Stats badges + Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-0.5">
              <Flame className="h-3 w-3 text-orange-500" />
              <span className="text-xs font-bold text-slate-900">{state.stats.currentStreak}</span>
            </div>
            <button
              onClick={onRefresh}
              className="p-1 rounded hover:bg-slate-100 transition-colors active:scale-95"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-600" />
            </button>
            <button
              onClick={onOpenSettings}
              className="p-1 rounded hover:bg-slate-100 transition-colors active:scale-95"
              title="Settings"
            >
              <Settings className="h-3.5 w-3.5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* ━━━━━━ SCROLLABLE CONTENT ━━━━━━ */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="divide-y divide-slate-100">
          {/* ─── TODAY'S FOCUS ─── */}
          <div>
            <button
              onClick={() => toggleSection('today')}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Target className="h-4 w-4 text-[#013062]" />
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900">Today's Focus</p>
                  <p className="text-xs text-slate-500">
                    {completedToday}/{totalToday} completed
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform flex-shrink-0 ${
                  expandedSections.has('today') ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedSections.has('today') && (
              <div className="px-3 pb-2 space-y-1.5 bg-slate-50/40">
                {todayTasks.length > 0 ? (
                  todayTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={() => onToggleTask(task.id)}
                        className="mt-1 w-4 h-4 rounded cursor-pointer accent-[#013062]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">
                            {task.subject[0]}
                          </span>
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {task.topic}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {task.allocatedMinutes}min · {task.questionsTarget} Q · {task.type}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          {task.reason}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-2">No tasks for today</p>
                )}
              </div>
            )}
          </div>

          {/* ─── TOPICS TO REVISE (SPACED REP) ─── */}
          {state.revisionDue.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('revision')}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900">Spaced Revision</p>
                  <p className="text-xs text-slate-500">
                    {state.revisionDue.length} topics need practice
                  </p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform flex-shrink-0 ${
                    expandedSections.has('revision') ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedSections.has('revision') && (
                <div className="px-3 pb-2 space-y-1 bg-slate-50/40">
                  {state.revisionDue.slice(0, 4).map((item, i) => (
                    <div key={i} className="p-2 rounded-lg bg-white border border-slate-200">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-900">
                          {item.topic}
                        </p>
                        <span className="text-[10px] font-bold text-slate-500">
                          {item.daysOverdue}d overdue
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {item.accuracy}% · Last: {item.lastPracticed}d ago
                      </p>
                    </div>
                  ))}
                  {state.revisionDue.length > 4 && (
                    <p className="text-[10px] text-slate-500 text-center py-1">
                      +{state.revisionDue.length - 4} more
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── WEEKLY WINS ─── */}
          {state.weeklyWins.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('wins')}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900">This Week</p>
                  <p className="text-xs text-slate-500">
                    {state.weeklyWins.length} achievements
                  </p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform flex-shrink-0 ${
                    expandedSections.has('wins') ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedSections.has('wins') && (
                <div className="px-3 pb-2 space-y-1 bg-slate-50/40">
                  {state.weeklyWins.map((win, i) => (
                    <div key={i} className="p-2 rounded-lg bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200">
                      <p className="text-xs font-semibold text-emerald-900 flex items-center gap-1">
                        ✓ {win.title}
                      </p>
                      <p className="text-[10px] text-emerald-700">{win.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── WEAK TOPICS (Mastery View) ─── */}
          {state.topics.some(t => t.status === 'weak') && (
            <div>
              <button
                onClick={() => toggleSection('weak')}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900">Areas to Strengthen</p>
                  <p className="text-xs text-slate-500">
                    {state.topics.filter(t => t.status === 'weak').length} weak topics
                  </p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform flex-shrink-0 ${
                    expandedSections.has('weak') ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedSections.has('weak') && (
                <div className="px-3 pb-2 space-y-1 bg-slate-50/40">
                  {state.topics
                    .filter(t => t.status === 'weak')
                    .slice(0, 5)
                    .map((topic, i) => (
                      <div key={i} className="p-2 rounded-lg bg-white border border-red-200 hover:bg-red-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-900">
                            {topic.topic}
                          </p>
                          <span className="text-[10px] font-bold text-red-600">
                            {topic.accuracy}% acc
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {topic.questionsAttempted} Q · Priority: {topic.priorityScore}
                        </p>
                      </div>
                    ))}
                  {state.topics.filter(t => t.status === 'weak').length > 5 && (
                    <p className="text-[10px] text-slate-500 text-center py-1">
                      +{state.topics.filter(t => t.status === 'weak').length - 5} more to work on
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── MASTERED TOPICS ─── */}
          {state.topics.some(t => t.status === 'mastered') && (
            <div>
              <button
                onClick={() => toggleSection('mastered')}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900">Mastered</p>
                  <p className="text-xs text-slate-500">
                    {state.topics.filter(t => t.status === 'mastered').length} topics locked
                  </p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform flex-shrink-0 ${
                    expandedSections.has('mastered') ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedSections.has('mastered') && (
                <div className="px-3 pb-3 space-y-1 bg-slate-50/40">
                  <div className="grid grid-cols-2 gap-1">
                    {state.topics
                      .filter(t => t.status === 'mastered')
                      .slice(0, 6)
                      .map((topic, i) => (
                        <div key={i} className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                          <p className="text-[10px] font-semibold text-emerald-900 truncate">
                            {topic.topic}
                          </p>
                          <p className="text-[9px] text-emerald-600">✓ {topic.accuracy}%</p>
                        </div>
                      ))}
                  </div>
                  {state.topics.filter(t => t.status === 'mastered').length > 6 && (
                    <p className="text-[10px] text-slate-500 text-center pt-1">
                      +{state.topics.filter(t => t.status === 'mastered').length - 6} more mastered
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Padding for scrollable area */}
        <div className="h-3" />
      </div>
    </div>
  );
}
