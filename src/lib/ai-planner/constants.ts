/**
 * JEENIUS AI PLANNER — Constants
 * Every number calibrated for Indian competitive exams.
 */

// ━━━ CORE CONFIG ━━━
export const PLANNER = {
  MIN_QUESTIONS: 10,
  MIN_TOPICS: 3,
  DEFAULT_HOURS: 4,
  MIN_HOURS: 1,
  MAX_HOURS: 14,
  MAX_TASKS_PER_DAY: 8,
  MIN_TASK_MINS: 15,
  MAX_TASK_MINS: 90,
  QUESTIONS_PER_MIN: 0.33,
} as const;

// ━━━ XP REWARDS ━━━
export const XP = {
  TASK_COMPLETE: 25,
  QUESTION_CORRECT: 5,
  STREAK_MULTIPLIER: 0.1, // +10% per streak day, max 2x
  PERFECT_SESSION: 50,
  CHALLENGE_BONUS: 1.5,
} as const;

// ━━━ LEVEL SYSTEM ━━━
export const LEVELS = [
  { level: 1, title: 'Aspirant', xp: 0, icon: '🌱' },
  { level: 2, title: 'Learner', xp: 500, icon: '📚' },
  { level: 3, title: 'Scholar', xp: 1500, icon: '🎓' },
  { level: 4, title: 'Practitioner', xp: 3500, icon: '⚡' },
  { level: 5, title: 'Strategist', xp: 7000, icon: '🧠' },
  { level: 6, title: 'Expert', xp: 12000, icon: '💎' },
  { level: 7, title: 'Master', xp: 20000, icon: '👑' },
  { level: 8, title: 'Champion', xp: 35000, icon: '🏆' },
  { level: 9, title: 'Legend', xp: 55000, icon: '🌟' },
  { level: 10, title: 'Genius', xp: 80000, icon: '🔥' },
] as const;

// ━━━ EXAM PHASES ━━━
export const PHASES = {
  foundation:       { minDays: 180, label: 'Foundation', emoji: '🏗️' },
  building:         { minDays: 120, label: 'Building', emoji: '📚' },
  strengthening:    { minDays: 60,  label: 'Strengthening', emoji: '💪' },
  'revision-sprint':{ minDays: 30,  label: 'Revision Sprint', emoji: '🔄' },
  'mock-intensive': { minDays: 14,  label: 'Mock Intensive', emoji: '📝' },
  'final-push':     { minDays: 0,   label: 'Final Push', emoji: '🚀' },
} as const;

// Time split per phase: [deepStudy, practice, mockTest]
export const PHASE_TIME_SPLIT: Record<string, [number, number, number]> = {
  foundation:        [0.55, 0.30, 0.15],
  building:          [0.40, 0.35, 0.25],
  strengthening:     [0.25, 0.40, 0.35],
  'revision-sprint': [0.15, 0.40, 0.45],
  'mock-intensive':  [0.10, 0.30, 0.60],
  'final-push':      [0.05, 0.25, 0.70],
};

// ━━━ RANK MODEL ━━━
export const RANK_MODEL: Record<string, { max: number; total: number; curve: [number, number][] ; colleges: Record<number, string[]> }> = {
  JEE: {
    max: 300, total: 1200000,
    curve: [[280,100],[250,1000],[220,5000],[200,10000],[180,25000],[160,50000],[140,100000],[120,200000],[100,400000],[80,600000]],
    colleges: {
      100: ['IIT Bombay CSE', 'IIT Delhi CSE'],
      1000: ['IIT Bombay', 'IIT Delhi', 'IIT Madras', 'IIT Kanpur'],
      5000: ['Top IITs (most branches)', 'IIIT Hyderabad'],
      10000: ['All IITs', 'Top NITs'],
      25000: ['NITs (good branches)', 'BITS Pilani'],
      50000: ['NITs', 'IIITs', 'Top State Colleges'],
      100000: ['State Engineering Colleges'],
    },
  },
  NEET: {
    max: 720, total: 2000000,
    curve: [[700,100],[680,1000],[650,5000],[620,15000],[580,30000],[540,60000],[500,100000],[450,200000],[400,400000]],
    colleges: {
      100: ['AIIMS Delhi', 'JIPMER'],
      1000: ['AIIMS network', 'Top Govt Medical'],
      5000: ['Govt Medical — metro cities'],
      15000: ['All Govt Medical Colleges'],
      30000: ['Govt + Top Private Medical'],
      60000: ['Most Medical Colleges'],
      100000: ['Private Medical Colleges'],
    },
  },
};

