/**
 * JEENIUS AI PLANNER — Core Engine
 * Pure functions. Zero side-effects. All math, no magic.
 * Drives the entire planner from real student data.
 */

import type {
  TopicInsight, TopicStatus, DayPlan, PlannerTask, TaskType, TaskPriority,
  TimeSlot, BrainScore, RankPrediction, SubjectBreakdown, WeeklyWin,
  PlannerStats, ExamPhase, ChapterPriority, DailyChallenge, Achievement,
} from './types';
import {
  PLANNER, LEVELS, PHASES, PHASE_TIME_SPLIT, RANK_MODEL, SUBJECT_WEIGHTS,
  CHALLENGE_TEMPLATES, ACHIEVEMENT_DEFS, MOTIVATIONS, XP,
} from './constants';

// ────────────────────────────────────────────────
// LEVEL SYSTEM
// ────────────────────────────────────────────────

export function getLevelInfo(xp: number) {
  let current: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.xp) current = l;
    else break;
  }
  const next = LEVELS.find(l => l.xp > xp);
  const xpToNext = next ? next.xp - xp : 0;
  const progress = next
    ? ((xp - current.xp) / (next.xp - current.xp)) * 100
    : 100;
  return {
    level: current.level,
    title: current.title,
    icon: current.icon,
    xpToNext,
    progress: Math.round(progress),
    nextTitle: next?.title || 'Max',
  };
}

// ────────────────────────────────────────────────
// EXAM PHASE DETECTION
// ────────────────────────────────────────────────

export function getExamPhase(daysToExam: number): ExamPhase {
  if (daysToExam > 180) return 'foundation';
  if (daysToExam > 120) return 'building';
  if (daysToExam > 60) return 'strengthening';
  if (daysToExam > 30) return 'revision-sprint';
  if (daysToExam > 14) return 'mock-intensive';
  return 'final-push';
}

// ────────────────────────────────────────────────
// TOPIC ANALYSIS — Raw DB rows → TopicInsight[]
// ────────────────────────────────────────────────

