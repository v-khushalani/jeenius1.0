/**
 * Smart Study Planner — Data Hook
 * Fetches real student data from Supabase. Zero mock data.
 * Computes everything from actual performance metrics.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useExamDates } from '@/hooks/useExamDates';
import { toast } from 'sonner';

import type { SmartPlannerState, DayPlan, PlannerTask } from '@/lib/planner/types';
import {
  analyzeTopics,
  computeTimeAllocation,
  generateTodayPlan,
  generateWeekPlan,
  getRevisionDue,
  detectWeeklyWins,
  getSubjectBreakdowns,
  computeStats,
  getGreeting,
} from '@/lib/planner/engine';

const MIN_QUESTIONS = 10;
const STORAGE_PREFIX = 'jeenius_planner_';

// Persist completed task IDs per day in localStorage
function getCompletedTasks(dateStr: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${dateStr}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveCompletedTasks(dateStr: string, ids: Set<string>) {
  localStorage.setItem(`${STORAGE_PREFIX}${dateStr}`, JSON.stringify([...ids]));
}

function getDefaultState(): SmartPlannerState {
  return {
    studentName: '',
    targetExam: 'JEE',
    examDate: '2026-05-24',
    dailyStudyHours: 4,
    stats: {
      daysToExam: 0, journeyPercent: 0, totalTopicsPracticed: 0,
      masteredCount: 0, strongCount: 0, improvingCount: 0, weakCount: 0,
      avgAccuracy: 0, currentStreak: 0, todayTasksTotal: 0, todayTasksDone: 0,
      weeklyStudyMinutes: 0,
    },
    todayPlan: { date: '', dayName: '', dayShort: '', isToday: true, isRestDay: false, tasks: [], totalMinutes: 0, completedMinutes: 0 },
    weekPlan: [],
    revisionDue: [],
    weeklyWins: [],
    topics: [],
    subjectBreakdowns: [],
    timeAllocation: { study: 0.6, revision: 0.25, practice: 0.15 },
    greeting: '',
    motivation: '',
    isLoading: true,
    hasEnoughData: false,
    totalQuestions: 0,
  };
}

export function useSmartPlanner() {
  const { user } = useAuth();
  const { getExamDate } = useExamDates();
  const [state, setState] = useState<SmartPlannerState>(getDefaultState());
  const loadedRef = useRef(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // ── Core data loader ──
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Parallel fetch: profile + question count + topic mastery
      const [profileRes, questionsRes, topicMasteryRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('question_attempts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('topic_mastery').select('*').eq('user_id', user.id),
      ]);

      const profile = profileRes.data;
      const totalQuestions = questionsRes.count || 0;
      const rawTopicMastery = topicMasteryRes.data || [];

      // Not enough data check
      if (totalQuestions < MIN_QUESTIONS || rawTopicMastery.length < 3) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          hasEnoughData: false,
          totalQuestions,
          studentName: profile?.full_name || '',
          targetExam: profile?.target_exam || 'JEE',
          dailyStudyHours: profile?.daily_study_hours || 4,
        }));
        return;
      }

      // ── Process data through engine ──
      const studentName = profile?.full_name || '';
      const targetExam = profile?.target_exam || 'JEE';
      const dailyHours = profile?.daily_study_hours || 4;
      const examDate = profile?.target_exam_date || getExamDate(targetExam) || '2026-05-24';
      const streak = profile?.current_streak || 0;
      const avgAccuracy = profile?.overall_accuracy || 0;

      const daysToExam = Math.ceil(
        (new Date(examDate).getTime() - Date.now()) / 86400000
      );

      const topics = analyzeTopics(rawTopicMastery);
      const allocation = computeTimeAllocation(daysToExam);

      // Generate today's plan
      let todayPlan = generateTodayPlan(topics, dailyHours, allocation, todayStr);

      // Restore completed tasks from localStorage
      const completed = getCompletedTasks(todayStr);
      if (completed.size > 0) {
        todayPlan = {
          ...todayPlan,
          tasks: todayPlan.tasks.map(t => ({
            ...t,
            status: completed.has(t.id) ? 'completed' as const : t.status,
          })),
          completedMinutes: todayPlan.tasks
            .filter(t => completed.has(t.id))
            .reduce((s, t) => s + t.allocatedMinutes, 0),
        };
      }

      const weekPlan = generateWeekPlan(topics, dailyHours, allocation);
      // Today in week gets the completed status too
      if (weekPlan[0]) {
        weekPlan[0] = todayPlan;
      }

      const revisionDue = getRevisionDue(topics);
      const weeklyWins = detectWeeklyWins(topics, streak, avgAccuracy, totalQuestions);
      const subjectBreakdowns = getSubjectBreakdowns(topics);
      const stats = computeStats(topics, profile, daysToExam, todayPlan);
      const { greeting, motivation } = getGreeting(
        studentName, streak, avgAccuracy, daysToExam,
        topics.filter(t => t.status === 'weak').length
      );

      setState({
        studentName,
        targetExam,
        examDate,
        dailyStudyHours: dailyHours,
        stats,
        todayPlan,
        weekPlan,
        revisionDue,
        weeklyWins,
        topics,
        subjectBreakdowns,
        timeAllocation: allocation,
        greeting,
        motivation,
        isLoading: false,
        hasEnoughData: true,
        totalQuestions,
      });
    } catch (error) {
      console.error('Smart planner load error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast.error('Failed to load study plan');
    }
  }, [user?.id, todayStr, getExamDate]);

  // ── Toggle task completion ──
  const toggleTask = useCallback((taskId: string) => {
    setState(prev => {
      const updatedTasks = prev.todayPlan.tasks.map(t =>
        t.id === taskId
          ? { ...t, status: (t.status === 'completed' ? 'pending' : 'completed') as PlannerTask['status'] }
          : t
      );

      const completedMins = updatedTasks
        .filter(t => t.status === 'completed')
        .reduce((s, t) => s + t.allocatedMinutes, 0);

      const newTodayPlan: DayPlan = {
        ...prev.todayPlan,
        tasks: updatedTasks,
        completedMinutes: completedMins,
      };

      // Persist to localStorage
      const completedIds = new Set(
        updatedTasks.filter(t => t.status === 'completed').map(t => t.id)
      );
      saveCompletedTasks(todayStr, completedIds);

      // Persist to study_schedule (fire and forget)
      const task = updatedTasks.find(t => t.id === taskId);
      if (task && user?.id) {
        supabase.from('study_schedule').upsert({
          user_id: user.id,
          date: todayStr,
          subject: task.subject,
          chapter: task.chapter,
          topic: task.topic,
          activity_type: task.type,
          allocated_minutes: task.allocatedMinutes,
          completed_minutes: task.status === 'completed' ? task.allocatedMinutes : 0,
          status: task.status,
        }, { onConflict: 'user_id,date,subject,topic' }).then(() => {});
      }

      // Update week plan too (today = index 0)
      const newWeekPlan = [...prev.weekPlan];
      if (newWeekPlan[0]) newWeekPlan[0] = newTodayPlan;

      const newStats = {
        ...prev.stats,
        todayTasksDone: updatedTasks.filter(t => t.status === 'completed').length,
      };

      return {
        ...prev,
        todayPlan: newTodayPlan,
        weekPlan: newWeekPlan,
        stats: newStats,
      };
    });
  }, [todayStr, user?.id]);

  // ── Update settings ──
  const updateSettings = useCallback(async (
    newHours: number,
    newExam: string,
  ) => {
    if (!user?.id) return;
    try {
      const newExamDate = getExamDate(newExam) || '2026-05-24';
      await supabase.from('profiles').update({
        daily_study_hours: newHours,
        target_exam: newExam,
        target_exam_date: newExamDate,
      }).eq('id', user.id);

      toast.success('Settings saved — plan regenerated');
      loadData(); // Regenerate everything
    } catch {
      toast.error('Failed to update settings');
    }
  }, [user?.id, getExamDate, loadData]);

  // ── Initial load ──
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadData();
    }
  }, [loadData]);

  return {
    state,
    toggleTask,
    updateSettings,
    refresh: loadData,
  };
}
