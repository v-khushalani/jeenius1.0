/**
 * Smart Study Planner — Core Algorithm Engine
 * Pure functions. Zero side effects. All driven by real student data.
 * Every calculation is based on actual performance metrics.
 */

import type {
  TopicInsight, TopicStatus, TimeAllocation, DayPlan, PlannerTask,
  TaskType, TaskPriority, TimeSlot, RevisionItem, WeeklyWin,
  PlannerStats, SubjectBreakdown
} from './types';

// ─────────────────────────────────────────────
// TOPIC ANALYSIS — Turns raw DB rows into insights
// ─────────────────────────────────────────────

export function analyzeTopics(topicMasteryRows: any[]): TopicInsight[] {
  return topicMasteryRows.map((row) => {
    const accuracy = row.accuracy ?? 0;
    const questionsAttempted = row.questions_attempted ?? 0;
    const lastPracticed = row.last_practiced
      ? new Date(row.last_practiced)
      : new Date(Date.now() - 30 * 86400000);
    const daysSincePractice = Math.max(0, Math.floor(
      (Date.now() - lastPracticed.getTime()) / 86400000
    ));
    const stuckDays = row.stuck_days ?? 0;

    const status: TopicStatus =
      accuracy >= 90 && questionsAttempted >= 15 ? 'mastered' :
      accuracy >= 75 ? 'strong' :
      accuracy >= 50 ? 'improving' : 'weak';

    // Priority: higher = more urgent to study
    const accuracyWeight = (100 - accuracy) * 0.45;
    const recencyWeight = Math.min(daysSincePractice, 30) * 0.35;
    const exposureWeight = Math.max(0, 20 - questionsAttempted) * 0.20;
    const priorityScore = Math.round(accuracyWeight + recencyWeight + exposureWeight);

    return {
      subject: row.subject || 'Unknown',
      chapter: row.chapter || '',
      topic: row.topic || '',
      accuracy: Math.round(accuracy),
      questionsAttempted,
      status,
      daysSincePractice,
      priorityScore,
      stuckDays,
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
}

// ─────────────────────────────────────────────
// TIME ALLOCATION — Based on exam proximity
// ─────────────────────────────────────────────

export function computeTimeAllocation(daysToExam: number): TimeAllocation {
  if (daysToExam > 180) return { study: 0.65, revision: 0.20, practice: 0.15 };
  if (daysToExam > 90)  return { study: 0.55, revision: 0.25, practice: 0.20 };
  if (daysToExam > 45)  return { study: 0.40, revision: 0.35, practice: 0.25 };
  if (daysToExam > 15)  return { study: 0.25, revision: 0.40, practice: 0.35 };
  return { study: 0.15, revision: 0.40, practice: 0.45 };
}

// ─────────────────────────────────────────────
// TODAY'S PLAN GENERATION — Smart daily tasks
// ─────────────────────────────────────────────

function makeTaskId(date: string, subject: string, topic: string, type: string): string {
  return `${date}::${subject}::${topic}::${type}`.replace(/\s+/g, '_').toLowerCase();
}

function getTaskPriority(topic: TopicInsight): TaskPriority {
  if (topic.status === 'weak' && topic.daysSincePractice > 5) return 'critical';
  if (topic.status === 'weak') return 'high';
  if (topic.status === 'improving') return 'medium';
  return 'low';
}

function getTaskReason(topic: TopicInsight, type: TaskType): string {
  if (type === 'revision') {
    if (topic.daysSincePractice > 7) return `Last practiced ${topic.daysSincePractice} days ago — memory fading`;
    return `Quick revision to reinforce (${topic.accuracy}% accuracy)`;
  }
  if (topic.status === 'weak') {
    if (topic.accuracy < 30) return `Only ${topic.accuracy}% accuracy — needs focused practice`;
    return `Below target at ${topic.accuracy}% — building foundations`;
  }
  if (topic.status === 'improving') {
    return `${topic.accuracy}% and climbing — push to 75%+`;
  }
  if (topic.status === 'strong') {
    return `Strong at ${topic.accuracy}% — maintain with quick practice`;
  }
  return `${topic.accuracy}% mastery — keep it sharp`;
}

function questionsForMinutes(minutes: number): number {
  // ~3 min per MCQ on average for JEE/NEET level
  return Math.max(3, Math.round(minutes / 3));
}

export function generateTodayPlan(
  topics: TopicInsight[],
  dailyHours: number,
  allocation: TimeAllocation,
  dateStr: string
): DayPlan {
  const dayOfWeek = new Date(dateStr).getDay(); // 0=Sun
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayShorts = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Sunday: rest day with optional light revision
  if (dayOfWeek === 0) {
    const lightRevision = topics
      .filter(t => t.status === 'strong' || t.status === 'mastered')
      .slice(0, 2)
      .map((t, i) => createTask(t, 'revision', 'morning', 20, dateStr, i));

    return {
      date: dateStr,
      dayName: dayNames[dayOfWeek],
      dayShort: dayShorts[dayOfWeek],
      isToday: true,
      isRestDay: true,
      tasks: lightRevision,
      totalMinutes: lightRevision.reduce((s, t) => s + t.allocatedMinutes, 0),
      completedMinutes: 0,
    };
  }

  const totalMinutes = Math.round(dailyHours * 60);

  // Saturday: heavy practice/mock test focus
  if (dayOfWeek === 6) {
    return generateMockTestDay(topics, totalMinutes, allocation, dateStr, dayNames[dayOfWeek], dayShorts[dayOfWeek]);
  }

  // Weekday: structured learning
  const studyMins = Math.round(totalMinutes * allocation.study);
  const revisionMins = Math.round(totalMinutes * allocation.revision);
  const practiceMins = totalMinutes - studyMins - revisionMins;

  const tasks: PlannerTask[] = [];
  let taskIdx = 0;

  // MORNING: Weak topics (fresh mind, hardest material)
  const weakTopics = topics.filter(t => t.status === 'weak' || t.status === 'improving');
  const morningTopics = weakTopics.slice(0, 2);
  let morningMinsLeft = studyMins;

  for (const topic of morningTopics) {
    if (morningMinsLeft <= 0) break;
    const mins = Math.min(morningMinsLeft, topic.status === 'weak' ? 45 : 35);
    tasks.push(createTask(topic, 'study', 'morning', mins, dateStr, taskIdx++));
    morningMinsLeft -= mins;
  }

  // If study minutes remain and more weak topics exist, add one more
  if (morningMinsLeft >= 25) {
    const extraTopic = weakTopics[2];
    if (extraTopic) {
      tasks.push(createTask(extraTopic, 'study', 'morning', Math.min(morningMinsLeft, 30), dateStr, taskIdx++));
    }
  }

  // AFTERNOON: Practice problems on medium topics
  const mediumTopics = topics.filter(t => t.status === 'improving' || t.status === 'strong');
  const afternoonTopics = mediumTopics.filter(t =>
    !tasks.some(tk => tk.topic === t.topic && tk.subject === t.subject)
  ).slice(0, 2);
  let afternoonMinsLeft = practiceMins;

  for (const topic of afternoonTopics) {
    if (afternoonMinsLeft <= 0) break;
    const mins = Math.min(afternoonMinsLeft, 30);
    tasks.push(createTask(topic, 'practice', 'afternoon', mins, dateStr, taskIdx++));
    afternoonMinsLeft -= mins;
  }

  // EVENING: Revision of topics with forgetting risk
  const revisionCandidates = topics
    .filter(t => t.daysSincePractice >= 3 && t.accuracy > 30)
    .filter(t => !tasks.some(tk => tk.topic === t.topic && tk.subject === t.subject))
    .sort((a, b) => b.daysSincePractice - a.daysSincePractice)
    .slice(0, 2);
  let eveningMinsLeft = revisionMins;

  for (const topic of revisionCandidates) {
    if (eveningMinsLeft <= 0) break;
    const mins = Math.min(eveningMinsLeft, 25);
    tasks.push(createTask(topic, 'revision', 'evening', mins, dateStr, taskIdx++));
    eveningMinsLeft -= mins;
  }

  // If revision minutes remain, add one more revision for strong subjects
  if (eveningMinsLeft >= 20) {
    const strongForRevision = topics
      .filter(t => t.status === 'strong' || t.status === 'mastered')
      .filter(t => !tasks.some(tk => tk.topic === t.topic && tk.subject === t.subject))
      .slice(0, 1);
    for (const topic of strongForRevision) {
      tasks.push(createTask(topic, 'revision', 'evening', Math.min(eveningMinsLeft, 20), dateStr, taskIdx++));
    }
  }

  return {
    date: dateStr,
    dayName: dayNames[dayOfWeek],
    dayShort: dayShorts[dayOfWeek],
    isToday: true,
    isRestDay: false,
    tasks,
    totalMinutes: tasks.reduce((s, t) => s + t.allocatedMinutes, 0),
    completedMinutes: 0,
  };
}

function generateMockTestDay(
  topics: TopicInsight[],
  totalMinutes: number,
  allocation: TimeAllocation,
  dateStr: string,
  dayName: string,
  dayShort: string,
): DayPlan {
  const tasks: PlannerTask[] = [];
  let idx = 0;

  // Morning: Mock test (40% of time)
  const mockMins = Math.round(totalMinutes * 0.4);
  const weakestSubject = getMostUrgentSubject(topics);
  tasks.push({
    id: makeTaskId(dateStr, weakestSubject, 'mini-mock', 'mock_test'),
    subject: weakestSubject,
    chapter: 'Mixed',
    topic: 'Mini Mock Test',
    type: 'mock_test',
    priority: 'high',
    status: 'pending',
    timeSlot: 'morning',
    allocatedMinutes: mockMins,
    accuracy: 0,
    questionsTarget: questionsForMinutes(mockMins),
    reason: `Full practice session on ${weakestSubject} — simulate exam conditions`,
  });
  idx++;

  // Afternoon: Targeted practice on weak areas (35%)
  const weakTopics = topics.filter(t => t.status === 'weak').slice(0, 2);
  const practiceMins = Math.round(totalMinutes * 0.35);
  let practiceLeft = practiceMins;

  for (const topic of weakTopics) {
    if (practiceLeft <= 0) break;
    const mins = Math.min(practiceLeft, 35);
    tasks.push(createTask(topic, 'practice', 'afternoon', mins, dateStr, idx++));
    practiceLeft -= mins;
  }

  // Evening: Light revision (25%)
  const revMins = totalMinutes - mockMins - practiceMins;
  const revTopics = topics
    .filter(t => t.daysSincePractice >= 4 && !weakTopics.includes(t))
    .slice(0, 2);
  let revLeft = revMins;

  for (const topic of revTopics) {
    if (revLeft <= 0) break;
    const mins = Math.min(revLeft, 20);
    tasks.push(createTask(topic, 'revision', 'evening', mins, dateStr, idx++));
    revLeft -= mins;
  }

  return {
    date: dateStr,
    dayName,
    dayShort,
    isToday: false,
    isRestDay: false,
    tasks,
    totalMinutes: tasks.reduce((s, t) => s + t.allocatedMinutes, 0),
    completedMinutes: 0,
  };
}

function createTask(
  topic: TopicInsight,
  type: TaskType,
  slot: TimeSlot,
  minutes: number,
  dateStr: string,
  _index: number
): PlannerTask {
  return {
    id: makeTaskId(dateStr, topic.subject, topic.topic, type),
    subject: topic.subject,
    chapter: topic.chapter,
    topic: topic.topic,
    type,
    priority: getTaskPriority(topic),
    status: 'pending',
    timeSlot: slot,
    allocatedMinutes: minutes,
    accuracy: topic.accuracy,
    questionsTarget: questionsForMinutes(minutes),
    reason: getTaskReason(topic, type),
  };
}

function getMostUrgentSubject(topics: TopicInsight[]): string {
  const subjectScores: Record<string, number> = {};
  for (const t of topics) {
    subjectScores[t.subject] = (subjectScores[t.subject] || 0) + t.priorityScore;
  }
  let maxSubject = 'Physics';
  let maxScore = 0;
  for (const [subject, score] of Object.entries(subjectScores)) {
    if (score > maxScore) { maxScore = score; maxSubject = subject; }
  }
  return maxSubject;
}

// ─────────────────────────────────────────────
// WEEK PLAN — 7 days from today
// ─────────────────────────────────────────────

export function generateWeekPlan(
  topics: TopicInsight[],
  dailyHours: number,
  allocation: TimeAllocation
): DayPlan[] {
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayShorts = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const plans: DayPlan[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dow = d.getDay();

    // Rotate topic focus across the week so each day has fresh topics
    const rotatedTopics = rotateTopicsForDay(topics, i);
    const plan = generateTodayPlan(rotatedTopics, dailyHours, allocation, dateStr);

    plans.push({
      ...plan,
      dayName: dayNames[dow],
      dayShort: dayShorts[dow],
      isToday: i === 0,
    });
  }
  return plans;
}

function rotateTopicsForDay(topics: TopicInsight[], dayOffset: number): TopicInsight[] {
  if (topics.length <= 3) return topics;

  // Group by status, rotate within each group
  const weak = topics.filter(t => t.status === 'weak');
  const improving = topics.filter(t => t.status === 'improving');
  const strong = topics.filter(t => t.status === 'strong' || t.status === 'mastered');

  const rotate = (arr: TopicInsight[], offset: number) => {
    if (arr.length === 0) return arr;
    const shift = offset % arr.length;
    return [...arr.slice(shift), ...arr.slice(0, shift)];
  };

  return [
    ...rotate(weak, dayOffset),
    ...rotate(improving, dayOffset),
    ...rotate(strong, dayOffset),
  ];
}

// ─────────────────────────────────────────────
// SPACED REPETITION — Forgetting curve based
// ─────────────────────────────────────────────

export function getRevisionDue(topics: TopicInsight[]): RevisionItem[] {
  return topics
    .filter(t => t.daysSincePractice >= 2 && t.accuracy > 20)
    .map(t => {
      // Forgetting risk: higher accuracy decays slower
      const retentionFactor = t.accuracy / 100;
      const dayFactor = t.daysSincePractice;
      const forgettingRisk = Math.min(100, Math.round(
        dayFactor * (1 - retentionFactor * 0.7) * 8
      ));

      const urgency: RevisionItem['urgency'] =
        t.daysSincePractice > 7 ? 'overdue' :
        t.daysSincePractice > 3 ? 'due' : 'upcoming';

      return {
        subject: t.subject,
        chapter: t.chapter,
        topic: t.topic,
        accuracy: t.accuracy,
        daysSince: t.daysSincePractice,
        urgency,
        forgettingRisk,
      };
    })
    .sort((a, b) => b.forgettingRisk - a.forgettingRisk)
    .slice(0, 8);
}

// ─────────────────────────────────────────────
// WEEKLY WINS — Based on real performance data
// ─────────────────────────────────────────────

export function detectWeeklyWins(
  topics: TopicInsight[],
  streak: number,
  avgAccuracy: number,
  totalQuestions: number
): WeeklyWin[] {
  const wins: WeeklyWin[] = [];

  // Mastered topics (>90% with enough questions)
  const mastered = topics.filter(t => t.status === 'mastered');
  if (mastered.length > 0) {
    wins.push({
      type: 'mastered',
      title: mastered.length === 1
        ? `Mastered ${mastered[0].topic}!`
        : `${mastered.length} topics mastered!`,
      detail: mastered.map(t => t.topic).slice(0, 3).join(', '),
      emoji: '🏆',
    });
  }

  // Strong topics showing improvement
  const strongRecent = topics.filter(t =>
    t.status === 'strong' && t.daysSincePractice <= 7
  );
  if (strongRecent.length > 0) {
    wins.push({
      type: 'improved',
      title: `${strongRecent.length} topics going strong`,
      detail: strongRecent.map(t => `${t.topic} (${t.accuracy}%)`).slice(0, 3).join(', '),
      emoji: '📈',
    });
  }

  // Streak celebration
  if (streak >= 7) {
    wins.push({ type: 'streak', title: `${streak}-day streak!`, detail: 'Consistency beats intensity. You\'re proving it.', emoji: '🔥' });
  } else if (streak >= 3) {
    wins.push({ type: 'streak', title: `${streak} days strong!`, detail: 'Building the habit. Keep going.', emoji: '⚡' });
  }

  // Question milestones
  if (totalQuestions >= 1000) {
    wins.push({ type: 'milestone', title: '1000+ questions solved!', detail: 'You\'re in the top 5% of serious aspirants.', emoji: '💎' });
  } else if (totalQuestions >= 500) {
    wins.push({ type: 'milestone', title: '500+ questions done!', detail: 'Halfway to serious mastery.', emoji: '🎯' });
  } else if (totalQuestions >= 100) {
    wins.push({ type: 'milestone', title: `${totalQuestions} questions conquered!`, detail: 'Building momentum.', emoji: '🚀' });
  }

  // High accuracy celebration
  if (avgAccuracy >= 80) {
    wins.push({ type: 'consistency', title: `${Math.round(avgAccuracy)}% overall accuracy`, detail: 'Elite-level precision. AIR under 5000 territory.', emoji: '🎯' });
  } else if (avgAccuracy >= 65) {
    wins.push({ type: 'consistency', title: `${Math.round(avgAccuracy)}% and climbing`, detail: 'Solid foundation. Push to 80% for top ranks.', emoji: '💪' });
  }

  return wins.slice(0, 4);
}

// ─────────────────────────────────────────────
// SUBJECT BREAKDOWN — Per-subject analysis
// ─────────────────────────────────────────────

export function getSubjectBreakdowns(topics: TopicInsight[]): SubjectBreakdown[] {
  const subjectMap = new Map<string, TopicInsight[]>();
  for (const t of topics) {
    const list = subjectMap.get(t.subject) || [];
    list.push(t);
    subjectMap.set(t.subject, list);
  }

  return Array.from(subjectMap.entries()).map(([subject, subTopics]) => {
    const totalAccuracy = subTopics.reduce((s, t) => s + t.accuracy, 0);
    return {
      subject,
      avgAccuracy: Math.round(totalAccuracy / subTopics.length),
      topicCount: subTopics.length,
      masteredCount: subTopics.filter(t => t.status === 'mastered').length,
      strongCount: subTopics.filter(t => t.status === 'strong').length,
      improvingCount: subTopics.filter(t => t.status === 'improving').length,
      weakCount: subTopics.filter(t => t.status === 'weak').length,
      topics: subTopics.sort((a, b) => b.priorityScore - a.priorityScore),
    };
  }).sort((a, b) => a.avgAccuracy - b.avgAccuracy); // weakest subject first
}

// ─────────────────────────────────────────────
// STATS COMPUTATION
// ─────────────────────────────────────────────

export function computeStats(
  topics: TopicInsight[],
  profile: any,
  daysToExam: number,
  todayPlan: DayPlan
): PlannerStats {
  const totalTopicsPracticed = topics.length;
  const masteredCount = topics.filter(t => t.status === 'mastered').length;
  const strongCount = topics.filter(t => t.status === 'strong').length;
  const improvingCount = topics.filter(t => t.status === 'improving').length;
  const weakCount = topics.filter(t => t.status === 'weak').length;
  const avgAccuracy = totalTopicsPracticed > 0
    ? Math.round(topics.reduce((s, t) => s + t.accuracy, 0) / totalTopicsPracticed)
    : 0;

  // Journey percent: how far into preparation (rough estimate)
  // Assume ~365 day prep cycle typical for JEE/NEET
  const totalPrepDays = daysToExam + (365 - daysToExam);
  const journeyPercent = Math.min(99, Math.max(1, Math.round(
    ((totalPrepDays - daysToExam) / totalPrepDays) * 100
  )));

  const todayTasksTotal = todayPlan.tasks.length;
  const todayTasksDone = todayPlan.tasks.filter(t => t.status === 'completed').length;
  const dailyHours = profile?.daily_study_hours || 4;

  return {
    daysToExam: Math.max(0, daysToExam),
    journeyPercent,
    totalTopicsPracticed,
    masteredCount,
    strongCount,
    improvingCount,
    weakCount,
    avgAccuracy,
    currentStreak: profile?.current_streak || 0,
    todayTasksTotal,
    todayTasksDone,
    weeklyStudyMinutes: dailyHours * 60 * 6, // 6 active days
  };
}

// ─────────────────────────────────────────────
// GREETING & MOTIVATION — Personalized
// ─────────────────────────────────────────────

export function getGreeting(
  name: string | null,
  streak: number,
  avgAccuracy: number,
  daysToExam: number,
  weakCount: number
): { greeting: string; motivation: string } {
  const hour = new Date().getHours();
  const displayName = name?.split(' ')[0] || 'there';

  let greeting: string;
  if (hour < 12) greeting = `Good morning, ${displayName}`;
  else if (hour < 17) greeting = `Good afternoon, ${displayName}`;
  else if (hour < 21) greeting = `Good evening, ${displayName}`;
  else greeting = `Night owl mode, ${displayName}?`;

  let motivation: string;
  if (daysToExam <= 15) {
    motivation = 'Final sprint. Every question you solve today counts double.';
  } else if (daysToExam <= 30) {
    motivation = 'Last month. This is where toppers separate from the rest.';
  } else if (streak >= 10) {
    motivation = `${streak}-day streak. You're not just studying — you're building dominance.`;
  } else if (streak >= 5) {
    motivation = `${streak} days consistent. Champions are built in streaks like this.`;
  } else if (avgAccuracy >= 80) {
    motivation = 'Your accuracy is in the toppers zone. Don\'t let up.';
  } else if (avgAccuracy >= 60) {
    motivation = 'Solid progress. Focus on weak spots today and watch your rank climb.';
  } else if (weakCount > 5) {
    motivation = `${weakCount} topics to conquer. Start with the hardest one — momentum follows.`;
  } else if (streak >= 1) {
    motivation = 'You showed up yesterday. Show up again today. That\'s the formula.';
  } else {
    motivation = 'Every expert was once a beginner. Today is your day to start.';
  }

  return { greeting, motivation };
}