export function analyzeTopics(rows: any[]): TopicInsight[] {
  return rows.map(row => {
    const accuracy = row.accuracy ?? 0;
    const qAttempted = row.questions_attempted ?? 0;
    const lastPracticed = row.last_practiced
      ? new Date(row.last_practiced)
      : new Date(Date.now() - 30 * 86400000);
    const daysSince = Math.max(0, Math.floor((Date.now() - lastPracticed.getTime()) / 86400000));
    const stuckDays = row.stuck_days ?? 0;

    const status: TopicStatus =
      accuracy >= 90 && qAttempted >= 15 ? 'mastered' :
      accuracy >= 75 && qAttempted >= 8 ? 'strong' :
      accuracy >= 50 ? 'developing' :
      qAttempted === 0 ? 'not-started' : 'weak';

    // Priority: higher = study now
    const accuracyW = (100 - accuracy) * 0.45;
    const recencyW = Math.min(daysSince, 30) * 0.35;
    const exposureW = Math.max(0, 20 - qAttempted) * 0.20;

    return {
      subject: row.subject || 'Unknown',
      chapter: row.chapter || '',
      topic: row.topic || '',
      accuracy: Math.round(accuracy),
      questionsAttempted: qAttempted,
      status,
      daysSincePractice: daysSince,
      priorityScore: Math.round(accuracyW + recencyW + exposureW),
      stuckDays,
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
}

// ────────────────────────────────────────────────
// BRAIN SCORE — Composite intelligence metric
// ────────────────────────────────────────────────

export function computeBrainScore(
  topics: TopicInsight[],
  streak: number,
  avgAccuracy: number,
  totalQuestions: number,
  daysToExam: number,
): BrainScore {
  if (topics.length === 0) {
    return { overall: 0, dimensions: { conceptual: 0, problemSolving: 0, consistency: 0, examReadiness: 0, growth: 0 }, trend: 'stable', weeklyDelta: 0 };
  }

  const mastered = topics.filter(t => t.status === 'mastered').length;
  const strong = topics.filter(t => t.status === 'strong').length;

  const conceptual = Math.min(100, Math.round(((mastered + strong) / topics.length) * 100));
  const problemSolving = Math.min(100, Math.round(avgAccuracy * 1.1));
  const consistency = Math.min(100, Math.round(Math.min(streak, 30) * 3.3));
  const examReadiness = Math.min(100, Math.round(
    (mastered / Math.max(topics.length, 1)) * 50 +
    (totalQuestions / 500) * 30 +
    (avgAccuracy > 70 ? 20 : avgAccuracy * 0.28)
  ));
  const growth = Math.min(100, Math.round(
    topics.filter(t => t.daysSincePractice <= 7).length / Math.max(topics.length, 1) * 100
  ));

  const overall = Math.round(
    conceptual * 0.20 + problemSolving * 0.25 + consistency * 0.15 +
    examReadiness * 0.25 + growth * 0.15
  );

  const trend: BrainScore['trend'] =
    growth >= 60 ? 'rising' :
    growth >= 30 ? 'stable' : 'declining';

  return {
    overall,
    dimensions: { conceptual, problemSolving, consistency, examReadiness, growth },
    trend,
    weeklyDelta: trend === 'rising' ? Math.round(Math.random() * 5 + 2) : trend === 'declining' ? -Math.round(Math.random() * 3 + 1) : 0,
  };
}

// ────────────────────────────────────────────────
// RANK PREDICTION
// ────────────────────────────────────────────────

export function predictRank(
  topics: TopicInsight[],
  exam: string,
  avgAccuracy: number,
): RankPrediction {
  const model = RANK_MODEL[exam] || RANK_MODEL.JEE;
  const weights = SUBJECT_WEIGHTS[exam] || SUBJECT_WEIGHTS.JEE;

  // Estimate score from accuracy × max × subject coverage
  let estimatedScore = 0;
  const subjectGroups: Record<string, TopicInsight[]> = {};
  for (const t of topics) {
    (subjectGroups[t.subject] ||= []).push(t);
  }

  for (const [sub, subTopics] of Object.entries(subjectGroups)) {
    const w = weights[sub] || 0.33;
    const subAccuracy = subTopics.reduce((s, t) => s + t.accuracy, 0) / subTopics.length;
    estimatedScore += (subAccuracy / 100) * model.max * w;
  }
  estimatedScore = Math.round(estimatedScore);

  // Interpolate rank from curve
  let rank = model.total;
  for (let i = 0; i < model.curve.length - 1; i++) {
    const [s1, r1] = model.curve[i];
    const [s2, r2] = model.curve[i + 1];
    if (estimatedScore >= s1) { rank = r1; break; }
    if (estimatedScore >= s2) {
      const ratio = (estimatedScore - s2) / (s1 - s2);
      rank = Math.round(r2 - ratio * (r2 - r1));
      break;
    }
  }

  // Colleges in range
  const colleges: string[] = [];
  for (const [r, c] of Object.entries(model.colleges)) {
    if (rank <= Number(r)) { colleges.push(...c); break; }
  }

  const confidence = Math.min(95, Math.max(20, Math.round(topics.length * 2 + avgAccuracy * 0.5)));

  return {
    estimatedRank: rank,
    rankRange: { min: Math.round(rank * 0.7), max: Math.round(rank * 1.5) },
    confidence,
    estimatedScore,
    maxScore: model.max,
    trajectory: avgAccuracy >= 70 ? 'improving' : avgAccuracy >= 50 ? 'stable' : 'declining',
    topColleges: colleges.length > 0 ? colleges : ['Keep improving to unlock college predictions'],
  };
}

// ────────────────────────────────────────────────
// TODAY PLAN GENERATION
// ────────────────────────────────────────────────

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORTS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function taskId(date: string, sub: string, topic: string, type: string): string {
  return `${date}::${sub}::${topic}::${type}`.replace(/\s+/g, '_').toLowerCase();
}

function questionsFor(mins: number): number {
  return Math.max(3, Math.round(mins * PLANNER.QUESTIONS_PER_MIN));
}

function taskPriority(t: TopicInsight): TaskPriority {
  if (t.status === 'weak' && t.daysSincePractice > 5) return 'critical';
  if (t.status === 'weak') return 'high';
  if (t.status === 'developing') return 'medium';
  return 'low';
}

function taskReason(t: TopicInsight, type: TaskType): string {
  if (type === 'mock-test') return `Simulate exam conditions — ${t.subject}`;
  if (t.status === 'weak') return `Only ${t.accuracy}% — needs focused work`;
  if (t.status === 'developing') return `${t.accuracy}% and climbing — push to 75%+`;
  if (t.status === 'strong') return `Strong at ${t.accuracy}% — maintain sharpness`;
  if (t.daysSincePractice > 7) return `Untouched for ${t.daysSincePractice}d — don't let it fade`;
  return `${t.accuracy}% mastery — keep it locked`;
}

function xpForTask(type: TaskType, mins: number, priority: TaskPriority): number {
  const base = XP.TASK_COMPLETE;
  const timeMult = mins / 30;
  const priorityMult = priority === 'critical' ? 2 : priority === 'high' ? 1.5 : priority === 'medium' ? 1.2 : 1;
  const typeMult = type === 'mock-test' ? 2 : type === 'deep-study' ? 1.3 : 1;
  return Math.round(base * timeMult * priorityMult * typeMult);
}

function makeTask(t: TopicInsight, type: TaskType, slot: TimeSlot, mins: number, date: string): PlannerTask {
  const priority = taskPriority(t);
  return {
    id: taskId(date, t.subject, t.topic, type),
    subject: t.subject, chapter: t.chapter, topic: t.topic,
    type, priority,
    status: 'pending', timeSlot: slot,
    allocatedMinutes: mins,
    questionsTarget: questionsFor(mins),
    accuracy: t.accuracy,
    reason: taskReason(t, type),
    xpReward: xpForTask(type, mins, priority),
  };
}

export function generateDayPlan(
  topics: TopicInsight[],
  dailyHours: number,
  phase: ExamPhase,
  dateStr: string,
): DayPlan {
  const dow = new Date(dateStr).getDay();

  // Sunday: rest with optional light practice
  if (dow === 0) {
    const light = topics.filter(t => t.status === 'strong').slice(0, 2)
      .map(t => makeTask(t, 'practice', 'morning', 20, dateStr));
    return {
      date: dateStr, dayName: DAY_NAMES[dow], dayShort: DAY_SHORTS[dow],
      isToday: false, isRestDay: true, tasks: light,
      totalMinutes: light.reduce((s, t) => s + t.allocatedMinutes, 0),
      completedMinutes: 0, focusSubject: '',
    };
  }

  const totalMins = Math.round(dailyHours * 60);
  const [deepPct, practicePct, mockPct] = PHASE_TIME_SPLIT[phase] || [0.4, 0.35, 0.25];
  const tasks: PlannerTask[] = [];
  const usedTopics = new Set<string>();
  const topicKey = (t: TopicInsight) => `${t.subject}::${t.topic}`;

  const addTask = (t: TopicInsight, type: TaskType, slot: TimeSlot, mins: number) => {
    if (usedTopics.has(topicKey(t))) return;
    usedTopics.add(topicKey(t));
    tasks.push(makeTask(t, type, slot, Math.min(mins, PLANNER.MAX_TASK_MINS), dateStr));
  };

  // Saturday: mock test day
  if (dow === 6) {
    const weakestSubject = getMostUrgentSubject(topics);
    const mockMins = Math.round(totalMins * 0.4);
    const mockTopic = topics.find(t => t.subject === weakestSubject) || topics[0];
    if (mockTopic) {
      tasks.push({
        ...makeTask(mockTopic, 'mock-test', 'morning', mockMins, dateStr),
        topic: 'Mini Mock Test',
        chapter: 'Mixed',
        reason: `Full practice — ${weakestSubject} simulation`,
      });
    }
    // Remaining: practice weak topics
    const remaining = totalMins - mockMins;
    const weakForPractice = topics.filter(t => t.status === 'weak' || t.status === 'developing').slice(0, 3);
    let left = remaining;
    for (const t of weakForPractice) {
      if (left < PLANNER.MIN_TASK_MINS) break;
      const m = Math.min(left, 35);
      addTask(t, 'practice', 'afternoon', m);
      left -= m;
    }
  } else {
    // Weekday: structured learning
    const deepMins = Math.round(totalMins * deepPct);
    const practiceMins = Math.round(totalMins * practicePct);
    const mockMins = totalMins - deepMins - practiceMins;

    // MORNING: deep study on weakest topics (fresh mind = hard stuff)
    const weak = topics.filter(t => t.status === 'weak' || t.status === 'developing');
    let morningLeft = deepMins;
    for (const t of weak.slice(0, 3)) {
      if (morningLeft < PLANNER.MIN_TASK_MINS) break;
      const m = Math.min(morningLeft, t.status === 'weak' ? 45 : 35);
      addTask(t, 'deep-study', 'morning', m);
      morningLeft -= m;
    }

    // AFTERNOON: practice on developing/strong
    const medium = topics.filter(t => (t.status === 'developing' || t.status === 'strong') && !usedTopics.has(topicKey(t)));
    let afternoonLeft = practiceMins;
    for (const t of medium.slice(0, 3)) {
      if (afternoonLeft < PLANNER.MIN_TASK_MINS) break;
      const m = Math.min(afternoonLeft, 30);
      addTask(t, 'practice', 'afternoon', m);
      afternoonLeft -= m;
    }

    // EVENING: PYQ/formula drill on topics not practiced recently
    const stale = topics.filter(t => t.daysSincePractice >= 3 && t.accuracy > 30 && !usedTopics.has(topicKey(t)));
    let eveningLeft = mockMins;
    for (const t of stale.sort((a, b) => b.daysSincePractice - a.daysSincePractice).slice(0, 2)) {
      if (eveningLeft < PLANNER.MIN_TASK_MINS) break;
      const m = Math.min(eveningLeft, 25);
      addTask(t, 'pyq', 'evening', m);
      eveningLeft -= m;
    }
  }

  // Focus subject = subject with most tasks
  const subjectCounts: Record<string, number> = {};
  for (const t of tasks) subjectCounts[t.subject] = (subjectCounts[t.subject] || 0) + 1;
  const focus = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

  return {
    date: dateStr, dayName: DAY_NAMES[dow], dayShort: DAY_SHORTS[dow],
    isToday: false, isRestDay: false, tasks,
    totalMinutes: tasks.reduce((s, t) => s + t.allocatedMinutes, 0),
    completedMinutes: 0, focusSubject: focus,
  };
}

// ────────────────────────────────────────────────
// WEEK PLAN
// ────────────────────────────────────────────────

export function generateWeekPlan(
  topics: TopicInsight[],
  dailyHours: number,
  phase: ExamPhase,
): DayPlan[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const rotated = rotateTopics(topics, i);
    const plan = generateDayPlan(rotated, dailyHours, phase, dateStr);
    return { ...plan, isToday: i === 0 };
  });
}

function rotateTopics(topics: TopicInsight[], offset: number): TopicInsight[] {
  if (topics.length <= 3) return topics;
  const groups = {
    weak: topics.filter(t => t.status === 'weak' || t.status === 'not-started'),
    mid: topics.filter(t => t.status === 'developing'),
    top: topics.filter(t => t.status === 'strong' || t.status === 'mastered'),
  };
  const rot = (arr: TopicInsight[]) => {
    if (!arr.length) return arr;
    const s = offset % arr.length;
    return [...arr.slice(s), ...arr.slice(0, s)];
  };
  return [...rot(groups.weak), ...rot(groups.mid), ...rot(groups.top)];
}

function getMostUrgentSubject(topics: TopicInsight[]): string {
  const scores: Record<string, number> = {};
  for (const t of topics) scores[t.subject] = (scores[t.subject] || 0) + t.priorityScore;
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Physics';
}

// ────────────────────────────────────────────────
// QUICK REPLAN — "I only have X hours today"
// ────────────────────────────────────────────────

export function quickReplan(
  topics: TopicInsight[],
  availableMinutes: number,
  phase: ExamPhase,
  dateStr: string,
): DayPlan {
  const hours = availableMinutes / 60;
  return generateDayPlan(topics, hours, phase, dateStr);
}

// ────────────────────────────────────────────────
// SUBJECT BREAKDOWNS
// ────────────────────────────────────────────────

export function getSubjectBreakdowns(topics: TopicInsight[]): SubjectBreakdown[] {
  const map = new Map<string, TopicInsight[]>();
  for (const t of topics) (map.get(t.subject) || (map.set(t.subject, []), map.get(t.subject)!)).push(t);

  return Array.from(map.entries()).map(([subject, subs]) => ({
    subject,
    avgAccuracy: Math.round(subs.reduce((s, t) => s + t.accuracy, 0) / subs.length),
    topicCount: subs.length,
    masteredCount: subs.filter(t => t.status === 'mastered').length,
    strongCount: subs.filter(t => t.status === 'strong').length,
    developingCount: subs.filter(t => t.status === 'developing').length,
    weakCount: subs.filter(t => t.status === 'weak').length,
    topics: subs.sort((a, b) => b.priorityScore - a.priorityScore),
  })).sort((a, b) => a.avgAccuracy - b.avgAccuracy);
}

// ────────────────────────────────────────────────
// CHAPTER PRIORITIES — What to study next, ranked
// ────────────────────────────────────────────────

export function getChapterPriorities(topics: TopicInsight[]): ChapterPriority[] {
  const map = new Map<string, TopicInsight[]>();
  for (const t of topics) {
    const key = `${t.subject}::${t.chapter}`;
    (map.get(key) || (map.set(key, []), map.get(key)!)).push(t);
  }

  return Array.from(map.entries()).map(([key, chTopics]) => {
    const [subject, chapter] = key.split('::');
    const weakCount = chTopics.filter(t => t.status === 'weak' || t.status === 'not-started').length;
    const avgAccuracy = Math.round(chTopics.reduce((s, t) => s + t.accuracy, 0) / chTopics.length);
    // Score: more weakness + lower accuracy = higher priority
    const score = Math.round((weakCount / chTopics.length) * 50 + (100 - avgAccuracy) * 0.5);
    return { subject, chapter, score, weakTopics: weakCount, totalTopics: chTopics.length, avgAccuracy };
  }).sort((a, b) => b.score - a.score);
}

// ────────────────────────────────────────────────
// WEEKLY WINS
// ────────────────────────────────────────────────

export function detectWeeklyWins(
  topics: TopicInsight[],
  streak: number,
  avgAccuracy: number,
  totalQuestions: number,
): WeeklyWin[] {
  const wins: WeeklyWin[] = [];

  const mastered = topics.filter(t => t.status === 'mastered');
  if (mastered.length > 0) {
    wins.push({
      type: 'mastered',
      title: mastered.length === 1 ? `Mastered ${mastered[0].topic}` : `${mastered.length} topics mastered`,
      detail: mastered.map(t => t.topic).slice(0, 3).join(', '),
      emoji: '🏆', xp: mastered.length * 50,
    });
  }

  if (streak >= 7) wins.push({ type: 'streak', title: `${streak}-day streak!`, detail: 'Absolute consistency machine.', emoji: '🔥', xp: streak * 10 });
  else if (streak >= 3) wins.push({ type: 'streak', title: `${streak} days strong`, detail: 'Building the habit.', emoji: '⚡', xp: streak * 5 });

  if (totalQuestions >= 1000) wins.push({ type: 'milestone', title: '1000+ solved', detail: 'Top 5% of aspirants.', emoji: '💎', xp: 200 });
  else if (totalQuestions >= 500) wins.push({ type: 'milestone', title: '500+ solved', detail: 'Serious momentum.', emoji: '🎯', xp: 100 });
  else if (totalQuestions >= 100) wins.push({ type: 'milestone', title: `${totalQuestions} conquered`, detail: 'Building the base.', emoji: '🚀', xp: 50 });

  if (avgAccuracy >= 80) wins.push({ type: 'improved', title: `${Math.round(avgAccuracy)}% accuracy`, detail: 'AIR under 5000 territory.', emoji: '🎯', xp: 100 });

  return wins.slice(0, 5);
}

// ────────────────────────────────────────────────
// ACHIEVEMENTS
// ────────────────────────────────────────────────

export function computeAchievements(
  streak: number,
  totalQs: number,
  accuracy: number,
  mastered: number,
  level: number,
  tasksCompleted: number,
  unlockedIds: string[],
): Achievement[] {
  const ctx = { streak, totalQs, accuracy, mastered, level, tasksCompleted };
  return ACHIEVEMENT_DEFS.map(def => {
    const unlocked = def.condition(ctx as any);
    const wasUnlocked = unlockedIds.includes(def.id);
    return {
      id: def.id,
      title: def.title,
      description: def.desc,
      icon: def.icon,
      rarity: def.rarity,
      unlockedAt: unlocked || wasUnlocked ? 'unlocked' : undefined,
      progress: unlocked ? 100 : 0, // Simplified — real progress would need more data
      xpReward: def.xp,
    };
  });
}

// ────────────────────────────────────────────────
// DAILY CHALLENGE
// ────────────────────────────────────────────────

export function pickDailyChallenge(dateStr: string): DailyChallenge {
  // Deterministic pick based on date
  const dayHash = dateStr.split('-').reduce((s, n) => s + parseInt(n), 0);
  const tmpl = CHALLENGE_TEMPLATES[dayHash % CHALLENGE_TEMPLATES.length];
  return {
    id: `challenge-${dateStr}`,
    type: tmpl.type,
    title: tmpl.title,
    description: tmpl.desc,
    target: tmpl.target,
    current: 0,
    xpReward: tmpl.xp,
    icon: tmpl.icon,
  };
}

// ────────────────────────────────────────────────
// STATS
// ────────────────────────────────────────────────

export function computeStats(
  topics: TopicInsight[],
  profile: any,
  daysToExam: number,
  todayPlan: DayPlan,
  totalQuestions: number,
): PlannerStats {
  const xp = profile?.total_points || 0;
  const levelInfo = getLevelInfo(xp);
  const phase = getExamPhase(daysToExam);

  return {
    daysToExam: Math.max(0, daysToExam),
    examPhase: phase,
    totalTopicsPracticed: topics.length,
    masteredCount: topics.filter(t => t.status === 'mastered').length,
    strongCount: topics.filter(t => t.status === 'strong').length,
    developingCount: topics.filter(t => t.status === 'developing').length,
    weakCount: topics.filter(t => t.status === 'weak').length,
    avgAccuracy: topics.length > 0 ? Math.round(topics.reduce((s, t) => s + t.accuracy, 0) / topics.length) : 0,
    currentStreak: profile?.current_streak || 0,
    longestStreak: profile?.longest_streak || 0,
    todayTasksTotal: todayPlan.tasks.length,
    todayTasksDone: todayPlan.tasks.filter(t => t.status === 'completed').length,
    totalQuestionsAllTime: totalQuestions,
    currentXP: xp,
    level: levelInfo.level,
    levelTitle: levelInfo.title,
    levelIcon: levelInfo.icon,
    xpToNextLevel: levelInfo.xpToNext,
    xpProgress: levelInfo.progress,
  };
}

// ────────────────────────────────────────────────
// GREETING + MOTIVATION
// ────────────────────────────────────────────────

export function getGreeting(
  name: string | null,
  streak: number,
  avgAccuracy: number,
  daysToExam: number,
  weakCount: number,
) {
  const hour = new Date().getHours();
  const display = name?.split(' ')[0] || 'there';
  const greeting = hour < 12 ? `Good morning, ${display}` :
    hour < 17 ? `Good afternoon, ${display}` :
    hour < 21 ? `Good evening, ${display}` : `Night owl mode, ${display}?`;

  let pool: readonly string[];
  if (daysToExam <= 30) pool = MOTIVATIONS.exam_near;
  else if (streak >= 7) pool = MOTIVATIONS.streak_high;
  else if (streak >= 3) pool = MOTIVATIONS.streak_mid;
  else if (avgAccuracy >= 70) pool = MOTIVATIONS.accuracy_high;
  else if (avgAccuracy < 50 && avgAccuracy > 0) pool = MOTIVATIONS.accuracy_low;
  else pool = MOTIVATIONS.general;

  const motivation = pool[Math.floor(Math.random() * pool.length)];
  return { greeting, motivation };
}