// ━━━ EXAM OPTIONS ━━━
export const EXAMS = [
  { value: 'JEE', label: 'JEE', subjects: ['Physics', 'Chemistry', 'Mathematics'] },
  { value: 'NEET', label: 'NEET', subjects: ['Physics', 'Chemistry', 'Biology'] },
  { value: 'CET', label: 'MHT-CET', subjects: ['Physics', 'Chemistry', 'Mathematics'] },
  { value: 'Foundation', label: 'Foundation', subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'] },
] as const;

// ━━━ SUBJECT WEIGHTS ━━━
export const SUBJECT_WEIGHTS: Record<string, Record<string, number>> = {
  JEE: { Physics: 0.33, Chemistry: 0.33, Mathematics: 0.34 },
  NEET: { Physics: 0.25, Chemistry: 0.25, Biology: 0.50 },
  CET: { Physics: 0.33, Chemistry: 0.33, Mathematics: 0.34 },
  Foundation: { Physics: 0.25, Chemistry: 0.25, Mathematics: 0.25, Biology: 0.25 },
};

// ━━━ DAILY CHALLENGES TEMPLATES ━━━
export const CHALLENGE_TEMPLATES = [
  { type: 'speed-round' as const, title: 'Speed Demon', desc: 'Solve 10 Qs under 20 min', target: 10, xp: 100, icon: '⚡' },
  { type: 'accuracy-challenge' as const, title: 'Sharpshooter', desc: '8/10 correct in a row', target: 8, xp: 120, icon: '🎯' },
  { type: 'topic-boss' as const, title: 'Topic Boss', desc: 'Reach 70% in a weak topic', target: 70, xp: 150, icon: '👊' },
  { type: 'consistency' as const, title: 'Iron Will', desc: 'Complete all tasks today', target: 100, xp: 200, icon: '🔥' },
] as const;

// ━━━ ACHIEVEMENT DEFINITIONS ━━━
export const ACHIEVEMENT_DEFS = [
  { id: 'first-blood', title: 'First Blood', desc: 'Complete your first task', icon: '🗡️', rarity: 'common' as const, xp: 25, condition: (s: { tasksCompleted: number }) => s.tasksCompleted >= 1 },
  { id: 'streak-3', title: 'Consistent', desc: '3-day study streak', icon: '🔥', rarity: 'common' as const, xp: 50, condition: (s: { streak: number }) => s.streak >= 3 },
  { id: 'streak-7', title: 'Dedicated', desc: '7-day study streak', icon: '⚡', rarity: 'rare' as const, xp: 150, condition: (s: { streak: number }) => s.streak >= 7 },
  { id: 'streak-30', title: 'Unstoppable', desc: '30-day study streak', icon: '💎', rarity: 'epic' as const, xp: 500, condition: (s: { streak: number }) => s.streak >= 30 },
  { id: 'qs-100', title: 'Century', desc: '100 questions solved', icon: '💯', rarity: 'common' as const, xp: 75, condition: (s: { totalQs: number }) => s.totalQs >= 100 },
  { id: 'qs-500', title: 'Half-K Warrior', desc: '500 questions solved', icon: '⚔️', rarity: 'rare' as const, xp: 250, condition: (s: { totalQs: number }) => s.totalQs >= 500 },
  { id: 'qs-1000', title: 'K-Club', desc: '1000 questions solved', icon: '🏆', rarity: 'epic' as const, xp: 500, condition: (s: { totalQs: number }) => s.totalQs >= 1000 },
  { id: 'acc-80', title: 'Precision Strike', desc: '80%+ overall accuracy', icon: '🎯', rarity: 'rare' as const, xp: 200, condition: (s: { accuracy: number }) => s.accuracy >= 80 },
  { id: 'mastery-5', title: 'Scholar', desc: 'Master 5 topics', icon: '📚', rarity: 'rare' as const, xp: 200, condition: (s: { mastered: number }) => s.mastered >= 5 },
  { id: 'mastery-15', title: 'Grandmaster', desc: 'Master 15 topics', icon: '👑', rarity: 'epic' as const, xp: 500, condition: (s: { mastered: number }) => s.mastered >= 15 },
  { id: 'mastery-30', title: 'Legendary Mind', desc: 'Master 30 topics', icon: '🌟', rarity: 'legendary' as const, xp: 1000, condition: (s: { mastered: number }) => s.mastered >= 30 },
  { id: 'level-5', title: 'Strategist', desc: 'Reach Level 5', icon: '🧠', rarity: 'rare' as const, xp: 300, condition: (s: { level: number }) => s.level >= 5 },
  { id: 'level-8', title: 'Champion', desc: 'Reach Level 8', icon: '🏅', rarity: 'epic' as const, xp: 750, condition: (s: { level: number }) => s.level >= 8 },
  { id: 'level-10', title: 'Genius Mode', desc: 'Reach Level 10', icon: '🔥', rarity: 'legendary' as const, xp: 2000, condition: (s: { level: number }) => s.level >= 10 },
] as const;

// ━━━ MOTIVATIONS ━━━
export const MOTIVATIONS = {
  streak_high: [
    "You're not just studying — you're building dominance.",
    "This consistency puts you in the top 1% of aspirants.",
  ],
  streak_mid: [
    "Building the habit. Momentum is everything.",
    "Every day you show up is a day closer to your dream college.",
  ],
  accuracy_high: [
    "Your accuracy is in the topper zone. Don't let up.",
    "At this rate, you're gunning for top 5000.",
  ],
  accuracy_low: [
    "Focus on understanding, not just solving. Quality > quantity.",
    "The gap between you and toppers is smaller than you think.",
  ],
  exam_near: [
    "Final sprint. Every question counts double now.",
    "Stay calm, stay focused. You've prepared for this.",
  ],
  general: [
    "Every expert was once a beginner. Today is your day.",
    "One topic at a time. That's how IITians are made.",
    "Your future self will thank you for today's effort.",
  ],
} as const;
