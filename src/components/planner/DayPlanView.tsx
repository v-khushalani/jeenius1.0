/**
 * Day Plan View — Tasks grouped by time slot
 */
import { Sun, Cloud, Moon, Coffee } from 'lucide-react';
import type { DayPlan } from '@/lib/ai-planner/types';
import { TaskCard } from './TaskCard';

const SLOT_CONFIG = {
  morning: { label: 'Morning', icon: Sun, color: 'text-amber-500' },
  afternoon: { label: 'Afternoon', icon: Cloud, color: 'text-blue-500' },
  evening: { label: 'Evening', icon: Moon, color: 'text-indigo-500' },
} as const;

interface DayPlanViewProps {
  plan: DayPlan;
  onToggleTask: (id: string) => void;
  isViewOnly?: boolean;
}

export function DayPlanView({ plan, onToggleTask, isViewOnly }: DayPlanViewProps) {
  if (plan.isRestDay) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#013062]/10 flex items-center justify-center mb-3">
          <Coffee className="w-7 h-7 text-[#013062]" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Rest Day</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-xs">
          Recharge today. Growth happens during rest.
          {plan.tasks.length > 0 && ' A few light tasks available if you feel like it.'}
        </p>
        {plan.tasks.length > 0 && (
          <div className="w-full mt-4 space-y-2 max-w-md">
            {plan.tasks.map(task => (
              <TaskCard key={task.id} task={task} onToggle={onToggleTask} isViewOnly={isViewOnly} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const slots = (['morning', 'afternoon', 'evening'] as const)
    .map(slot => ({
      slot,
      config: SLOT_CONFIG[slot],
      tasks: plan.tasks.filter(t => t.timeSlot === slot),
    }))
    .filter(s => s.tasks.length > 0);

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-slate-500">No tasks scheduled for this day.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pb-4">
      {slots.map(({ slot, config, tasks }) => {
        const Icon = config.icon;
        const done = tasks.filter(t => t.status === 'completed').length;
        return (
          <div key={slot}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${config.color}`} />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {config.label}
              </span>
              <span className="text-[10px] text-slate-400 ml-auto">
                {done}/{tasks.length} done
              </span>
            </div>
            <div className="space-y-2">
              {tasks.map(task => (
                <TaskCard key={task.id} task={task} onToggle={onToggleTask} isViewOnly={isViewOnly} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
