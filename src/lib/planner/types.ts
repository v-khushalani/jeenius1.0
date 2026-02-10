/**
 * Smart Study Planner — Type Definitions
 * Zero mock data. Every type maps to real student data.
 */

export type TaskType = 'study' | 'revision' | 'mock_test' | 'practice' | 'break';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'completed' | 'skipped';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';
export type TopicStatus = 'weak' | 'improving' | 'strong' | 'mastered';

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
  accuracy: number;
  questionsTarget: number;
  reason: string;
}

export interface DayPlan {
  date: string;
  dayName: string;
  dayShort: string;
  isToday: boolean;
  isRestDay: boolean;
  tasks: PlannerTask[];
  totalMinutes: number;
  completedMinutes: number;
}

export interface RevisionItem {
  subject: string;
  chapter: string;
  topic: string;
  accuracy: number;
  daysSince: number;
  urgency: 'overdue' | 'due' | 'upcoming';
  forgettingRisk: number;
}

export interface WeeklyWin {
  type: 'mastered' | 'improved' | 'streak' | 'consistency' | 'milestone';
  title: string;
  detail: string;
  emoji: string;
}

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

export interface PlannerStats {
  daysToExam: number;
  journeyPercent: number;
  totalTopicsPracticed: number;
  masteredCount: number;
  strongCount: number;
  improvingCount: number;
  weakCount: number;
  avgAccuracy: number;
  currentStreak: number;
  todayTasksTotal: number;
  todayTasksDone: number;
  weeklyStudyMinutes: number;
}

export interface TimeAllocation {
  study: number;
  revision: number;
  practice: number;
}

export interface SubjectBreakdown {
  subject: string;
  avgAccuracy: number;
  topicCount: number;
  masteredCount: number;
  weakCount: number;
  strongCount: number;
  improvingCount: number;
  topics: TopicInsight[];
}

export const SUBJECT_CONFIG: Record<string, {
  color: string; bg: string; text: string; border: string; ring: string; icon: string;
}> = {
  Physics: { color: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', ring: 'ring-blue-500', icon: '⚡' },
  Chemistry: { color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'ring-emerald-500', icon: '🧪' },
  Mathematics: { color: '#8b5cf6', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', ring: 'ring-violet-500', icon: '📐' },
  Biology: { color: '#ec4899', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', ring: 'ring-pink-500', icon: '🧬' },
};

export function getSubjectConfig(subject: string) {
  return SUBJECT_CONFIG[subject] || SUBJECT_CONFIG.Physics;
}

export interface SmartPlannerState {
  studentName: string;
  targetExam: string;
  examDate: string;
  dailyStudyHours: number;
  stats: PlannerStats;
  todayPlan: DayPlan;
  weekPlan: DayPlan[];
  revisionDue: RevisionItem[];
  weeklyWins: WeeklyWin[];
  topics: TopicInsight[];
  subjectBreakdowns: SubjectBreakdown[];
  timeAllocation: TimeAllocation;
  greeting: string;
  motivation: string;
  isLoading: boolean;
  hasEnoughData: boolean;
  totalQuestions: number;
}
