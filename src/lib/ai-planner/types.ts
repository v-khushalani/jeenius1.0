/**
 * JEENIUS AI PLANNER — Type System v3
 * Clean. No duplication. Every type maps to real DB data.
 */

// ━━━ ENUMS ━━━
export type TaskType = 'deep-study' | 'practice' | 'mock-test' | 'pyq' | 'formula-drill';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'skipped';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';
export type TopicStatus = 'not-started' | 'weak' | 'developing' | 'strong' | 'mastered';
export type ExamPhase = 'foundation' | 'building' | 'strengthening' | 'revision-sprint' | 'mock-intensive' | 'final-push';

// ━━━ TOPIC INSIGHT ━━━
export interface TopicInsight {
  subject: string;
  chapter: string;
  topic: string;
  accuracy: number;
  questionsAttempted: number;
  status: TopicStatus;
  daysSincePractice: number;
  priorityScore: number;
  stuckDays: number;
}

// ━━━ TASK ━━━
export interface PlannerTask {
  id: string;
  subject: string;
  chapter: string;
  topic: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  timeSlot: TimeSlot;
  allocatedMinutes: number;
  questionsTarget: number;
  accuracy: number;
  reason: string;
  xpReward: number;
}

// ━━━ DAY PLAN ━━━
export interface DayPlan {
  date: string;
  dayName: string;
  dayShort: string;
  isToday: boolean;
  isRestDay: boolean;
  tasks: PlannerTask[];
  totalMinutes: number;
  completedMinutes: number;
  focusSubject: string;
}

// ━━━ BRAIN SCORE ━━━
export interface BrainScore {
  overall: number;
  dimensions: {
    conceptual: number;
    problemSolving: number;
    consistency: number;
    examReadiness: number;
    growth: number;
  };
  trend: 'rising' | 'stable' | 'declining';
  weeklyDelta: number;
}

// ━━━ RANK PREDICTION ━━━
export interface RankPrediction {
  estimatedRank: number;
  rankRange: { min: number; max: number };
  confidence: number;
  estimatedScore: number;
  maxScore: number;
  trajectory: 'improving' | 'stable' | 'declining';
  topColleges: string[];
}

// ━━━ SUBJECT BREAKDOWN ━━━
export interface SubjectBreakdown {
  subject: string;
  avgAccuracy: number;
  topicCount: number;
  masteredCount: number;
  strongCount: number;
  developingCount: number;
  weakCount: number;
  topics: TopicInsight[];
}

// ━━━ WEEKLY WIN ━━━
export interface WeeklyWin {
  type: 'mastered' | 'improved' | 'streak' | 'milestone' | 'rank-up' | 'challenge';
  title: string;
  detail: string;
  emoji: string;
  xp: number;
}

// ━━━ ACHIEVEMENT ━━━
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  progress: number;
  xpReward: number;
}

// ━━━ DAILY CHALLENGE ━━━
export interface DailyChallenge {
  id: string;
  type: 'speed-round' | 'accuracy-challenge' | 'topic-boss' | 'consistency';
  title: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  icon: string;
}

// ━━━ CHAPTER PRIORITY ━━━
export interface ChapterPriority {
  subject: string;
  chapter: string;
  score: number;
  weakTopics: number;
  totalTopics: number;
  avgAccuracy: number;
}

// ━━━ PLANNER STATS ━━━
export interface PlannerStats {
  daysToExam: number;
  examPhase: ExamPhase;
  totalTopicsPracticed: number;
  masteredCount: number;
  strongCount: number;
  developingCount: number;
  weakCount: number;
  avgAccuracy: number;
  currentStreak: number;
  longestStreak: number;
  todayTasksTotal: number;
  todayTasksDone: number;
  totalQuestionsAllTime: number;
  currentXP: number;
  level: number;
  levelTitle: string;
  levelIcon: string;
  xpToNextLevel: number;
  xpProgress: number;
}

// ━━━ FULL STATE ━━━
export interface PlannerState {
  studentName: string;
  targetExam: string;
  examDate: string;
  dailyStudyHours: number;

  brainScore: BrainScore;
  rankPrediction: RankPrediction;
  stats: PlannerStats;

  todayPlan: DayPlan;
  weekPlan: DayPlan[];
  selectedDayIndex: number;

  topics: TopicInsight[];
  subjectBreakdowns: SubjectBreakdown[];
  chapterPriorities: ChapterPriority[];
  weeklyWins: WeeklyWin[];
  achievements: Achievement[];
  dailyChallenge: DailyChallenge | null;

  greeting: string;
  motivation: string;
  isLoading: boolean;
  hasEnoughData: boolean;
  needsDiagnostic: boolean;
  totalQuestions: number;
}

// ━━━ SUBJECT VISUAL CONFIG ━━━
export interface SubjectStyle {
  color: string;
  gradient: string;
  bg: string;
  text: string;
  border: string;
  icon: string;
  lightBg: string;
}

export const SUBJECT_STYLES: Record<string, SubjectStyle> = {
  Physics: {
    color: '#3b82f6', gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200',
    icon: '⚡', lightBg: 'bg-blue-500/10',
  },
  Chemistry: {
    color: '#10b981', gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',
    icon: '🧪', lightBg: 'bg-emerald-500/10',
  },
  Mathematics: {
    color: '#8b5cf6', gradient: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200',
    icon: '📐', lightBg: 'bg-violet-500/10',
  },
  Biology: {
    color: '#ec4899', gradient: 'from-pink-500 to-rose-500',
    bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200',
    icon: '🧬', lightBg: 'bg-pink-500/10',
  },
};

export function getSubjectStyle(subject: string): SubjectStyle {
  return SUBJECT_STYLES[subject] || SUBJECT_STYLES.Physics;
}
