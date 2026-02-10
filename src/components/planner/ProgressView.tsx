/**
 * ProgressView — Topic mastery, subject breakdowns, growth insights
 * Everything from real data. Zero fluff.
 */

import { TrendingUp, TrendingDown, Minus, Trophy, AlertCircle } from 'lucide-react';
import { getSubjectConfig } from '@/lib/planner/types';
import type { SubjectBreakdown, TopicInsight, PlannerStats } from '@/lib/planner/types';

interface Props {
  subjectBreakdowns: SubjectBreakdown[];
  topics: TopicInsight[];
  stats: PlannerStats;
}

export function ProgressView({ subjectBreakdowns, topics, stats }: Props) {
  const masteredTopics = topics.filter(t => t.status === 'mastered');
  const weakTopics = topics.filter(t => t.status === 'weak').slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatPill label="Mastered" value={stats.masteredCount} color="bg-emerald-50 text-emerald-700 border-emerald-200" />
        <StatPill label="Strong" value={stats.strongCount} color="bg-blue-50 text-blue-700 border-blue-200" />
        <StatPill label="Improving" value={stats.improvingCount} color="bg-amber-50 text-amber-700 border-amber-200" />
        <StatPill label="Weak" value={stats.weakCount} color="bg-red-50 text-red-700 border-red-200" />
      </div>

      {/* Overall mastery bar */}
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-700">Overall Mastery</p>
          <p className="text-sm font-bold text-[#013062]">{stats.avgAccuracy}%</p>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#013062] to-[#0261cc] transition-all duration-700"
            style={{ width: `${stats.avgAccuracy}%` }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-slate-400">0%</span>
          <span className="text-[10px] text-slate-400">Target: 80%</span>
          <span className="text-[10px] text-slate-400">100%</span>
        </div>
      </div>

      {/* Subject cards */}
      {subjectBreakdowns.map(subject => (
        <SubjectCard key={subject.subject} data={subject} />
      ))}

      {/* Mastered topics */}
      {masteredTopics.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-semibold text-slate-700">Topics Mastered</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
              {masteredTopics.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {masteredTopics.map((t, i) => {
              const config = getSubjectConfig(t.subject);
              return (
                <span key={i} className={`text-[11px] px-2 py-1 rounded-lg border ${config.bg} ${config.text} ${config.border}`}>
                  {t.topic} ({t.accuracy}%)
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Needs attention */}
      {weakTopics.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm font-semibold text-slate-700">Needs Focus</p>
          </div>
          <div className="space-y-2">
            {weakTopics.map((t, i) => {
              const config = getSubjectConfig(t.subject);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${config.bg} ${config.text}`}>
                    {config.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{t.topic}</p>
                    <p className="text-[10px] text-slate-400">{t.chapter}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${t.accuracy}%` }} />
                    </div>
                    <span className="text-xs font-medium text-red-600 tabular-nums w-8 text-right">{t.accuracy}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string; }) {
  return (
    <div className={`rounded-xl border p-3 text-center ${color}`}>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider opacity-75">{label}</p>
    </div>
  );
}

function SubjectCard({ data }: { data: SubjectBreakdown }) {
  const config = getSubjectConfig(data.subject);
  const topWeak = data.topics.filter(t => t.status === 'weak').slice(0, 3);
  const topStrong = data.topics.filter(t => t.status === 'mastered' || t.status === 'strong').slice(0, 3);

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      {/* Header with accent */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <p className="text-sm font-semibold text-slate-700">{data.subject}</p>
          <span className="text-[10px] text-slate-400">{data.topicCount} topics</span>
        </div>
        <span className={`text-lg font-bold ${config.text}`}>{data.avgAccuracy}%</span>
      </div>

      {/* Accuracy bar */}
      <div className="px-4 pb-3">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${data.avgAccuracy}%`, backgroundColor: config.color }} />
        </div>
      </div>

      {/* Topic breakdown */}
      <div className="px-4 pb-3 grid grid-cols-4 gap-2 text-center">
        <MiniStat label="Mastered" value={data.masteredCount} />
        <MiniStat label="Strong" value={data.strongCount} />
        <MiniStat label="Improving" value={data.improvingCount} />
        <MiniStat label="Weak" value={data.weakCount} />
      </div>

      {/* Quick insights */}
      {(topWeak.length > 0 || topStrong.length > 0) && (
        <div className="px-4 pb-3 border-t border-slate-50 pt-2 space-y-1.5">
          {topWeak.length > 0 && (
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3 w-3 text-red-400 shrink-0" />
              <p className="text-[11px] text-slate-500 truncate">
                Focus: {topWeak.map(t => t.topic).join(', ')}
              </p>
            </div>
          )}
          {topStrong.length > 0 && (
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0" />
              <p className="text-[11px] text-slate-500 truncate">
                Strong: {topStrong.map(t => t.topic).join(', ')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number; }) {
  return (
    <div>
      <p className="text-sm font-bold text-slate-700 tabular-nums">{value}</p>
      <p className="text-[9px] text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
  );
}
