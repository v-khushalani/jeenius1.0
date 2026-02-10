/**
 * TaskItem — Single checkable task in the daily plan
 * Premium to-do feel with smooth interactions.
 */

import { Check, Clock, BookOpen, RefreshCw, Zap, Coffee } from 'lucide-react';
import { getSubjectConfig } from '@/lib/planner/types';
import type { PlannerTask } from '@/lib/planner/types';

interface Props {
  task: PlannerTask;
  onToggle: (id: string) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  study: <BookOpen className="h-3 w-3" />,
  revision: <RefreshCw className="h-3 w-3" />,
  practice: <Zap className="h-3 w-3" />,
  mock_test: <Clock className="h-3 w-3" />,
  break: <Coffee className="h-3 w-3" />,
};

const typeLabels: Record<string, string> = {
  study: 'Study',
  revision: 'Revision',
  practice: 'Practice',
  mock_test: 'Mock Test',
  break: 'Break',
};

const priorityDot: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
  low: 'bg-green-400',
};

export function TaskItem({ task, onToggle }: Props) {
  const isDone = task.status === 'completed';
  const config = getSubjectConfig(task.subject);

  return (
    <button
      onClick={() => onToggle(task.id)}
      className={`w-full text-left group transition-all duration-200 rounded-xl border p-3.5 ${
        isDone
          ? 'bg-slate-50 border-slate-100 opacity-70'
          : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm active:scale-[0.99]'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
          isDone
            ? 'bg-[#013062] border-[#013062]'
            : 'border-slate-300 group-hover:border-[#013062]/50'
        }`}>
          {isDone && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Subject + type badges */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.text}`}>
              {config.icon} {task.subject}
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
              {typeIcons[task.type]} {typeLabels[task.type]}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[task.priority]}`} />
          </div>

          {/* Topic name */}
          <p className={`text-sm font-medium leading-snug ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {task.topic || task.chapter}
          </p>

          {/* Reason */}
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
            {task.reason}
          </p>
        </div>

        {/* Time + questions */}
        <div className="shrink-0 text-right">
          <p className={`text-xs font-semibold tabular-nums ${isDone ? 'text-slate-400' : 'text-slate-600'}`}>
            {task.allocatedMinutes}m
          </p>
          <p className="text-[10px] text-slate-400">
            {task.questionsTarget}Q
          </p>
        </div>
      </div>
    </button>
  );
}
