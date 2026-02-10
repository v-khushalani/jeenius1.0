/**
 * TodayView — Today tab with checkable tasks, revision due, wins
 */

import { Clock, CheckCircle2 } from 'lucide-react';
import { TaskItem } from './TaskItem';
import { RevisionDue } from './RevisionDue';
import { WeeklyWins } from './WeeklyWins';
import type { DayPlan, RevisionItem, WeeklyWin } from '@/lib/planner/types';

interface Props {
  todayPlan: DayPlan;
  revisionDue: RevisionItem[];
  weeklyWins: WeeklyWin[];
  onToggleTask: (id: string) => void;
}

export function TodayView({ todayPlan, revisionDue, weeklyWins, onToggleTask }: Props) {
  const totalTasks = todayPlan.tasks.length;
  const doneTasks = todayPlan.tasks.filter(t => t.status === 'completed').length;
  const allDone = totalTasks > 0 && doneTasks === totalTasks;

  const morningTasks = todayPlan.tasks.filter(t => t.timeSlot === 'morning');
  const afternoonTasks = todayPlan.tasks.filter(t => t.timeSlot === 'afternoon');
  const eveningTasks = todayPlan.tasks.filter(t => t.timeSlot === 'evening');

  if (todayPlan.isRestDay && todayPlan.tasks.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-4xl mb-3">😴</p>
        <p className="text-lg font-semibold text-slate-700">Rest Day</p>
        <p className="text-sm text-slate-500 mt-1">Recovery is part of the strategy. Come back stronger tomorrow.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock className="h-4 w-4 text-slate-400" />
          <span className="font-medium">
            {todayPlan.totalMinutes - todayPlan.completedMinutes}m remaining
          </span>
          <span className="text-slate-300">·</span>
          <span>{doneTasks}/{totalTasks} tasks</span>
        </div>
        {allDone && (
          <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            All done!
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#013062] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0}%` }}
        />
      </div>

      {/* Task sections by time slot */}
      {morningTasks.length > 0 && (
        <TaskSection label="Morning" emoji="🌅" tasks={morningTasks} onToggle={onToggleTask} />
      )}
      {afternoonTasks.length > 0 && (
        <TaskSection label="Afternoon" emoji="☀️" tasks={afternoonTasks} onToggle={onToggleTask} />
      )}
      {eveningTasks.length > 0 && (
        <TaskSection label="Evening" emoji="🌙" tasks={eveningTasks} onToggle={onToggleTask} />
      )}

      {/* Rest day tasks (not slotted) */}
      {todayPlan.isRestDay && todayPlan.tasks.length > 0 && (
        <TaskSection label="Light Revision" emoji="📖" tasks={todayPlan.tasks} onToggle={onToggleTask} />
      )}

      {/* Revision Due */}
      {revisionDue.length > 0 && <RevisionDue items={revisionDue} />}

      {/* Weekly Wins */}
      {weeklyWins.length > 0 && <WeeklyWins wins={weeklyWins} />}
    </div>
  );
}

function TaskSection({ label, emoji, tasks, onToggle }: {
  label: string; emoji: string; tasks: DayPlan['tasks']; onToggle: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 px-1">
        {emoji} {label}
      </p>
      <div className="space-y-2">
        {tasks.map(task => (
          <TaskItem key={task.id} task={task} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}
