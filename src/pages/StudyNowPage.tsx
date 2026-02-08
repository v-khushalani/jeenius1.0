import { useNavigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import AIDoubtSolver from '@/components/AIDoubtSolver';
import AdaptiveLevelService from '@/services/adaptiveLevelService';
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from '@/components/Header';
import LoadingScreen from '@/components/ui/LoadingScreen';
import PricingModal from '@/components/PricingModal';
import { MathDisplay } from '@/components/admin/MathDisplay';
import 'katex/dist/katex.min.css';
import {
  Flame, ArrowLeft, Lightbulb, XCircle, CheckCircle2, Target,
  Sparkles, Zap, Play, Lock, TrendingUp
} from "lucide-react";

// Import gamification services
import StreakService from '@/services/streakService';
import UserLimitsService from '@/services/userLimitsService';
import PointsService from '@/services/pointsService';
import { useStreakData } from '@/hooks/useStreakData';
import { logger } from '@/utils/logger';
import { parseGrade, isFoundationGrade, extractGradeFromExamType } from '@/utils/gradeParser';
import { 
  getBatchForStudent, 
  getBatchSubjectsFromDB, 
  getFilteredSubjects, 
  getAllowedSubjects, 
  logBatchConfig,
  getBatchDependencies 
} from '@/utils/batchConfig';
import {
  getPracticeQuestions,
  getChaptersForBatch,
  getTopicsForChapter,
  mapBatchToExamField,
  validateQuestionBelongsToBatch
} from '@/utils/batchQueryBuilder';

const StudyNowPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('subjects');
  
  // 🔧 FIX: Initialize ALL arrays to empty arrays
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0, streak: 0 });
  const [userStats, setUserStats] = useState({ attempted: 0, accuracy: 0 });
  const [showAIModal, setShowAIModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [dailyQuestionsUsed, setDailyQuestionsUsed] = useState(0);
  
  // Gamification states
  const [dailyLimit, setDailyLimit] = useState(20);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePromptType, setUpgradePromptType] = useState('');
  const [upgradePromptData, setUpgradePromptData] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [currentLevel, setCurrentLevel] = useState(1); // Adaptive level

  const { isPremium } = useAuth();

  // Sync isPro state with isPremium from context
  useEffect(() => {
    setIsPro(isPremium);
  }, [isPremium]);

  useEffect(() => {
    initializePage();
  }, []);

  // Re-fetch subjects when profile (grade/target_exam/batch_id) changes
  useEffect(() => {
    if (profile?.target_exam || profile?.grade || profile?.batch_id) {
      logger.info('Profile changed, reloading subjects', { 
        target_exam: profile?.target_exam, 
        grade: profile?.grade,
        batch_id: profile?.batch_id
      });
      fetchSubjects();
    }
  }, [profile?.target_exam, profile?.grade, profile?.batch_id]);

  const initializePage = async () => {
    try {
      await Promise.all([
        loadProfile(),
        fetchSubjects(),
        loadGamificationData()
      ]);
    } catch (error) {
      logger.error('Error initializing page:', error);
    }
  };

  // Load gamification data
  const loadGamificationData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [streakStatus, limit] = await Promise.all([
        StreakService.getStreakStatus(user.id),
        UserLimitsService.getDailyLimit(user.id)
      ]);

      setDailyQuestionsUsed(streakStatus.todayCompleted);
      setDailyLimit(limit);
      setIsPro(isPremium);

      const shouldPrompt = await UserLimitsService.shouldShowUpgradePrompt(user.id);
      if (shouldPrompt.show && !isPremium) {
        setUpgradePromptType(shouldPrompt.promptType);
        setUpgradePromptData(shouldPrompt.data);
      }
    } catch (error) {
      logger.error('Error loading gamification data:', error);
    }
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);
    } catch (error) {
      logger.error('Error loading profile:', error);
    }
  };

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's target exam and grade from profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('target_exam, grade')
        .eq('id', user.id)
        .single();
      
      let targetExam = profileData?.target_exam || 'JEE';
      let userGrade = profileData?.grade || 12;
      
      // Parse grade properly (handles strings like "9th", "9", numbers, etc.)
      userGrade = parseGrade(userGrade);

      // ✅ Normalize Foundation exam
      if (isFoundationGrade(userGrade) && targetExam === 'Foundation') {
        targetExam = `Foundation-${userGrade}`;
      }

      // Get student's batch with its subjects from batch_subjects table
      const batch = await getBatchForStudent(user.id, userGrade, targetExam);
      
      logBatchConfig('fetchSubjects', user.id, userGrade, targetExam, batch);

      // Get allowed subjects for this target exam
      const examSubjects = getAllowedSubjects(targetExam);
      
      // Determine subjects to show
      let subjectsToShow: string[] = [];
      
      if (batch && batch.subjects.length > 0) {
        // Use intersection of allowed subjects (by target_exam) and batch subjects
        subjectsToShow = getFilteredSubjects(targetExam, batch.subjects);
        logger.info('Using batch subjects', {
          targetExam,
          batchSubjects: batch.subjects,
          allowedSubjects: examSubjects,
          filtered: subjectsToShow
        });
      } else {
        // CRITICAL: never fall back to global chapters for Foundation grades.
        // If the Foundation batch isn't configured, we must show nothing (otherwise JEE content leaks).
        if (isFoundationGrade(userGrade)) {
          logger.error('Foundation batch missing/misconfigured for user', {
            userId: user.id,
            userGrade,
            targetExam,
          });
          setSubjects([]);
          toast.error('Your batch is not configured yet. Please contact admin.');
          return;
        }

        // Non-Foundation fallback: derive subjects from JEE/NEET global chapters (batch_id is null)
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('subject')
          .is('batch_id', null);

        if (chaptersError) throw chaptersError;

        subjectsToShow = [...new Set(chaptersData?.map(c => c.subject) || [])]
          .filter(subject => examSubjects.includes(subject));
      }

      // Get questions for counting
      // Use proper exam field mapping for Foundation courses
      const examFieldForQuestions = mapBatchToExamField(targetExam, userGrade);
      logger.info('Fetching questions with exam field', { targetExam, examFieldForQuestions, userGrade });
      
      const { data: allQuestions } = await supabase
        .from('questions')
        .select('subject, difficulty')
        .eq('exam', examFieldForQuestions);

      const { data: userAttempts } = await supabase
        .from('question_attempts')
        .select('*, questions!inner(subject)')
        .eq('user_id', user.id);

      const subjectStats = subjectsToShow.map((subject) => {
        const subjectAttempts = userAttempts?.filter(
          a => a.questions?.subject === subject
        ) || [];

        const attempted = subjectAttempts.length;
        const correct = subjectAttempts.filter(a => a.is_correct).length;
        const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

        const icons = {
          'Physics': '⚛️',
          'Chemistry': '🧪',
          'Mathematics': '📐',
          'Biology': '🧬'
        };

        const colors = {
          'Physics': {
            color: 'from-blue-500 to-indigo-600',
            bgColor: 'from-blue-50 to-indigo-50',
            borderColor: 'border-blue-200'
          },
          'Chemistry': {
            color: 'from-green-500 to-emerald-600',
            bgColor: 'from-green-50 to-emerald-50',
            borderColor: 'border-green-200'
          },
          'Mathematics': {
            color: 'from-purple-500 to-pink-600',
            bgColor: 'from-purple-50 to-pink-50',
            borderColor: 'border-purple-200'
          },
          'Biology': {
            color: 'from-orange-500 to-red-600',
            bgColor: 'from-orange-50 to-red-50',
            borderColor: 'border-orange-200'
          }
        };

        return {
          name: subject,
          emoji: icons[subject] || '📚',
          ...colors[subject],
          attempted,
          accuracy
        };
      });

      const totalAttempted = userAttempts?.length || 0;
      const totalCorrect = userAttempts?.filter(a => a.is_correct).length || 0;
      const overallAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

      setUserStats({ attempted: totalAttempted, accuracy: overallAccuracy });
      setSubjects(subjectStats);

    } catch (error) {
      logger.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const loadChapters = async (subject) => {
    setLoading(true);
    setSelectedSubject(subject);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get user's target exam and grade from profile
      let targetExam = profile?.target_exam || 'JEE';
      let userGrade = profile?.grade || 12;
      
      // Parse grade properly (handles strings like "9th", "9", numbers, etc.)
      userGrade = parseGrade(userGrade);

      // ✅ Normalize Foundation exam types (some profiles store 'Foundation' instead of 'Foundation-9')
      if (isFoundationGrade(userGrade) && targetExam === 'Foundation') {
        targetExam = `Foundation-${userGrade}`;
      }

      logger.info('LoadChapters debug', { targetExam, userGrade, subject });

      // Build chapter query
      let chaptersQuery = supabase
        .from('chapters')
        .select('id, chapter_name, chapter_number, description, difficulty_level, batch_id')
        .eq('subject', subject);

      if (isFoundationGrade(userGrade)) {
        // Resolve student's batch via shared helper (single source of truth)
        const batch = user?.id
          ? await getBatchForStudent(user.id, userGrade, targetExam)
          : null;

        if (!batch?.id) {
          logger.error('Foundation batch missing/misconfigured; refusing to load chapters', {
            userId: user?.id,
            userGrade,
            targetExam,
            subject,
          });
          setChapters([]);
          toast.error('Your batch is not configured yet. Please contact admin.');
          return;
        }

        chaptersQuery = chaptersQuery.eq('batch_id', batch.id);
      } else {
        // For JEE/NEET etc: use global chapters only (batch_id is null)
        chaptersQuery = chaptersQuery.is('batch_id', null);
      }

      chaptersQuery = chaptersQuery.order('chapter_number', { ascending: true });
      const { data: chaptersData, error: chaptersError } = await chaptersQuery;

      if (chaptersError) throw chaptersError;

      // Get questions count per chapter
      // Use proper exam field mapping for Foundation courses
      const examFieldForChapters = mapBatchToExamField(targetExam, userGrade);
      const { data: questionsData } = await supabase
        .from('questions')
        .select('chapter_id, difficulty')
        .eq('subject', subject)
        .eq('exam', examFieldForChapters);

      // Get user attempts for this subject
      const { data: userAttempts } = await supabase
        .from('question_attempts')
        .select('*, questions!inner(subject, chapter_id)')
        .eq('user_id', user?.id)
        .eq('questions.subject', subject);

      const chapterStats = (chaptersData || []).map((chapter) => {
        const chapterQuestions = questionsData?.filter(q => q.chapter_id === chapter.id) || [];

        const chapterAttempts = userAttempts?.filter(
          a => a.questions?.chapter_id === chapter.id
        ) || [];

        const attempted = chapterAttempts.length;
        const correct = chapterAttempts.filter(a => a.is_correct).length;
        const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
        const progress = chapterQuestions.length > 0 ? Math.min(100, Math.round((attempted / chapterQuestions.length) * 100)) : 0;

        return {
          id: chapter.id,
          name: chapter.chapter_name,
          sequence: chapter.chapter_number,
          description: chapter.description,
          attempted,
          accuracy,
          progress,
          isLocked: false
        };
      });

      setChapters(chapterStats);
      setView('chapters');

    } catch (error) {
      logger.error('Error fetching chapters:', error);
      toast.error('Failed to load chapters');
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async (chapter) => {
    setLoading(true);
    setSelectedChapter(chapter);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get user's target exam from profile
      let targetExam = profile?.target_exam || 'JEE';
      const userGrade = parseGrade(profile?.grade || 12);

      // Normalize Foundation exam
      if (isFoundationGrade(userGrade) && targetExam === 'Foundation') {
        targetExam = `Foundation-${userGrade}`;
      }
      
      // Use proper exam field mapping for Foundation courses
      const examFieldForTopics = mapBatchToExamField(targetExam, userGrade);
      logger.info('LoadTopics debug', { targetExam, examFieldForTopics, selectedSubject, chapter });

      const { data, error } = await supabase
        .from('questions')
        .select('topic, difficulty')
        .eq('subject', selectedSubject)
        .eq('chapter', chapter)
        .eq('exam', examFieldForTopics);

      if (error) throw error;

      const uniqueTopics = [...new Set(data?.map(q => q.topic).filter(Boolean) || [])];

      if (uniqueTopics.length === 0) {
        startPractice(null);
        return;
      }

      const { data: userAttempts } = await supabase
        .from('question_attempts')
        .select('*, questions!inner(subject, chapter, topic)')
        .eq('user_id', user?.id)
        .eq('questions.subject', selectedSubject)
        .eq('questions.chapter', chapter);

      const topicStats = uniqueTopics.map((topic) => {
        const topicAttempts = userAttempts?.filter(
          a => a.questions?.topic === topic
        ) || [];

        const attempted = topicAttempts.length;
        const correct = topicAttempts.filter(a => a.is_correct).length;
        const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

        return {
          name: topic,
          attempted,
          accuracy
        };
      });

      setTopics(topicStats);
      setView('topics');
    } catch (error) {
      logger.error('Error fetching topics:', error);
      toast.error('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const startPractice = async (topic = null) => {
    setLoading(true);
    setSelectedTopic(topic);
    setQuestionStartTime(Date.now());

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get target exam - consistent with loadChapters logic
      let targetExam = profile?.target_exam || 'JEE';
      const userGrade = parseGrade(profile?.grade || 12);

      // Normalize Foundation exam
      if (isFoundationGrade(userGrade) && targetExam === 'Foundation') {
        targetExam = `Foundation-${userGrade}`;
      }
      
      // Use proper exam field mapping for Foundation courses
      const examFieldForPractice = mapBatchToExamField(targetExam, userGrade);
      logger.info('StartPractice debug', { targetExam, examFieldForPractice, selectedSubject, selectedChapter, topic });
      
      // ✅ CHECK DAILY LIMIT BEFORE STARTING PRACTICE
      if (!isPremium) {
        const today = new Date().toISOString().split('T')[0];
        const { count } = await supabase
          .from('question_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lte('created_at', `${today}T23:59:59.999Z`);

        const questionsToday = count || 0;
        
        if (questionsToday >= 15) {
          toast.error('Daily limit reached! You\'ve solved 15 questions today.');
          setShowUpgradeModal(true);
          setUpgradePromptType('daily_limit_reached');
          setLoading(false);
          return;
        }
      }

      // Get user's current level for this topic (starts at easy/1)
      const userLevel = await AdaptiveLevelService.getTopicLevel(
        user.id,
        selectedSubject,
        selectedChapter,
        topic || selectedChapter
      );
      
      setCurrentLevel(userLevel);
      
      // Map level to difficulty (database uses 'Easy', 'Medium', 'Hard')
      const difficultyMap = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
      const difficultyNames = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
      const targetDifficulty = difficultyMap[userLevel as keyof typeof difficultyMap] || 'Easy';

      // Show level info
      toast.info(`Starting at ${difficultyNames[userLevel as keyof typeof difficultyNames]} level`, { duration: 2000 });

      // For adaptive learning, allow re-attempts at different difficulty levels
      // Only exclude questions attempted at the CURRENT difficulty level
      const { data: attemptedAtLevel } = await supabase
        .from('question_attempts')
        .select('question_id, questions!inner(difficulty)')
        .eq('user_id', user.id)
        .eq('questions.difficulty', targetDifficulty);

      const attemptedIds = attemptedAtLevel?.map(a => a.question_id) || [];

      let query = supabase
        .from('questions')
        .select('*')
        .eq('subject', selectedSubject)
        .eq('chapter', selectedChapter)
        .eq('difficulty', targetDifficulty)
        .eq('exam', examFieldForPractice);

      if (attemptedIds.length > 0) {
        query = query.not('id', 'in', `(${attemptedIds.join(',')})`);
      }

      if (topic) {
        query = query.eq('topic', topic);
      }

      const { data, error } = await query;
      if (error) throw error;

      // If no questions at current level, allow level progression
      if (!data || data.length === 0) {
        const nextLevel = Math.min(userLevel + 1, 3);
        if (nextLevel > userLevel) {
          const nextDifficulty = difficultyMap[nextLevel as keyof typeof difficultyMap];
          toast.success(`Level up! Moving to ${difficultyNames[nextLevel as keyof typeof difficultyNames]} level!`, { duration: 2000 });
          
          // Update user's level in database
          await AdaptiveLevelService.updateTopicLevel(
            user.id,
            selectedSubject,
            selectedChapter,
            topic || selectedChapter,
            true // Mark as correct to trigger level up
          );
          
          let nextQuery = supabase
            .from('questions')
            .select('*')
            .eq('subject', selectedSubject)
            .eq('chapter', selectedChapter)
            .eq('difficulty', nextDifficulty)
            .eq('exam', examFieldForPractice);
          
          if (topic) {
            nextQuery = nextQuery.eq('topic', topic);
          }
          
          const { data: nextData } = await nextQuery;
          if (nextData && nextData.length > 0) {
            setCurrentLevel(nextLevel);
            const shuffled = nextData.sort(() => Math.random() - 0.5);
            setPracticeQuestions(shuffled);
            setCurrentQuestionIndex(0);
            setSessionStats({ correct: 0, total: 0, streak: 0 });
            setSelectedAnswer(null);
            setShowResult(false);
            setView('practice');
            setLoading(false);
            return;
          }
        }
        
        toast.info('🎉 You\'ve completed all available questions!');
        setLoading(false);
        return;
      }

      const shuffled = data.sort(() => Math.random() - 0.5);

      setPracticeQuestions(shuffled); // All questions, no 25 limit
      setCurrentQuestionIndex(0);
      setSessionStats({ correct: 0, total: 0, streak: 0 });
      setSelectedAnswer(null);
      setShowResult(false);
      setView('practice');
    } catch (error) {
      logger.error('Error starting practice:', error);
      toast.error('Failed to start practice');
    } finally {
      setLoading(false);
    }
  };

const handleAnswer = async (answer: string) => {
  if (isSubmitting || showResult) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  // ✅ CHECK DAILY LIMIT BEFORE ALLOWING ANSWER (for non-premium users)
  if (!isPremium) {
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('question_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lte('created_at', `${today}T23:59:59.999Z`);

    const questionsToday = count || 0;
    
    if (questionsToday >= 15) {
      toast.error('Daily limit reached! You\'ve solved 15 questions today.');
      setShowUpgradeModal(true);
      setUpgradePromptType('daily_limit_reached');
      return;
    }
  }

  // ✅ INSTANT UI feedback - NO BLOCKING CHECKS
  setIsSubmitting(true);
  setSelectedAnswer(answer);
  setShowResult(true);

  const question = practiceQuestions[currentQuestionIndex];
  const correctLetter = question.correct_option.replace('option_', '').toUpperCase();
  const isCorrect = answer === correctLetter;
  const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

  // Update session stats immediately
  setSessionStats(prev => ({
    correct: prev.correct + (isCorrect ? 1 : 0),
    total: prev.total + 1,
    streak: isCorrect ? prev.streak + 1 : 0
  }));

  try {
    // Check for duplicate attempt
    const { data: existingAttempt } = await supabase
      .from('question_attempts')
      .select('id')
      .eq('user_id', user.id)
      .eq('question_id', question.id)
      .maybeSingle();

    if (existingAttempt) {
      logger.warn('Already attempted - skipping');
      setIsSubmitting(false);
      setTimeout(() => nextQuestion(), 800);
      return;
    }

    // PARALLEL execution - faster!
    const [, pointsResult] = await Promise.all([
      // Insert attempt
      supabase.from('question_attempts').insert({
        user_id: user.id,
        question_id: question.id,
        selected_option: `option_${answer.toLowerCase()}`,
        is_correct: isCorrect,
        time_taken: timeSpent,
        mode: 'study'
      }),
      
      // Calculate points
      PointsService.calculatePoints(
        user.id,
        question.difficulty,
        isCorrect,
        timeSpent
      )
    ]);

    // Update adaptive level and topic mastery (NON-BLOCKING)
    AdaptiveLevelService.updateTopicLevel(
      user.id,
      question.subject,
      question.chapter,
      question.topic || question.chapter,
      isCorrect
    ).then(levelResult => {
      if (levelResult.leveledUp && levelResult.message) {
        toast.success(levelResult.message, { duration: 3000 });
        setCurrentLevel(levelResult.newLevel);
      }
    }).catch(error => logger.error('Level update failed (queued)', error));

    // Update topic mastery for AI Study Planner (NON-BLOCKING)
    supabase.functions.invoke('calculate-topic-mastery', {
      body: {
        subject: question.subject,
        chapter: question.chapter,
        topic: question.topic
      }
    }).catch(error => logger.error('Topic mastery update failed (queued)', error));

    // ✅ Check limits AFTER submission (non-blocking UX)
    UserLimitsService.canSolveMore(user.id).then(canSolve => {
      if (!canSolve.canSolve) {
        setShowUpgradeModal(true);
        setUpgradePromptType('daily_limit_reached');
      }
    }).catch(e => logger.error('Limit check error', e));

    // Update streak in background (non-blocking)
    setTimeout(() => {
      Promise.all([
        StreakService.updateProgress(user.id),
        loadGamificationData()
      ]).catch(err => logger.error('Background update error', err));
    }, 500);

  } catch (error) {
    logger.error('Error in handleAnswer', error);
    toast.error('Something went wrong!');
  } finally {
    setIsSubmitting(false);
    // Auto-advance to next question (faster!)
    setTimeout(() => nextQuestion(), 600);
  }
};

  
  const nextQuestion = () => {
    if (currentQuestionIndex < practiceQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setQuestionStartTime(Date.now());
    } else {
      // Session complete - no forced end
      const accuracy = sessionStats.total > 0 ? (sessionStats.correct / sessionStats.total) * 100 : 0;
      toast.success(`🎉 Great work! Score: ${sessionStats.correct}/${sessionStats.total} (${Math.round(accuracy)}%)`, {
        duration: 4000
      });
      // Load more questions at current level
      startPractice(selectedTopic);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }

  // PRACTICE VIEW
  if (view === 'practice' && practiceQuestions.length > 0) {
    const question = practiceQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / practiceQuestions.length) * 100;

    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
        <Header />
        <div className="flex-1 overflow-auto pt-14 sm:pt-16 pb-4 sm:pb-6">
          <div className="container mx-auto px-3 sm:px-4 max-w-3xl">
            <div className="mb-2 sm:mb-3">
              <Button
                variant="outline"
                className="border-2 border-blue-600 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                onClick={() => setView('topics')}
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Back
              </Button>
            </div>

            {!isPro && (
              <Card className="mb-3 sm:mb-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200 shadow-lg">
                <CardContent className="p-2 sm:p-3">
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Target className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 shrink-0" />
                        <div className="text-xs sm:text-sm font-bold text-orange-900">
                          Daily: {dailyQuestionsUsed}/{dailyLimit}
                        </div>
                      </div>
                      <div className="mt-1 sm:mt-2 w-full rounded-full bg-orange-200 h-1.5 sm:h-2">
                        <div
                          className="h-1.5 sm:h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                          style={{ width: `${Math.min(100, (dailyQuestionsUsed / dailyLimit) * 100)}%` }}
                        />
                      </div>
                      <div className="text-[10px] sm:text-xs text-orange-700 mt-1 sm:mt-2 truncate">
                        {dailyQuestionsUsed >= dailyLimit - 5 ? (
                          <span className="font-semibold">⚠️ Almost at limit!</span>
                        ) : (
                          <span>Upgrade for unlimited!</span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Button
                        onClick={() => setShowUpgradeModal(true)}
                        className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-sm shadow-lg"
                      >
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Upgrade</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {showPointsAnimation && (
              <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full shadow-2xl text-2xl font-bold">
                  +{pointsEarned} points! ⚡
                </div>
              </div>
            )}

            <Card className="mb-3 sm:mb-4 border border-slate-200 shadow-2xl bg-white/90">
              <CardContent className="p-2 sm:p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
                    <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] sm:text-xs">
                      {`Q ${currentQuestionIndex + 1}/${practiceQuestions.length}`}
                    </Badge>
                    <Badge className={`text-[10px] sm:text-xs font-semibold ${
                      currentLevel === 1 ? 'bg-green-100 text-green-700 border-green-300' :
                      currentLevel === 2 ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                      'bg-red-100 text-red-700 border-red-300'
                    }`}>
                      {currentLevel === 1 ? '🟢 Easy' : currentLevel === 2 ? '🟡 Med' : '🔴 Hard'}
                    </Badge>
                    <div className="text-[10px] sm:text-sm text-slate-500 hidden sm:block">
                      {selectedSubject} • {selectedChapter}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm sm:text-lg font-bold text-gray-900">
                      {sessionStats.correct}/{sessionStats.total}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500">
                      {sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-3 sm:mb-4 border border-slate-200 shadow-2xl bg-white">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm sm:text-base shrink-0">
                    {currentQuestionIndex + 1}
                  </div>
                  <h2 className="text-sm sm:text-lg md:text-xl font-extrabold text-slate-900">
                    <MathDisplay text={question.question} />
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:gap-3">
                  {['option_a','option_b','option_c','option_d'].map((key, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const isSelected = selectedAnswer === letter;
                    const correctLetter = question.correct_option.replace('option_', '').toUpperCase();
                    const isCorrect = letter === correctLetter;

                    let baseClass = 'w-full text-left p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all touch-target';
                    if (showResult) {
                      if (isCorrect) {
                        baseClass += ' border-green-500 bg-gradient-to-r from-green-50 to-emerald-50';
                      } else if (isSelected) {
                        baseClass += ' border-red-500 bg-gradient-to-r from-red-50 to-orange-50';
                      } else {
                        baseClass += ' border-gray-200 opacity-60';
                      }
                    } else {
                      baseClass += isSelected
                        ? ' border-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50'
                        : ' border-gray-300 hover:border-blue-500 hover:bg-blue-50/30 active:bg-blue-100';
                    }

                    return (
                      <button
                        key={key}
                        onClick={() => handleAnswer(letter)}
                        disabled={showResult || isSubmitting}
                        className={baseClass}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shadow shrink-0 ${
                              showResult && isCorrect ? 'bg-green-500 text-white' : 
                              showResult && isSelected && !isCorrect ? 'bg-red-500 text-white' : 
                              isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-slate-700'
                            }`}>
                              {letter}
                            </div>
                            <div className="text-xs sm:text-sm font-medium text-slate-900">
                              <MathDisplay text={question[key]} />
                            </div>
                          </div>

                          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                            {showResult && isCorrect && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />}
                            {showResult && isSelected && !isCorrect && <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 sm:mt-4 flex justify-center">
                  <Button 
                    onClick={() => setShowAIModal(true)} 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm shadow-lg"
                  >
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 inline" />
                    Ask AI
                  </Button>
                </div>

                {showResult && question.explanation && (
                  <div className="mt-3 sm:mt-4 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-blue-900 mb-1 text-sm">Explanation</p>
                        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                          <MathDisplay text={question.explanation} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <PricingModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          limitType="daily_limit"
        />

        <AIDoubtSolver
          question={practiceQuestions[currentQuestionIndex]}
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
        />
      </div>
    );
  }

  // SUBJECTS VIEW
  if (view === 'subjects') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="pt-16 sm:pt-20 pb-6 md:pb-10">
          <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Learn & Practice</h1>
              <p className="text-slate-600">Choose a subject to get started</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {subjects.map((subject) => (
                <Card
                  key={subject.name}
                  onClick={() => loadChapters(subject.name)}
                  className={`group cursor-pointer transform hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden`}
                >
                  <div className={`p-6 sm:p-8 text-center bg-gradient-to-br ${subject.bgColor}`}>
                    <div className="text-4xl sm:text-6xl mb-3">{subject.emoji}</div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{subject.name}</h3>
                  </div>

                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3">
                      <div className="text-center">
                        <p className="text-sm text-slate-600">Master this subject</p>
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 text-sm font-semibold rounded-lg transition-all"
                        onClick={() => loadChapters(subject.name)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Learning
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CHAPTERS VIEW
  if (view === 'chapters') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="pt-16 sm:pt-20 pb-6 md:pb-10">
          <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => setView('subjects')}
                className="border-2 border-blue-600 text-slate-900 font-semibold hover:bg-blue-50 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Subjects
              </Button>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-1">{selectedSubject}</h1>
              <p className="text-slate-600">Choose a chapter to learn</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {chapters.map((chapter) => {
                if (chapter.isLocked) {
                  return (
                    <Card
                      key={chapter.name}
                      className="relative border-0 shadow-lg overflow-hidden opacity-50 cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center z-10 p-4">
                        <div className="text-center">
                          <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <div className="font-bold text-sm text-slate-600">Unlock with Premium</div>
                        </div>
                      </div>

                      <div className="p-6 bg-gradient-to-br from-slate-100 to-slate-200">
                        <h3 className="font-bold text-lg text-slate-700">{chapter.name}</h3>
                      </div>

                      <CardContent className="p-4">
                        <Button className="w-full bg-slate-300 text-slate-600 cursor-not-allowed" disabled>
                          <Lock className="w-4 h-4 mr-2" />
                          Locked
                        </Button>
                      </CardContent>
                    </Card>
                  );
                }

                // Check if this is a Foundation course (no topics needed)
                const isFoundationCourse = profile?.target_exam?.startsWith('Foundation-') || 
                                          profile?.target_exam === 'Scholarship' ||
                                          profile?.target_exam === 'Olympiad';

                return (
                  <Card
                    key={chapter.name}
                    onClick={() => {
                      if (isFoundationCourse) {
                        // For Foundation courses, directly start practice
                        startPractice(chapter.name);
                      } else {
                        // For other courses, load topics
                        loadTopics(chapter.name);
                      }
                    }}
                    className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden"
                  >
                    <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 transition-colors">
                      <h3 className="font-bold text-xl text-slate-900">{chapter.name}</h3>
                      {chapter.description && (
                        <p className="text-sm text-slate-600 mt-1">{chapter.description}</p>
                      )}
                    </div>

                    <CardContent className="p-4">
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold transition-all" 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isFoundationCourse) {
                            startPractice(chapter.name);
                          } else {
                            loadTopics(chapter.name);
                          }
                        }}
                      >
                        {isFoundationCourse ? (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Start Practicing
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Explore Topics
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TOPICS VIEW
  if (view === 'topics') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="pt-16 sm:pt-20 pb-6 md:pb-10">
          <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => setView('chapters')}
                className="border-2 border-blue-600 text-slate-900 font-semibold hover:bg-blue-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Chapters
              </Button>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Topics</h2>
              <p className="text-slate-600 mt-1">Choose a topic to practice</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topics.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-slate-400 text-lg">No topics available</div>
                </div>
              ) : (
                topics.map((topic) => (
                  <Card
                    key={topic.name}
                    onClick={() => startPractice(topic.name)}
                    className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden"
                  >
                    <div className="p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 hover:from-purple-100 hover:via-pink-100 hover:to-indigo-100 transition-colors">
                      <h3 className="font-bold text-lg text-slate-900">{topic.name}</h3>
                    </div>

                    <CardContent className="p-4">
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          startPractice(topic.name);
                        }}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Practice
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default StudyNowPage;
