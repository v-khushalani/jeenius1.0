import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Header from '@/components/Header';
import LoadingScreen from '@/components/ui/LoadingScreen';
import {
  BookOpen, Trophy, Play, Clock, Target, FileText, ArrowLeft, CheckCircle2,
  Brain, Sparkles, Crown, Award
} from "lucide-react";
import PricingModal from '@/components/PricingModal';
import { logger } from '@/utils/logger';
import { parseGrade, isFoundationGrade, extractGradeFromExamType } from '@/utils/gradeParser';
import { 
  getBatchForStudent, 
  getBatchSubjectsFromDB, 
  getFilteredSubjects, 
  getAllowedSubjects, 
  logBatchConfig 
} from '@/utils/batchConfig';
import {
  getTestSeriesQuestions,
  mapBatchToExamField
} from '@/utils/batchQueryBuilder';

const TestPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [testMode, setTestMode] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState({});
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [availableChapters, setAvailableChapters] = useState([]);
  const [profile, setProfile] = useState(null);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { isPremium } = useAuth();
  const [monthlyTestsUsed, setMonthlyTestsUsed] = useState(0);
  const MONTHLY_LIMIT_FREE = 2;

  useEffect(() => {
    loadProfile();
    checkMonthlyUsage();
  }, [isPremium]);

  useEffect(() => {
    if (profile) {
      logger.info('TestPage: Profile changed, reloading subjects/chapters', {
        target_exam: profile?.target_exam,
        grade: profile?.grade,
        batch_id: profile?.batch_id
      });
      fetchSubjectsAndChapters();
    }
  }, [profile?.target_exam, profile?.grade, profile?.batch_id]);

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

  const fetchSubjectsAndChapters = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's target exam and grade for subject/chapter filtering
      let targetExam = profile?.target_exam || 'JEE';
      let userGrade = profile?.grade || 12;
      
      // Parse grade properly (handles strings like "9th", "9", numbers, etc.)
      userGrade = parseGrade(userGrade);

      // Normalize Foundation exam
      if (isFoundationGrade(userGrade) && targetExam === 'Foundation') {
        targetExam = `Foundation-${userGrade}`;
      }
      
      // Get student's batch with its subjects from batch_subjects table
      const batch = await getBatchForStudent(user.id, userGrade, targetExam);
      
      logBatchConfig('fetchSubjectsAndChapters', user.id, userGrade, targetExam, batch);

      // Get allowed subjects for this target exam
      const examSubjects = getAllowedSubjects(targetExam);
      
      // Determine subjects to show
      let subjectsToShow: string[] = [];
      
      if (!batch && user?.id) {
        // Batch not found - try to create it automatically
        logger.info('Batch not found, attempting auto-creation...', { targetExam, userGrade });
        
        try {
          const examType = isFoundationGrade(userGrade) ? 'Foundation' : (targetExam?.includes('NEET') ? 'NEET' : 'JEE');
          
          // Subject map for batch creation
          const subjectMap: { [key: string]: string[] } = {
            'Foundation': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
            'JEE': ['Physics', 'Chemistry', 'Mathematics'],
            'NEET': ['Physics', 'Chemistry', 'Biology'],
          };

          // Try to create batch
          const { data: newBatch } = await supabase
            .from('batches')
            .insert({
              name: `Grade ${userGrade} - ${examType}`,
              exam_type: examType,
              grade: userGrade,
              description: `Grade ${userGrade} - ${examType} Study Material`,
              is_active: true,
              is_free: true,
              display_order: userGrade,
            })
            .select('id')
            .single();

          if (newBatch) {
            // Add subjects
            const subjects = subjectMap[examType] || [];
            await supabase
              .from('batch_subjects')
              .insert(
                subjects.map((subject, index) => ({
                  batch_id: newBatch.id,
                  subject,
                  display_order: index + 1,
                }))
              );

            batch = {
              id: newBatch.id,
              name: `Grade ${userGrade} - ${examType}`,
              slug: `grade-${userGrade}-${examType.toLowerCase()}`,
              grade: userGrade,
              exam_type: examType,
              subjects: subjects,
            };

            logger.info('✅ Batch created automatically:', newBatch.id);
          }
        } catch (error) {
          logger.warn('Could not auto-create batch:', error);
        }
      }
      
      if (batch && batch.subjects.length > 0) {
        // Use intersection of allowed subjects (by target_exam) and batch subjects
        subjectsToShow = getFilteredSubjects(targetExam, batch.subjects);
      } else {
        // No batch found and couldn't create one
        if (isFoundationGrade(userGrade)) {
          // For Foundation grades, require batch subscription - no fallback
          logger.error('Foundation batch not available', {
            userId: user.id,
            userGrade,
            targetExam,
          });
          toast.error('Foundation batch is required for tests. Please complete your profile setup.');
          setShowUpgradeModal(true);
          setLoading(false);
          return;
        } else {
          // For JEE/NEET grades 11-12, batch is required
          logger.error('JEE/NEET batch not found for grade', {
            userId: user.id,
            userGrade,
            targetExam,
          });
          toast.error('Test batch not configured for your grade. Please contact support.');
          setShowUpgradeModal(true);
          setLoading(false);
          return;
        }
      }

      // Get all chapters for the selected subjects
      let chaptersQuery = supabase
        .from('chapters')
        .select('id, subject, chapter_name, chapter_number, batch_id')
        .in('subject', subjectsToShow)
        .order('chapter_number');

      // For Foundation students, filter chapters by their batch
      if (isFoundationGrade(userGrade)) {
        if (batch && batch.id) {
          chaptersQuery = chaptersQuery.eq('batch_id', batch.id);
        }
      } else {
        // For JEE/NEET: use grade-specific batch filtering
        if (batch && batch.id) {
          chaptersQuery = chaptersQuery.eq('batch_id', batch.id);
        } else {
          // Fallback: No batch found for JEE/NEET grade 11-12
          logger.warn('No batch found for JEE/NEET student', { grade: userGrade, targetExam });
          toast.error('JEE/NEET batch not configured');
          setShowUpgradeModal(true);
          setLoading(false);
          return;
        }
      }

      const { data: chaptersData, error: chaptersError } = await chaptersQuery;
      
      if (chaptersError) throw chaptersError;

      const chaptersBySubject: Record<string, string[]> = {};
      
      subjectsToShow.forEach(subject => {
        const subjectChapters = chaptersData
          ?.filter(c => c.subject === subject)
          .map(c => c.chapter_name) || [];
        chaptersBySubject[subject] = subjectChapters;
      });

      setSubjects(subjectsToShow);
      setChapters(chaptersBySubject);
    } catch (error) {
      logger.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const checkMonthlyUsage = async () => {
    // Skip check for premium users
    if (isPremium) {
      setMonthlyTestsUsed(0);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get start of current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Count test attempts this month
      const { count, error } = await supabase
        .from('test_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());
      
      if (error) {
        logger.error('Error counting test attempts:', error);
        setMonthlyTestsUsed(0);
        return;
      }
      
      setMonthlyTestsUsed(count || 0);
      logger.info('Monthly test usage:', { count, limit: MONTHLY_LIMIT_FREE });
    } catch (error) {
      logger.error('Error checking monthly usage:', error);
      setMonthlyTestsUsed(0);
    }
  };
  
  const handleSubjectToggle = (subject) => {
    setSelectedSubjects(prev => {
      const newSelection = prev.includes(subject) 
        ? prev.filter(s => s !== subject) : [...prev, subject];
      const newChapters = newSelection.flatMap(s => 
        chapters[s]?.map(ch => ({ subject: s, chapter: ch })) || []
      );
      setAvailableChapters(newChapters);
      setSelectedChapters(prevChapters => 
        prevChapters.filter(ch => newChapters.some(nc => nc.subject === ch.subject && nc.chapter === ch.chapter))
      );
      return newSelection;
    });
  };

  const handleChapterToggle = (subject, chapter) => {
    setSelectedChapters(prev => {
      const exists = prev.some(ch => ch.subject === subject && ch.chapter === chapter);
      return exists ? prev.filter(ch => !(ch.subject === subject && ch.chapter === chapter))
        : [...prev, { subject, chapter }];
    });
  };

  const startTest = async (mode = testMode) => {
    // Early exit for free users who exceeded limit
    if (!isPremium && monthlyTestsUsed >= MONTHLY_LIMIT_FREE) {
      setShowUpgradeModal(true);
      toast.error(`You've used all ${MONTHLY_LIMIT_FREE} free tests this month!`);
      return;
    }

    // For full mock test
    if (mode === "full") {
      setLoading(true);
      toast.loading("Preparing your full mock test...");

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("Please login to take tests");
          navigate('/login');
          return;
        }

        const targetExam = profile?.target_exam || 'JEE';
        const userGrade = parseGrade(profile?.grade || 12);
        
        // Use proper exam field mapping for Foundation courses
        const examFieldForTest = mapBatchToExamField(targetExam, userGrade);
        logger.info('Full mock test exam field', { targetExam, examFieldForTest, userGrade });
        
        const { data: attemptedQuestions } = await supabase
          .from('question_attempts')
          .select('question_id')
          .eq('user_id', user.id);
        
        const attemptedIds = attemptedQuestions?.map(a => a.question_id) || [];
        
        let query = supabase.from('questions').select('*').eq('exam', examFieldForTest);
        
        if (attemptedIds.length > 0) {
          query = query.not('id', 'in', `(${attemptedIds.join(',')})`);
        }

        const { data: questions, error } = await query.limit(100);
        
        if (error) throw error;
        
        if (!questions || questions.length === 0) {
          toast.dismiss();
          toast.error("No new questions available! All questions already attempted.");
          setLoading(false);
          return;
        }

        if (questions.length < 75) {
          toast.dismiss();
          toast.info(`Only ${questions.length} new questions available. Starting test with ${questions.length} questions.`);
        }

        const shuffled = questions.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(75, questions.length));

      const testSession = {
        id: Date.now().toString(),
        title: `Full Syllabus Mock Test - ${profile?.target_exam?.startsWith('Foundation') ? 'Foundation' : profile?.target_exam || 'Practice'} Pattern`,
        questions: selected,
        duration: 180,
        startTime: new Date().toISOString()
      };

        localStorage.setItem('currentTest', JSON.stringify(testSession));

        // Test tracking removed - test_attempts table deleted
            
        toast.dismiss();
        toast.success(`Full mock test started with ${selected.length} questions!`);
        navigate('/test-attempt');
      } catch (error) {
        logger.error('Error starting test:', error);
        toast.dismiss();
        toast.error("Failed to start test");
        setLoading(false);
      }
      return;
    }

    // For chapter/subject tests
    if (selectedChapters.length === 0 && selectedSubjects.length === 0) {
      toast.error("Please select at least one chapter or subject");
      return;
    }

    setLoading(true);
    toast.loading("Preparing your test...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please login to take tests");
        navigate('/login');
        return;
      }
      
      const { data: attemptedQuestions } = await supabase
        .from('question_attempts')
        .select('question_id')
        .eq('user_id', user.id);
      
      const attemptedIds = attemptedQuestions?.map(a => a.question_id) || [];

      const targetExam = profile?.target_exam || 'JEE';
      const userGrade = parseGrade(profile?.grade || 12);
      
      // Use proper exam field mapping for Foundation courses
      const examFieldForTest = mapBatchToExamField(targetExam, userGrade);
      logger.info('Chapter/Subject test exam field', { targetExam, examFieldForTest, userGrade });
      
      let query = supabase.from('questions').select('*').eq('exam', examFieldForTest);
      
      if (mode === "chapter" && selectedChapters.length > 0) {
        const chapterNames = selectedChapters.map(ch => ch.chapter);
        query = query.in('chapter', chapterNames);
      } else if (mode === "subject" && selectedSubjects.length > 0) {
        query = query.in('subject', selectedSubjects);
      }

      if (attemptedIds.length > 0) {
        query = query.not('id', 'in', `(${attemptedIds.join(',')})`);
      }

      const { data: questions, error } = await query.limit(100);
      
      if (error) throw error;
      
      if (!questions || questions.length === 0) {
        toast.dismiss();
        toast.error("No new questions available! All questions already attempted.");
        setLoading(false);
        return;
      }

      if (questions.length < 25) {
        toast.dismiss();
        toast.info(`Only ${questions.length} new questions available. Starting test with ${questions.length} questions.`);
      }

      const shuffled = questions.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(25, questions.length));

      const testSession = {
        id: Date.now().toString(),
        title: mode === "chapter" 
          ? `${selectedChapters.map(ch => ch.chapter).join(', ')} - Chapter Test`
          : `${selectedSubjects.join(', ')} - Subject Test`,
        questions: selected,
        duration: 60,
        startTime: new Date().toISOString()
      };

      localStorage.setItem('currentTest', JSON.stringify(testSession));

      // Test tracking removed - test_attempts table deleted
          
      toast.dismiss();
      toast.success(`Test started with ${selected.length} fresh questions!`);
      navigate('/test-attempt');
    } catch (error) {
      logger.error('Error starting test:', error);
      toast.dismiss();
      toast.error("Failed to start test");
      setLoading(false);
    }
  };

  if (showUpgradeModal) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <Header />
        </div>
        <PricingModal 
          isOpen={showUpgradeModal}
          onClose={() => {
            setShowUpgradeModal(false);
            navigate('/subscription-plans');
          }}
          limitType="test_limit"
        />
      </>
    );
  }
  
  if (loading) {
    return <LoadingScreen message="Loading your tests..." />;
  }

  if (!testMode) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#e6eeff] rounded-full -translate-y-1/2 translate-x-1/3 opacity-40" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#e6eeff] rounded-full translate-y-1/2 -translate-x-1/3 opacity-30" />
        </div>
        <Header />
        <div className="flex-1 overflow-y-auto pt-16 sm:pt-20 pb-4 relative z-10">
          <div className="container mx-auto px-3 sm:px-4 lg:px-8 max-w-7xl">
            {!isPremium && (
              <div className="mb-4 p-3 sm:p-4 rounded-2xl bg-[#e6eeff] border border-[#013062]/10 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="bg-[#013062] p-2 rounded-xl shrink-0">
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#013062] text-sm sm:text-base">
                        Mock Tests: {monthlyTestsUsed}/{MONTHLY_LIMIT_FREE} this month
                      </p>
                      <p className="text-xs sm:text-sm text-[#013062]/70 mt-1">
                        {monthlyTestsUsed >= MONTHLY_LIMIT_FREE ? (
                          <span className="font-semibold">Limit reached! Upgrade for unlimited tests.</span>
                        ) : (
                          <span>Upgrade to Pro for unlimited mock tests!</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate('/subscription-plans')}
                    className="w-full sm:w-auto bg-[#013062] hover:bg-[#013062]/90 text-white font-semibold text-sm px-4 py-2 rounded-xl"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Button>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div 
                className="group relative overflow-hidden rounded-2xl bg-white border-2 border-primary/20 hover:border-primary/40 hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
                onClick={() => setTestMode("chapter")}
              >
                <div className="p-4 sm:p-6 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  
                  <h3 className="text-lg sm:text-2xl font-bold mb-2 text-gray-900">
                    Chapter-wise Test
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-4 sm:mb-6">
                    Select multiple chapters for laser-focused practice
                  </p>
                  
                  <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="text-gray-900 font-bold text-sm sm:text-base">25</div>
                        <div className="text-gray-500 text-xs">Questions</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <div className="text-gray-900 font-bold text-sm sm:text-base">60</div>
                        <div className="text-gray-500 text-xs">Minutes</div>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-semibold py-2 sm:py-3 rounded-xl shadow-md transition-all duration-300 text-sm sm:text-base">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Select Chapters
                  </Button>
                  
                  <Badge className="mt-3 sm:mt-4 bg-green-50 text-green-700 border-green-200 text-xs">
                    Beginner Friendly
                  </Badge>
                </div>
              </div>

              <div 
                className="group relative overflow-hidden rounded-2xl bg-white border-2 border-purple-200 hover:border-purple-400 hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
                onClick={() => setTestMode("subject")}
              >
                <div className="p-4 sm:p-6 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Target className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  
                  <h3 className="text-lg sm:text-2xl font-bold mb-2 text-gray-900">
                    Subject-wise Test
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-4 sm:mb-6">
                    Master entire subjects with comprehensive coverage
                  </p>
                  
                  <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      </div>
                      <div className="text-left">
                        <div className="text-gray-900 font-bold text-sm sm:text-base">25</div>
                        <div className="text-gray-500 text-xs">Questions</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                      </div>
                      <div className="text-left">
                        <div className="text-gray-900 font-bold text-sm sm:text-base">60</div>
                        <div className="text-gray-500 text-xs">Minutes</div>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-600/90 hover:to-indigo-600/90 text-white font-semibold py-2 sm:py-3 rounded-xl shadow-md transition-all duration-300 text-sm sm:text-base">
                    <Brain className="w-4 h-4 mr-2" />
                    Select Subjects
                  </Button>
                  
                  <Badge className="mt-3 sm:mt-4 bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                    Intermediate Level
                  </Badge>
                </div>
              </div>

              <div 
                className="group relative overflow-hidden rounded-2xl bg-white border-2 border-orange-200 hover:border-orange-400 hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
                onClick={() => startTest("full")}
              >
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-md text-xs">
                    <Award className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
                
                <div className="p-4 sm:p-6 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  
                  <h3 className="text-lg sm:text-2xl font-bold mb-2 text-gray-900">
                    Full Syllabus Mock
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-4 sm:mb-6">
                    Complete exam pattern mock test for real exam simulation
                  </p>
                  
                  <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                      </div>
                      <div className="text-left">
                        <div className="text-gray-900 font-bold text-sm sm:text-base">75</div>
                        <div className="text-gray-500 text-xs">Questions</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                      </div>
                      <div className="text-left">
                        <div className="text-gray-900 font-bold text-sm sm:text-base">180</div>
                        <div className="text-gray-500 text-xs">Minutes</div>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-600/90 hover:to-red-600/90 text-white font-semibold py-2 sm:py-3 rounded-xl shadow-md transition-all duration-300 text-sm sm:text-base">
                    <Play className="w-4 h-4 mr-2" />
                    Start Mock Test
                  </Button>
                  
                  <Badge className="mt-3 sm:mt-4 bg-orange-50 text-orange-700 border-orange-200 text-xs">
                    Advanced • Full Syllabus
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (testMode === "chapter") {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
        <Header />
        <div className="flex-1 overflow-y-auto pt-16 sm:pt-20 pb-4">
          <div className="container mx-auto px-3 sm:px-4 lg:px-8 max-w-6xl">
            
            <Button 
              variant="outline"
              className="mb-4 sm:mb-6 border-2 border-primary text-sm"
              onClick={() => {
                setTestMode("");
                setSelectedSubjects([]);
                setSelectedChapters([]);
                setAvailableChapters([]);
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Test Selection
            </Button>

            <Card className="border-2 border-primary/20 shadow-lg bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-50 border-b border-primary/20 p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <span className="text-base sm:text-3xl">Chapter-wise Test Setup</span>
                </CardTitle>
                <p className="text-gray-600 mt-2 flex items-center gap-2 text-xs sm:text-base">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                  Select subjects first, then choose specific chapters
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900 flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                      1
                    </div>
                    <span className="text-sm sm:text-xl">Select Subjects</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    {subjects.map((subject) => (
                      <div 
                        key={subject}
                        className={`p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 ${
                          selectedSubjects.includes(subject)
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-gray-200 bg-white hover:border-primary/50'
                        }`}
                        onClick={() => handleSubjectToggle(subject)}
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox 
                            checked={selectedSubjects.includes(subject)}
                            className="w-4 h-4 sm:w-5 sm:h-5"
                          />
                          <label className="cursor-pointer flex-1">
                            <div className="font-bold text-gray-900 text-sm sm:text-base">{subject}</div>
                            <div className="text-xs sm:text-sm text-gray-500">{chapters[subject]?.length || 0} chapters</div>
                          </label>
                          {selectedSubjects.includes(subject) && (
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedSubjects.length > 0 && (
                  <div className="mb-6 sm:mb-8">
                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900 flex items-center gap-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                        2
                      </div>
                      <span className="text-sm sm:text-xl">Select Chapters</span>
                      <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 text-xs">
                        {selectedChapters.length} selected
                      </Badge>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 max-h-[400px] overflow-y-auto pr-2">
                      {availableChapters.map(({ subject, chapter }) => (
                        <div 
                          key={`${subject}-${chapter}`}
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedChapters.some(ch => ch.subject === subject && ch.chapter === chapter)
                              ? 'border-purple-500 bg-purple-50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-purple-300'
                          }`}
                          onClick={() => handleChapterToggle(subject, chapter)}
                        >
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              checked={selectedChapters.some(ch => ch.subject === subject && ch.chapter === chapter)}
                              className="w-4 h-4 shrink-0"
                            />
                            <label className="cursor-pointer flex-1 min-w-0">
                              <span className="font-semibold text-gray-900 block text-xs sm:text-sm truncate">{chapter}</span>
                              <Badge variant="outline" className="text-[10px] mt-0.5">
                                {subject}
                              </Badge>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedChapters.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 rounded-xl bg-gradient-to-r from-primary/10 to-purple-50 border-2 border-primary/20 shadow-md gap-3">
                    <div>
                      <p className="font-bold text-xl sm:text-2xl text-gray-900 mb-2">
                        {selectedChapters.length} Chapter{selectedChapters.length > 1 ? 's' : ''} Selected
                      </p>
                      <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="font-medium">25 Questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="font-medium">60 Minutes</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => startTest("chapter")}
                      className="w-full sm:w-auto bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-md text-sm sm:text-base"
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Start Test Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (testMode === "subject") {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
        <Header />
        <div className="flex-1 overflow-y-auto pt-16 sm:pt-20 pb-4">
          <div className="container mx-auto px-3 sm:px-4 lg:px-8 max-w-6xl">
            
            <Button 
              variant="outline"
              className="mb-4 sm:mb-6 border-2 border-primary text-sm"
              onClick={() => {
                setTestMode("");
                setSelectedSubjects([]);
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Test Selection
            </Button>

            <Card className="border-2 border-primary/20 shadow-lg bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200 p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <span className="text-base sm:text-3xl">Subject-wise Test Setup</span>
                </CardTitle>
                <p className="text-gray-600 mt-2 flex items-center gap-2 text-xs sm:text-base">
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                  Choose subjects to test your understanding
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  {subjects.map((subject, index) => {
                    const icons = ['⚛️', '🧪', '📐'];
                    
                    return (
                      <div 
                        key={subject}
                        className={`p-4 sm:p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 ${
                          selectedSubjects.includes(subject)
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-gray-200 bg-white hover:border-primary/50'
                        }`}
                        onClick={() => handleSubjectToggle(subject)}
                      >
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                          <Checkbox 
                            checked={selectedSubjects.includes(subject)}
                            className="w-4 h-4 sm:w-5 sm:h-5"
                          />
                          {selectedSubjects.includes(subject) && (
                            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                          )}
                        </div>
                        
                        <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 text-center">{icons[index % 3]}</div>
                        <div className="font-bold text-lg sm:text-xl text-gray-900 mb-1 sm:mb-2 text-center">{subject}</div>
                        <div className="text-xs sm:text-sm text-gray-500 text-center">
                          {chapters[subject]?.length || 0} chapters
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedSubjects.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 shadow-md gap-3">
                    <div>
                      <p className="font-bold text-xl sm:text-2xl text-gray-900 mb-2">
                        {selectedSubjects.length} Subject{selectedSubjects.length > 1 ? 's' : ''} Selected
                      </p>
                      <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="font-medium">25 Questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="font-medium">60 Minutes</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => startTest("subject")}
                      className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-600/90 hover:to-pink-600/90 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-md text-sm sm:text-base"
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Start Test Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TestPage;
