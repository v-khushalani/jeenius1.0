/**
 * RevisionDue — Spaced repetition items based on forgetting curve
 */

import { AlertTriangle, Clock } from 'lucide-react';
import { getSubjectConfig } from '@/lib/planner/types';
import type { RevisionItem } from '@/lib/planner/types';

interface Props {
  items: RevisionItem[];
}

const urgencyStyles = {
  overdue: { border: 'border-l-red-500', bg: 'bg-red-50/50', label: 'Overdue', color: 'text-red-600' },
  due: { border: 'border-l-amber-500', bg: 'bg-amber-50/50', label: 'Due', color: 'text-amber-600' },
  upcoming: { border: 'border-l-blue-500', bg: 'bg-blue-50/30', label: 'Soon', color: 'text-blue-600' },
};

export function RevisionDue({ items }: Props) {
  if (items.length === 0) return null;

  const overdueCount = items.filter(i => i.urgency === 'overdue').length;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-2 px-1">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Revision Due
        </span>
        {overdueCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
            {overdueCount} overdue
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {items.slice(0, 5).map((item, i) => {
          const style = urgencyStyles[item.urgency];
          const config = getSubjectConfig(item.subject);

          return (
            <div
              key={`${item.subject}-${item.topic}-${i}`}
              className={`rounded-lg border border-l-[3px] ${style.border} ${style.bg} p-2.5 flex items-center gap-3`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.text}`}>
                    {config.icon} {item.subject}
                  </span>
                  <span className={`text-[10px] font-medium ${style.color}`}>{style.label}</span>
                </div>
                <p className="text-sm font-medium text-slate-700 truncate">{item.topic}</p>
              </div>

              <div className="shrink-0 text-right">
                <div className="flex items-center gap-1 text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span className="text-[11px]">{item.daysSince}d ago</span>
                </div>
                <div className="mt-0.5 h-1 w-12 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.forgettingRisk > 70 ? 'bg-red-500' :
                      item.forgettingRisk > 40 ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${item.forgettingRisk}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
