/**
 * Task Card — Individual study task with checkbox, subject badge, XP
 */
import { cn } from '@/lib/utils';
import { Check, Zap } from 'lucide-react';
import type { PlannerTask } from '@/lib/ai-planner/types';
import { getSubjectStyle } from '@/lib/ai-planner/types';

const TYPE_LABELS: Record<string, string> = {
  'deep-study': 'Study',
  'practice': 'Practice',
  'mock-test': 'Mock Test',
  'pyq': 'PYQ',
  'formula-drill': 'Formulas',
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-400',
  medium: 'border-l-yellow-400',
  low: 'border-l-slate-300',
};

interface TaskCardProps {
  task: PlannerTask;
  onToggle: (id: string) => void;
  isViewOnly?: boolean;
}

export function TaskCard({ task, onToggle, isViewOnly }: TaskCardProps) {
  const isDone = task.status === 'completed';
  const style = getSubjectStyle(task.subject);

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 p-3 rounded-xl border-l-[3px] transition-all duration-200',
        'bg-white border border-slate-200/80',
        'hover:shadow-apple hover:border-slate-300/80',
        PRIORITY_STYLES[task.priority],
        isDone && 'opacity-60 bg-slate-50',
      )}
    >
      {/* Checkbox */}
      {!isViewOnly && (
        <button
          onClick={() => onToggle(task.id)}
          className={cn(
            'mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200',
            isDone
              ? 'bg-[#013062] border-[#013062]'
              : 'border-slate-300 hover:border-[#013062] hover:bg-[#013062]/5',
          )}
        >
          {isDone && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </button>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md', style.bg, style.text)}>
            {style.icon} {task.subject.slice(0, 3).toUpperCase()}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">{TYPE_LABELS[task.type] || task.type}</span>
        </div>
        <p className={cn('text-sm font-semibold text-slate-900 mt-1 leading-tight', isDone && 'line-through text-slate-500')}>
          {task.topic}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{task.reason}</p>

        {/* Bottom meta */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] text-slate-400 font-medium">
            {task.allocatedMinutes} min
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {task.questionsTarget} Qs
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {task.accuracy}% acc
          </span>
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 ml-auto">
            <Zap className="w-3 h-3" /> +{task.xpReward} XP
          </span>
        </div>
      </div>
    </div>
  );
}
