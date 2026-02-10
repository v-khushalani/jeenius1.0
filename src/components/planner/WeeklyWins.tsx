/**
 * WeeklyWins — Celebrations and milestones from real data
 */

import type { WeeklyWin } from '@/lib/planner/types';

interface Props {
  wins: WeeklyWin[];
}

const winColors: Record<WeeklyWin['type'], string> = {
  mastered: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  improved: 'bg-blue-50 border-blue-200 text-blue-700',
  streak: 'bg-orange-50 border-orange-200 text-orange-700',
  consistency: 'bg-violet-50 border-violet-200 text-violet-700',
  milestone: 'bg-amber-50 border-amber-200 text-amber-700',
};

export function WeeklyWins({ wins }: Props) {
  if (wins.length === 0) return null;

  return (
    <div className="mt-2">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 px-1">
        Your Wins
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {wins.map((win, i) => (
          <div
            key={i}
            className={`rounded-xl border p-3 ${winColors[win.type]}`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg shrink-0">{win.emoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug">{win.title}</p>
                <p className="text-[11px] opacity-75 mt-0.5 line-clamp-2">{win.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
