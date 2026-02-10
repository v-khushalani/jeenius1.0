/**
 * Week Strip — 7-day horizontal selector (top of planner)
 */
import { cn } from '@/lib/utils';
import type { DayPlan } from '@/lib/ai-planner/types';

interface WeekStripProps {
  weekPlan: DayPlan[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function WeekStrip({ weekPlan, selectedIndex, onSelect }: WeekStripProps) {
  return (
    <div className="flex gap-1.5 px-4 py-3 overflow-x-auto scrollbar-hide">
      {weekPlan.map((day, i) => {
        const done = day.tasks.filter(t => t.status === 'completed').length;
        const total = day.tasks.length;
        const pct = total > 0 ? (done / total) * 100 : 0;
        const isSelected = i === selectedIndex;
        const isToday = i === 0;

        return (
          <button
            key={day.date}
            onClick={() => onSelect(i)}
            className={cn(
              'flex flex-col items-center min-w-[3.2rem] py-2 px-1.5 rounded-xl transition-all duration-200',
              isSelected
                ? 'bg-[#013062] text-white shadow-lg shadow-[#013062]/25 scale-105'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60',
              day.isRestDay && !isSelected && 'opacity-60',
            )}
          >
            <span className={cn('text-[10px] font-medium', isSelected ? 'text-blue-200' : 'text-slate-400')}>
              {isToday ? 'Today' : day.dayShort}
            </span>
            <span className={cn('text-sm font-bold mt-0.5', isSelected ? 'text-white' : 'text-slate-800')}>
              {new Date(day.date).getDate()}
            </span>
            {/* Mini progress ring */}
            <div className="relative w-4 h-4 mt-1">
              <svg className="w-4 h-4 -rotate-90" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="6" fill="none" strokeWidth="2"
                  className={isSelected ? 'stroke-white/20' : 'stroke-slate-200'} />
                <circle cx="8" cy="8" r="6" fill="none" strokeWidth="2"
                  strokeDasharray={`${pct * 0.377} 100`}
                  strokeLinecap="round"
                  className={cn(
                    isSelected ? 'stroke-white' : 'stroke-[#013062]',
                    'transition-all duration-500'
                  )} />
              </svg>
            </div>
          </button>
        );
      })}
    </div>
  );
}
