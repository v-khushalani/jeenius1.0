import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { 
  ChevronRight, Calendar, BookOpen, Stethoscope, Calculator, 
  Rocket, Trophy, Sparkles, AlertTriangle, ArrowLeft, 
  Lock, Check, Loader
} from 'lucide-react';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import GoalChangeWarning from '@/components/GoalChangeWarning';

const GoalSelectionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingJourney, setIsStartingJourney] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [examDate, setExamDate] = useState('');
  
  // For goal change flow
  const [isChangingGoal, setIsChangingGoal] = useState(false);
  const [existingGoal, setExistingGoal] = useState<string | null>(null);
  const [existingGrade, setExistingGrade] = useState<number | null>(null);
  const [showGoalChangeWarning, setShowGoalChangeWarning] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  
  // Prevent multiple checks
  const redirectCheckedRef = useRef(false);
  const saveInProgressRef = useRef(false);

  // Exam dates
  const examDates: Record<string, string | null> = {
    'JEE': '2026-04-10',
    'NEET': '2026-05-05',
    'Class': null
  };

  // Grade options
  const grades = [
    { id: '6', name: 'Grade 6', icon: '📚', desc: 'Building Basics' },
    { id: '7', name: 'Grade 7', icon: '📖', desc: 'Concept Development' },
    { id: '8', name: 'Grade 8', icon: '📝', desc: 'Skill Enhancement' },
    { id: '9', name: 'Grade 9', icon: '🎓', desc: 'Pre-Board Prep' },
    { id: '10', name: 'Grade 10', icon: '🏆', desc: 'Board Mastery' },
    { id: '11', name: 'Grade 11', icon: '🚀', desc: 'Competitive Edge' },
    { id: '12', name: 'Grade 12', icon: '⭐', desc: 'Final Sprint' }
  ];

  // Course options based on grade
  const getCourseOptions = () => {
    if (!selectedGrade) return [];
    const gradeNum = parseInt(selectedGrade);

    if (gradeNum >= 11) {
      return [
        {
          id: 'JEE',
          name: 'JEE Preparation',
          icon: <Calculator className="w-8 h-8" />,
          color: 'bg-purple-600',
          description: 'IIT-JEE Main & Advanced',
          subjects: ['Physics', 'Chemistry', 'Mathematics'],
          examDate: examDates['JEE']
        },
        {
          id: 'NEET',
          name: 'NEET Preparation',
          icon: <Stethoscope className="w-8 h-8" />,
          color: 'bg-green-600',
          description: 'Medical Entrance Exam',
          subjects: ['Physics', 'Chemistry', 'Biology'],
          examDate: examDates['NEET']
        }
      ];
    }

    return [
      {
        id: 'Class',
        name: `Grade ${gradeNum} Course`,
        icon: <BookOpen className="w-8 h-8" />,
        color: 'bg-blue-600',
        description: 'School Curriculum - PCMB',
        subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology']
      }
    ];
  };

  // Check if user already has goals set
  useEffect(() => {
    const checkUserProfile = async () => {
      if (redirectCheckedRef.current || saveInProgressRef.current) return;
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        redirectCheckedRef.current = true;
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('target_exam, grade, goals_set, selected_goal')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          logger.error('Profile check error:', error);
          setIsLoading(false);
          return;
        }

        if (profile?.goals_set && profile?.target_exam && profile?.grade) {
          const urlParams = new URLSearchParams(window.location.search);
          const isChangeMode = urlParams.get('change') === 'true';

          if (isChangeMode) {
            setExistingGoal(profile.selected_goal || profile.target_exam);
            setExistingGrade(profile.grade);
            setIsChangingGoal(true);
            setIsLoading(false);
            return;
          }

          logger.info('Profile complete, redirecting to dashboard');
          setIsLoading(false);
          setTimeout(() => navigate('/dashboard', { replace: true }), 100);
          return;
        }

        setIsLoading(false);
      } catch (error) {
        logger.error('Error checking profile:', error);
        setIsLoading(false);
      }
    };

    checkUserProfile();
  }, [user?.id, navigate]);

  // Calculate days remaining
  useEffect(() => {
    if (selectedGoal && examDates[selectedGoal]) {
      const examDateStr = examDates[selectedGoal];
      if (examDateStr) {
        const today = new Date();
        const exam = new Date(examDateStr);
        const timeDiff = exam.getTime() - today.getTime();
        const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
        setDaysRemaining(Math.max(0, days));
        setExamDate(examDateStr);
      }
    }
  }, [selectedGoal]);

  const handleGradeSelect = (gradeId: string) => {
    setSelectedGrade(gradeId);
    setSelectedGoal('');
  };

  const handleCourseSelect = (courseId: string) => {
    setSelectedGoal(courseId);
  };

  const handleNext = () => {
    if (currentStep < 2) setCurrentStep(currentStep + 1);
  };

  const handleStartJourney = () => {
    if (!selectedGoal || !selectedGrade) {
      toast.error('Please select both grade and course');
      return;
    }
    if (isChangingGoal) {
      setShowGoalChangeWarning(true);
      return;
    }
    setShowWelcomeDialog(true);
  };

  const confirmStartJourney = async () => {
    setIsStartingJourney(true);
    saveInProgressRef.current = true;

    const courseOptions = getCourseOptions();
    const selectedSubjects = courseOptions.find(c => c.id === selectedGoal)?.subjects || [];

    try {
      if (!user?.id) {
        toast.error('Please login again');
        navigate('/login');
        return;
      }

      const gradeNumber = parseInt(selectedGrade, 10) || 11;
      let targetExamValue = selectedGoal;
      if (selectedGoal === 'Class') {
        targetExamValue = `Foundation-${gradeNumber}`;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          target_exam: targetExamValue,
          grade: gradeNumber,
          subjects: selectedSubjects,
          daily_goal: selectedSubjects.length * 10,
          goals_set: true,
          selected_goal: selectedGoal.toLowerCase(),
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        logger.error('Profile update error:', profileError);
        toast.error('Error saving profile. Please try again.');
        setIsStartingJourney(false);
        saveInProgressRef.current = false;
        return;
      }

      await supabase
        .from('goal_change_audit')
        .insert({
          user_id: user.id,
          new_goal: selectedGoal.toLowerCase(),
          status: 'success',
          reason: 'Initial goal selection'
        });

      logger.info('Profile updated successfully');
      toast.success('Your learning path is set! 🎯');

      const userGoals = {
        grade: selectedGrade,
        goal: selectedGoal,
        subjects: selectedSubjects,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('userGoals', JSON.stringify(userGoals));

      await new Promise(resolve => setTimeout(resolve, 500));
      navigate('/dashboard', { replace: true });

    } catch (error) {
      logger.error('Error saving goals:', error);
      toast.error('Something went wrong. Please try again.');
      setIsStartingJourney(false);
      saveInProgressRef.current = false;
    }
  };

  const courseOptions = getCourseOptions();

  if (isLoading) {
    return <LoadingScreen message="Loading your learning journey..." />;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6 shadow-lg">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              {isChangingGoal ? '⚠️ Change Your Goal' : '🎯 Start Your Learning Journey'}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {isChangingGoal 
                ? 'Changing your goal will reset your progress data to match your new path'
                : 'Choose your grade and learning path to unlock personalized study materials'}
            </p>
          </div>

          {isChangingGoal && (
            <button
              onClick={() => navigate('/settings')}
              className="mb-8 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Settings
            </button>
          )}

          {/* Step 1: Grade Selection */}
          {currentStep === 1 && (
            <div className="mb-12">
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold">1</div>
                <span className="text-gray-600">Select your grade</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto">
                {grades.map((grade) => (
                  <button
                    key={grade.id}
                    onClick={() => handleGradeSelect(grade.id)}
                    className={`p-4 rounded-xl transition-all duration-200 border-2 font-semibold ${
                      selectedGrade === grade.id
                        ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-md'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{grade.icon}</div>
                    <div className="text-sm">{grade.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{grade.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Course Selection */}
          {currentStep === 2 && selectedGrade && (
            <div className="mb-12">
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold">2</div>
                <span className="text-gray-600">Choose your course</span>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {courseOptions.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => handleCourseSelect(course.id)}
                    className={`p-6 rounded-2xl transition-all duration-300 border-2 text-left overflow-hidden group ${
                      selectedGoal === course.id
                        ? 'border-blue-600 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="relative">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4 gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-3 rounded-lg ${course.color} text-white flex-shrink-0`}>
                            {course.icon}
                          </div>
                          <div className="text-left">
                            <h3 className="font-bold text-lg text-gray-900">{course.name}</h3>
                            <p className="text-sm text-gray-600">{course.description}</p>
                          </div>
                        </div>
                        {selectedGoal === course.id && (
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white">
                              <Check className="w-4 h-4" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Subjects */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          📚 Subjects
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {course.subjects.map((subject) => (
                            <span
                              key={subject}
                              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                                selectedGoal === course.id
                                  ? `${course.color} text-white`
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Exam Date */}
                      {course.examDate && (
                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              Exam: {new Date(course.examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                            {daysRemaining > 0 && (
                              <div className={`font-semibold ${daysRemaining < 100 ? 'text-red-600' : 'text-green-600'}`}>
                                {daysRemaining} days left
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mt-12">
            {currentStep === 1 && (
              <button
                onClick={handleNext}
                disabled={!selectedGrade}
                className={`px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                  selectedGrade
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {currentStep === 2 && (
              <>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-8 py-3 rounded-lg font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleStartJourney}
                  disabled={!selectedGoal || isStartingJourney}
                  className={`px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                    selectedGoal && !isStartingJourney
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isStartingJourney ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Start Learning <Rocket className="w-5 h-5" />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Welcome Dialog */}
      {showWelcomeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-blue-600">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-blue-600">
                Welcome Aboard! 🎉
              </h2>
              <p className="text-gray-600 text-lg mb-4">
                You're about to embark on an incredible learning journey!
              </p>
            </div>

            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-left">
              <div className="flex items-start space-x-2">
                <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Important Notice</p>
                  <p className="text-xs text-amber-700 mt-1">
                    You can change your goal later, but it will reset your progress.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-sm">✅</span>
                </div>
                <span className="text-sm text-gray-700">Personalized study plans</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm">📊</span>
                </div>
                <span className="text-sm text-gray-700">Smart progress tracking</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-sm">✨</span>
                </div>
                <span className="text-sm text-gray-700">AI-powered recommendations</span>
              </div>
            </div>

            <button
              onClick={confirmStartJourney}
              disabled={isStartingJourney}
              className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all text-white ${
                isStartingJourney 
                  ? 'opacity-50 cursor-not-allowed bg-blue-600' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isStartingJourney ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Let's Begin! 🚀"
              )}
            </button>

            {!isStartingJourney && (
              <button
                onClick={() => setShowWelcomeDialog(false)}
                className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Maybe later
              </button>
            )}
          </div>
        </div>
      )}

      {/* Goal Change Warning */}
      {user && isChangingGoal && (
        <GoalChangeWarning
          isOpen={showGoalChangeWarning}
          onClose={() => setShowGoalChangeWarning(false)}
          currentGoal={existingGoal || ''}
          newGoal={selectedGoal.toLowerCase()}
          newGrade={parseInt(selectedGrade, 10) || 11}
          newTargetExam={selectedGoal === 'Class' ? `Foundation-${selectedGrade}` : selectedGoal}
          userId={user.id}
          onSuccess={() => {
            toast.success('Goal changed! 🎯');
            navigate('/dashboard', { replace: true });
          }}
        />
      )}
    </>
  );
};

export default GoalSelectionPage;
