/**
 * Stats Panel — Subject breakdown, chapter priorities, wins, achievements
 * Expandable bottom section of the planner
 */
import { useState } from 'react';
import { ChevronDown, Trophy, Star, BarChart3, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubjectBreakdown, ChapterPriority, WeeklyWin, Achievement, DailyChallenge } from '@/lib/ai-planner/types';
import { getSubjectStyle } from '@/lib/ai-planner/types';

interface StatsPanelProps {
  subjectBreakdowns: SubjectBreakdown[];
  chapterPriorities: ChapterPriority[];
  weeklyWins: WeeklyWin[];
  achievements: Achievement[];
  dailyChallenge: DailyChallenge | null;
}

export function StatsPanel({ subjectBreakdowns, chapterPriorities, weeklyWins, achievements, dailyChallenge }: StatsPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (key: string) => setExpanded(prev => prev === key ? null : key);

  return (
    <div className="divide-y divide-slate-100">
      {/* Daily Challenge */}
      {dailyChallenge && (
        <div className="px-4 py-3">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{dailyChallenge.icon}</span>
                <div>
                  <p className="text-xs font-bold text-amber-900">{dailyChallenge.title}</p>
                  <p className="text-[10px] text-amber-700">{dailyChallenge.description}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-600">+{dailyChallenge.xpReward} XP</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-amber-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, (dailyChallenge.current / dailyChallenge.target) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Subject Breakdown */}
      <Section
        icon={<BarChart3 className="w-4 h-4 text-[#013062]" />}
        title="Subject Analysis"
        count={`${subjectBreakdowns.length} subjects`}
        expanded={expanded === 'subjects'}
        onToggle={() => toggle('subjects')}
      >
        <div className="space-y-2 px-4 pb-3">
          {subjectBreakdowns.map(s => {
            const style = getSubjectStyle(s.subject);
            const total = s.topicCount;
            const masteredPct = total > 0 ? (s.masteredCount / total) * 100 : 0;
            const strongPct = total > 0 ? (s.strongCount / total) * 100 : 0;

            return (
              <div key={s.subject} className={cn('p-3 rounded-xl border', style.border, style.bg)}>
                <div className="flex items-center justify-between">
                  <span className={cn('text-sm font-bold', style.text)}>{style.icon} {s.subject}</span>
                  <span className={cn('text-xs font-bold', style.text)}>{s.avgAccuracy}%</span>
                </div>
                {/* Stacked progress bar */}
                <div className="w-full h-2 bg-white/60 rounded-full mt-2 overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: `${masteredPct}%` }} />
                  <div className="h-full bg-blue-400" style={{ width: `${strongPct}%` }} />
                  <div className="h-full bg-yellow-400" style={{ width: `${total > 0 ? (s.developingCount / total) * 100 : 0}%` }} />
                  <div className="h-full bg-red-400" style={{ width: `${total > 0 ? (s.weakCount / total) * 100 : 0}%` }} />
                </div>
                <div className="flex gap-3 mt-1.5 text-[9px]">
                  <span className="text-emerald-600">{s.masteredCount} mastered</span>
                  <span className="text-blue-600">{s.strongCount} strong</span>
                  <span className="text-yellow-600">{s.developingCount} developing</span>
                  <span className="text-red-600">{s.weakCount} weak</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Chapter Priorities */}
      <Section
        icon={<BookOpen className="w-4 h-4 text-[#013062]" />}
        title="What to Study Next"
        count={`Top ${Math.min(5, chapterPriorities.length)} chapters`}
        expanded={expanded === 'chapters'}
        onToggle={() => toggle('chapters')}
      >
        <div className="space-y-1.5 px-4 pb-3">
          {chapterPriorities.slice(0, 5).map((ch, i) => {
            const style = getSubjectStyle(ch.subject);
            return (
              <div key={`${ch.subject}-${ch.chapter}`} className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-300 w-4">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{ch.chapter}</p>
                  <p className="text-[10px] text-slate-500">{ch.subject} · {ch.weakTopics}/{ch.totalTopics} weak · {ch.avgAccuracy}%</p>
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${style.color}15` }}>
                  <span className="text-xs font-bold" style={{ color: style.color }}>{ch.score}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Weekly Wins */}
      {weeklyWins.length > 0 && (
        <Section
          icon={<Trophy className="w-4 h-4 text-amber-500" />}
          title="This Week's Wins"
          count={`${weeklyWins.length} wins`}
          expanded={expanded === 'wins'}
          onToggle={() => toggle('wins')}
        >
          <div className="space-y-1.5 px-4 pb-3">
            {weeklyWins.map((w, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
                <span className="text-lg">{w.emoji}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-emerald-900">{w.title}</p>
                  <p className="text-[10px] text-emerald-700">{w.detail}</p>
                </div>
                <span className="text-[10px] font-bold text-amber-600">+{w.xp} XP</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Achievements */}
      <Section
        icon={<Star className="w-4 h-4 text-violet-500" />}
        title="Achievements"
        count={`${achievements.filter(a => a.unlockedAt).length}/${achievements.length} unlocked`}
        expanded={expanded === 'achievements'}
        onToggle={() => toggle('achievements')}
      >
        <div className="grid grid-cols-3 gap-2 px-4 pb-3">
          {achievements.map(a => {
            const unlocked = !!a.unlockedAt;
            const rarityColor = a.rarity === 'legendary' ? 'ring-amber-400 bg-amber-50' :
              a.rarity === 'epic' ? 'ring-violet-400 bg-violet-50' :
              a.rarity === 'rare' ? 'ring-blue-400 bg-blue-50' :
              'ring-slate-300 bg-slate-50';

            return (
              <div
                key={a.id}
                className={cn(
                  'flex flex-col items-center p-2 rounded-xl border text-center transition-all',
                  unlocked ? `ring-2 ${rarityColor}` : 'bg-slate-100 opacity-40 grayscale',
                )}
              >
                <span className="text-xl">{a.icon}</span>
                <p className="text-[9px] font-bold text-slate-800 mt-1 leading-tight">{a.title}</p>
                <p className="text-[8px] text-slate-500">{a.description}</p>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

// Reusable accordion section
function Section({ icon, title, count, expanded, onToggle, children }: {
  icon: React.ReactNode; title: string; count: string;
  expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div>
      <button onClick={onToggle} className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-2">
          {icon}
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900">{title}</p>
            <p className="text-[10px] text-slate-500">{count}</p>
          </div>
        </div>
        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', expanded && 'rotate-180')} />
      </button>
      {expanded && children}
    </div>
  );
}
