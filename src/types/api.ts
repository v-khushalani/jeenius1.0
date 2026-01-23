/**
 * API response types and interfaces
 */

export interface SubjectStats {
  [subjectId: string]: {
    attempted: number;
    correct: number;
    accuracy: number;
    timeSpent: number;
  };
}

export interface TopicStats {
  [topicId: string]: {
    masteryLevel: number;
    questionsAttempted: number;
    lastAttempted: string | null;
  };
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  is_premium: boolean;
  subscription_end_date: string | null;
  total_points: number;
  current_streak: number;
  goal_exam: 'JEE' | 'NEET' | null;
  target_rank: number | null;
  study_hours_target: number | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionAttempt {
  id: string;
  user_id: string;
  question_id: string;
  is_correct: boolean;
  time_spent: number;
  attempted_at: string;
  points_earned: number;
}

export interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: number;
  lastActivityDate: string | null;
}

export interface PointsData {
  totalPoints: number;
  level: number;
  rank: string;
  pointsToNextLevel: number;
  recentActivity: Array<{
    action: string;
    points: number;
    timestamp: string;
  }>;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}
