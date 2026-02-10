/**
 * WeekView — 7-day strip with daily plan summaries and weekly targets
 */

import { getSubjectConfig } from '@/lib/planner/types';
import type { DayPlan } from '@/lib/planner/types';

interface Props {
  weekPlan: DayPlan[];
}

export function WeekView({ weekPlan }: Props) {
  if (weekPlan.length === 0) return null;

  // Aggregate subjects across the week
  const subjectMins = new Map<string, number>();
  for (const day of weekPlan) {
    for (const task of day.tasks) {
      subjectMins.set(task.subject, (subjectMins.get(task.subject) || 0) + task.allocatedMinutes);
    }
  }
  const totalWeekMins = Array.from(subjectMins.values()).reduce((s, v) => s + v, 0);

  // Unique topics scheduled this week
  const weekTopics = new Set<string>();
  for (const day of weekPlan) {
    for (const task of day.tasks) {
      weekTopics.add(`${task.subject}::${task.topic}`);
    }
  }

  return (
    <div className="space-y-4">
      {/* 7-day strip */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekPlan.map((day, i) => {
          const pct = day.totalMinutes > 0 && day.completedMinutes > 0
            ? Math.round((day.completedMinutes / day.totalMinutes) * 100) : 0;
          const taskCount = day.tasks.length;
          const doneCount = day.tasks.filter(t => t.status === 'completed').length;

          return (
            <div
              key={day.date}
              className={`rounded-xl p-2.5 text-center transition-all ${
                day.isToday
                  ? 'bg-[#013062] text-white ring-2 ring-[#013062]/30 ring-offset-2'
                  : day.isRestDay
                    ? 'bg-slate-50 border border-slate-100'
                    : 'bg-white border border-slate-100'
              }`}
            >
              <p className={`text-[10px] font-medium uppercase tracking-wider ${
                day.isToday ? 'text-white/60' : 'text-slate-400'
              }`}>
                {day.dayShort}
              </p>

              {/* Progress circle */}
              <div className="my-1.5 flex justify-center">
                <DayCircle
                  percent={pct}
                  isToday={day.isToday}
                  isRest={day.isRestDay}
                  taskCount={taskCount}
                  doneCount={doneCount}
                />
              </div>

              <p className={`text-[10px] tabular-nums ${
                day.isToday ? 'text-white/70' : 'text-slate-400'
              }`}>
                {day.isRestDay ? 'Rest' : `${day.totalMinutes}m`}
              </p>
            </div>
          );
        })}
      </div>

      {/* Weekly summary */}
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-700">This Week</p>
          <p className="text-xs text-slate-400">{weekTopics.size} topics · {Math.round(totalWeekMins / 60)}h planned</p>
        </div>

        {/* Subject distribution */}
        <div className="space-y-2.5">
          {Array.from(subjectMins.entries()).map(([subject, mins]) => {
            const config = getSubjectConfig(subject);
            const pct = totalWeekMins > 0 ? Math.round((mins / totalWeekMins) * 100) : 0;
            const hours = (mins / 60).toFixed(1);

            return (
              <div key={subject}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${config.text}`}>
                    {config.icon} {subject}
                  </span>
                  <span className="text-[11px] text-slate-400">{hours}h · {pct}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: config.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily breakdown cards */}
      <div className="space-y-2">
        {weekPlan.filter(d => !d.isRestDay).map(day => (
          <DayCard key={day.date} day={day} />
        ))}
      </div>
    </div>
  );
}

function DayCircle({ percent, isToday, isRest, taskCount, doneCount }: {
  percent: number; isToday: boolean; isRest: boolean; taskCount: number; doneCount: number;
}) {
  const size = 32;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  if (isRest) {
    return (
      <div className="w-8 h-8 flex items-center justify-center">
        <span className="text-sm">😴</span>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          strokeWidth={stroke}
          className={isToday ? 'stroke-white/20' : 'stroke-slate-100'} />
        {percent > 0 && (
          <circle cx={size/2} cy={size/2} r={radius} fill="none"
            strokeWidth={stroke} strokeLinecap="round"
            className={isToday ? 'stroke-white' : 'stroke-[#013062]'}
            strokeDasharray={circumference} strokeDashoffset={offset} />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-[9px] font-bold ${isToday ? 'text-white' : 'text-slate-600'}`}>
          {doneCount}/{taskCount}
        </span>
      </div>
    </div>
  );
}

function DayCard({ day }: { day: DayPlan }) {
  const subjects = [...new Set(day.tasks.map(t => t.subject))];

  return (
    <div className={`rounded-xl border p-3 ${
      day.isToday ? 'border-[#013062]/20 bg-[#013062]/[0.02]' : 'border-slate-100 bg-white'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${day.isToday ? 'text-[#013062]' : 'text-slate-700'}`}>
            {day.dayName}
          </span>
          {day.isToday && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#013062] text-white font-medium">
              Today
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400">
          {day.tasks.length} tasks · {day.totalMinutes}m
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        {day.tasks.map(task => {
          const config = getSubjectConfig(task.subject);
          return (
            <span
              key={task.id}
              className={`text-[10px] px-1.5 py-0.5 rounded ${config.bg} ${config.text} ${
                task.status === 'completed' ? 'line-through opacity-50' : ''
              }`}
            >
              {task.topic.length > 20 ? task.topic.slice(0, 18) + '…' : task.topic}
            </span>
          );
        })}
      </div>
    </div>
  );
}
