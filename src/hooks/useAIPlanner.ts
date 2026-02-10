/**
 * JEENIUS AI PLANNER — Data Hook
 * Single source of truth. Real Supabase data → Engine → UI State.
 * No mock data. No duplication.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useExamDates } from '@/hooks/useExamDates';
import { toast } from 'sonner';

import type { PlannerState, DayPlan, PlannerTask } from '@/lib/ai-planner/types';
import {
  analyzeTopics, computeBrainScore, predictRank, generateWeekPlan,
  getSubjectBreakdowns, getChapterPriorities, detectWeeklyWins,
  computeAchievements, pickDailyChallenge, computeStats, getGreeting,
  getExamPhase, quickReplan,
} from '@/lib/ai-planner/engine';
import { PLANNER } from '@/lib/ai-planner/constants';

const STORAGE_KEY = 'jeenius_planner_';

function loadCompleted(date: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}${date}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveCompleted(date: string, ids: Set<string>) {
  localStorage.setItem(`${STORAGE_KEY}${date}`, JSON.stringify([...ids]));
}

function defaultState(): PlannerState {
  return {
    studentName: '', targetExam: 'JEE', examDate: '2026-05-24',
    dailyStudyHours: 4,
    brainScore: { overall: 0, dimensions: { conceptual: 0, problemSolving: 0, consistency: 0, examReadiness: 0, growth: 0 }, trend: 'stable', weeklyDelta: 0 },
    rankPrediction: { estimatedRank: 0, rankRange: { min: 0, max: 0 }, confidence: 0, estimatedScore: 0, maxScore: 300, trajectory: 'stable', topColleges: [] },
    stats: {
      daysToExam: 0, examPhase: 'foundation', totalTopicsPracticed: 0,
      masteredCount: 0, strongCount: 0, developingCount: 0, weakCount: 0,
      avgAccuracy: 0, currentStreak: 0, longestStreak: 0,
      todayTasksTotal: 0, todayTasksDone: 0, totalQuestionsAllTime: 0,
      currentXP: 0, level: 1, levelTitle: 'Aspirant', levelIcon: '🌱',
      xpToNextLevel: 500, xpProgress: 0,
    },
    todayPlan: { date: '', dayName: '', dayShort: '', isToday: true, isRestDay: false, tasks: [], totalMinutes: 0, completedMinutes: 0, focusSubject: '' },
    weekPlan: [],
    selectedDayIndex: 0,
    topics: [], subjectBreakdowns: [], chapterPriorities: [],
    weeklyWins: [], achievements: [], dailyChallenge: null,
    greeting: '', motivation: '',
    isLoading: true, hasEnoughData: false, needsDiagnostic: false, totalQuestions: 0,
  };
}

export function useAIPlanner() {
  const { user } = useAuth();
  const { getExamDate } = useExamDates();
  const [state, setState] = useState<PlannerState>(defaultState());
  const loadedRef = useRef(false);
  const todayStr = new Date().toISOString().split('T')[0];

  // ━━━ CORE DATA LOADER ━━━
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Parallel fetch
      const [profileRes, qCountRes, masteryRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('question_attempts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('topic_mastery').select('*').eq('user_id', user.id),
      ]);

      const profile = profileRes.data;
      const totalQuestions = qCountRes.count || 0;
      const rawMastery = masteryRes.data || [];

      // Filter to exam-relevant topics
      const targetExam = profile?.target_exam || 'JEE';
      const { data: validTopics } = await supabase
        .from('questions').select('subject, topic').eq('exam', targetExam);

      const validSet = new Set<string>();
      if (validTopics) for (const q of validTopics) {
        if (q.subject && q.topic) validSet.add(`${q.subject}::${q.topic}`);
      }

      const filtered = validSet.size > 0
        ? rawMastery.filter(t => validSet.has(`${t.subject}::${t.topic}`))
        : rawMastery;

      // Check: enough data or needs diagnostic?
      const needsDiagnostic = totalQuestions < PLANNER.MIN_QUESTIONS && filtered.length < PLANNER.MIN_TOPICS;
      const hasEnoughData = totalQuestions >= PLANNER.MIN_QUESTIONS && filtered.length >= PLANNER.MIN_TOPICS;

      if (!hasEnoughData) {
        setState(prev => ({
          ...prev, isLoading: false, hasEnoughData: false,
          needsDiagnostic, totalQuestions,
          studentName: profile?.full_name || '',
          targetExam, dailyStudyHours: profile?.daily_study_hours || 4,
        }));
        return;
      }

      // ━━━ RUN ENGINE PIPELINE ━━━
      const name = profile?.full_name || '';
      const dailyHours = profile?.daily_study_hours || 4;
      const examDate = profile?.target_exam_date || getExamDate(targetExam) || '2026-05-24';
      const streak = profile?.current_streak || 0;
      const daysToExam = Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000);
      const phase = getExamPhase(daysToExam);

      const topics = analyzeTopics(filtered);
      const avgAccuracy = topics.length > 0
        ? Math.round(topics.reduce((s, t) => s + t.accuracy, 0) / topics.length) : 0;

      const brainScore = computeBrainScore(topics, streak, avgAccuracy, totalQuestions, daysToExam);
      const rankPrediction = predictRank(topics, targetExam, avgAccuracy);

      // Generate week plan (today = index 0)
      let weekPlan = generateWeekPlan(topics, dailyHours, phase);

      // Restore today's completions
      const completed = loadCompleted(todayStr);
      if (completed.size > 0 && weekPlan[0]) {
        weekPlan[0] = {
          ...weekPlan[0],
          tasks: weekPlan[0].tasks.map(t => ({
            ...t,
            status: completed.has(t.id) ? 'completed' as const : t.status,
          })),
          completedMinutes: weekPlan[0].tasks
            .filter(t => completed.has(t.id))
            .reduce((s, t) => s + t.allocatedMinutes, 0),
        };
      }

      const todayPlan = weekPlan[0] || defaultState().todayPlan;
      const subjectBreakdowns = getSubjectBreakdowns(topics);
      const chapterPriorities = getChapterPriorities(topics);
      const weeklyWins = detectWeeklyWins(topics, streak, avgAccuracy, totalQuestions);
      const dailyChallenge = pickDailyChallenge(todayStr);
      const stats = computeStats(topics, profile, daysToExam, todayPlan, totalQuestions);

      // Load unlocked achievements from localStorage
      const unlockedIds: string[] = JSON.parse(localStorage.getItem('jeenius_achievements') || '[]');
      const achievements = computeAchievements(
        streak, totalQuestions, avgAccuracy,
        stats.masteredCount, stats.level, stats.todayTasksDone, unlockedIds,
      );
      // Save newly unlocked
      const newUnlocked = achievements.filter(a => a.unlockedAt).map(a => a.id);
      localStorage.setItem('jeenius_achievements', JSON.stringify(newUnlocked));

      const { greeting, motivation } = getGreeting(name, streak, avgAccuracy, daysToExam, stats.weakCount);

      setState({
        studentName: name, targetExam, examDate, dailyStudyHours: dailyHours,
        brainScore, rankPrediction, stats,
        todayPlan, weekPlan, selectedDayIndex: 0,
        topics, subjectBreakdowns, chapterPriorities,
        weeklyWins, achievements, dailyChallenge,
        greeting, motivation,
        isLoading: false, hasEnoughData: true, needsDiagnostic: false, totalQuestions,
      });
    } catch (err) {
      console.error('Planner load error:', err);
      setState(prev => ({ ...prev, isLoading: false }));
      toast.error('Failed to load study plan');
    }
  }, [user?.id, todayStr, getExamDate]);

  // ━━━ TOGGLE TASK ━━━
  const toggleTask = useCallback((taskId: string) => {
    setState(prev => {
      const updatedTasks = prev.todayPlan.tasks.map(t =>
        t.id === taskId
          ? { ...t, status: (t.status === 'completed' ? 'pending' : 'completed') as PlannerTask['status'] }
          : t
      );

      const completedMins = updatedTasks.filter(t => t.status === 'completed')
        .reduce((s, t) => s + t.allocatedMinutes, 0);

      const newToday: DayPlan = { ...prev.todayPlan, tasks: updatedTasks, completedMinutes: completedMins };
      const completedIds = new Set(updatedTasks.filter(t => t.status === 'completed').map(t => t.id));
      saveCompleted(todayStr, completedIds);

      // Persist to study_schedule
      const task = updatedTasks.find(t => t.id === taskId);
      if (task && user?.id) {
        supabase.from('study_schedule').upsert({
          user_id: user.id, date: todayStr,
          subject: task.subject, chapter: task.chapter, topic: task.topic,
          activity_type: task.type,
          allocated_minutes: task.allocatedMinutes,
          completed_minutes: task.status === 'completed' ? task.allocatedMinutes : 0,
          status: task.status,
        }, { onConflict: 'user_id,date,subject,topic' }).then(() => {});
      }

      const newWeek = [...prev.weekPlan];
      if (newWeek[0]) newWeek[0] = newToday;

      return {
        ...prev,
        todayPlan: newToday,
        weekPlan: newWeek,
        stats: { ...prev.stats, todayTasksDone: updatedTasks.filter(t => t.status === 'completed').length },
      };
    });
  }, [todayStr, user?.id]);

  // ━━━ SELECT DAY ━━━
  const selectDay = useCallback((index: number) => {
    setState(prev => ({ ...prev, selectedDayIndex: index }));
  }, []);

  // ━━━ QUICK REPLAN ━━━
  const replan = useCallback((availableMinutes: number) => {
    setState(prev => {
      const newToday = quickReplan(prev.topics, availableMinutes, prev.stats.examPhase, todayStr);
      const newWeek = [...prev.weekPlan];
      newWeek[0] = { ...newToday, isToday: true };
      return {
        ...prev,
        todayPlan: { ...newToday, isToday: true },
        weekPlan: newWeek,
        stats: { ...prev.stats, todayTasksTotal: newToday.tasks.length, todayTasksDone: 0 },
      };
    });
    toast.success('Plan reshuffled for your available time');
  }, [todayStr]);

  // ━━━ UPDATE SETTINGS ━━━
  const updateSettings = useCallback(async (newHours: number, newExam: string) => {
    if (!user?.id) return;
    try {
      const newExamDate = getExamDate(newExam) || '2026-05-24';
      await supabase.from('profiles').update({
        daily_study_hours: newHours, target_exam: newExam, target_exam_date: newExamDate,
      }).eq('id', user.id);
      toast.success('Settings saved — regenerating plan');
      loadData();
    } catch { toast.error('Failed to update settings'); }
  }, [user?.id, getExamDate, loadData]);

  // ━━━ INIT ━━━
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadData();
    }
  }, [loadData]);

  return { state, toggleTask, selectDay, replan, updateSettings, refresh: loadData };
}
