// utils/constants.js - Configuration Constants

export const LEVEL_REQUIREMENTS = {
  1: { 
    questionsNeeded: 15, 
    accuracyRequired: 0.70,
    name: 'Basic',
    description: 'Foundation concepts',
    color: 'green'
  },
  2: { 
    questionsNeeded: 20, 
    accuracyRequired: 0.75,
    name: 'Intermediate',
    description: 'Applied knowledge', 
    color: 'blue'
  },
  3: { 
    questionsNeeded: 25, 
    accuracyRequired: 0.80,
    name: 'Advanced',
    description: 'Expert level',
    color: 'purple'
  }
};

export const ACCURACY_THRESHOLDS = {
  STRENGTH: 0.80,   // 80%+ = Strong
  MODERATE: 0.60,   // 60-79% = Moderate  
  WEAKNESS: 0.60    // <60% = Weakness
};

export const STORAGE_KEYS = {
  USER_PROGRESS: 'user_progress_data',
  USER_PREFERENCES: 'user_preferences',
  SESSION_DATA: 'current_session'
};

export const CHART_COLORS = {
  PRIMARY: '#3B82F6',
  SUCCESS: '#10B981', 
  WARNING: '#F59E0B',
  DANGER: '#EF4444',
  INFO: '#8B5CF6'
};

export const LEVEL_COLORS = {
  1: {
    bg: 'bg-green-500',
    text: 'text-green-600', 
    border: 'border-green-500',
    light: 'bg-green-50'
  },
  2: {
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    border: 'border-blue-500', 
    light: 'bg-blue-50'
  },
  3: {
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    border: 'border-purple-500',
    light: 'bg-purple-50'
  }
};

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  FILL_BLANK: 'fill_blank',
  ESSAY: 'essay'
};

export const ACHIEVEMENT_TYPES = {
  FIRST_QUESTION: 'first_question',
  LEVEL_UP: 'level_up',
  STREAK_MILESTONE: 'streak_milestone',
  ACCURACY_MILESTONE: 'accuracy_milestone',
  QUESTION_MILESTONE: 'question_milestone'
};

export const MOTIVATIONAL_MESSAGES = {
  HIGH_STREAK: [
    "🔥 Amazing! You're on fire with that study streak!",
    "⚡ Unstoppable! Keep that momentum going!",
    "🚀 You're crushing it! Stay consistent!"
  ],
  HIGH_ACCURACY: [
    "🎯 Excellent accuracy! You're mastering the concepts!",
    "💯 Perfect! Your understanding is rock solid!",
    "⭐ Outstanding performance! You're a star!"
  ],
  MILESTONE_REACHED: [
    "💪 Great dedication! You've reached a major milestone!",
    "🏆 Achievement unlocked! You're making great progress!",
    "🎉 Congratulations! Another goal achieved!"
  ],
  ENCOURAGEMENT: [
    "📈 Good progress! Keep up the momentum!",
    "🚀 You're doing great! Every question counts!",
    "💫 Keep going! You're on the right track!"
  ],
  WELCOME: [
    "Welcome! Start your learning journey today!",
    "Ready to learn? Let's make today count!",
    "Your journey to knowledge begins now!"
  ]
};

export const TIME_RANGES = {
  WEEK: '7d',
  MONTH: '30d', 
  QUARTER: '90d'
};

export const CHART_TYPES = {
  ACCURACY: 'accuracy',
  TOPICS: 'topics',
  LEVELS: 'levels', 
  WEEKLY: 'weekly'
};
