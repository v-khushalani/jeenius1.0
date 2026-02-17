import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { ChevronRight, Calendar, BookOpen, Stethoscope, Calculator, Clock, Rocket, Trophy, Target, Sparkles, AlertTriangle, ArrowLeft, Lock } from 'lucide-react';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import GoalChangeWarning from '@/components/GoalChangeWarning';

const GoalSelectionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [examDate, setExamDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [isStartingJourney, setIsStartingJourney] = useState(false);
  
  // For goal change flow
  const [existingGoal, setExistingGoal] = useState<string | null>(null);
  const [existingGrade, setExistingGrade] = useState<number | null>(null);
  const [isChangingGoal, setIsChangingGoal] = useState(false);
  const [showGoalChangeWarning, setShowGoalChangeWarning] = useState(false);
  
  // Ref to prevent multiple redirect checks
  const redirectCheckedRef = useRef(false);

  // Calculate exam dates and days remaining (only JEE and NEET for 11-12)
  const examDates: Record<string, string | null> = {
    'JEE Main': '2026-04-10',
    'JEE Advanced': '2026-05-25',
    'JEE': '2026-04-10',
    'NEET': '2026-05-05',
    'Class': null // No fixed exam date for grades 6-10
  };

  // Check if user has already completed goal selection
  useEffect(() => {
    const checkUserProfile = async () => {
      // Only check once per component mount
      if (redirectCheckedRef.current) {
        return;
      }
      
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
  
      try {
        redirectCheckedRef.current = true;
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, target_exam, grade, selected_goal')
          .eq('id', user.id)
          .single();
  
        if (error && error.code !== 'PGRST116') {
          logger.error('Profile check error:', error);
          setIsLoading(false);
          return;
        }
  
        // If profile is complete (has grade and exam)
        if (profile?.selected_goal && profile?.target_exam && profile?.grade) {
          // Check if coming from settings to change goal
          const urlParams = new URLSearchParams(window.location.search);
          const isChangeMode = urlParams.get('change') === 'true';
          
          if (isChangeMode) {
            // User wants to change their goal
            setExistingGoal(profile.selected_goal || profile.target_exam);
            setExistingGrade(profile.grade);
            setIsChangingGoal(true);
            setIsLoading(false);
            return;
          }
          
          logger.info('Profile already complete, redirecting to dashboard');
          setIsLoading(false);
          // Direct navigation without timeout - ensures it happens immediately
          navigate('/dashboard', { replace: true });
          return;
        }
  
        // Profile exists but incomplete - let them continue with goal selection
        logger.info('User needs to complete goal selection');
        setIsLoading(false);
      } catch (error) {
        logger.error('Error checking user profile:', error);
        setIsLoading(false);
      }
    };
  
    checkUserProfile();
  }, [user?.id, navigate]);

  useEffect(() => {
    if (selectedGoal && examDates[selectedGoal]) {
      const examDateStr = examDates[selectedGoal];
      if (examDateStr) {
        const today = new Date();
        const exam = new Date(examDateStr);
        const timeDiff = exam.getTime() - today.getTime();
        const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
        setDaysRemaining(days > 0 ? days : 0);
        setExamDate(examDateStr);
      }
    } else {
      // Reset exam date info for goals without fixed dates (like Class)
      setDaysRemaining(0);
      setExamDate('');
    }
  }, [selectedGoal]);

  const grades = [
    { id: '6', name: 'Class 6', icon: '🌱', desc: 'Building Basics' },
    { id: '7', name: 'Class 7', icon: '🌿', desc: 'Concept Development' },
    { id: '8', name: 'Class 8', icon: '🌳', desc: 'Skill Enhancement' },
    { id: '9', name: 'Class 9', icon: '🏗️', desc: 'Pre-Board Prep' },
    { id: '10', name: 'Class 10', icon: '📚', desc: 'Board Mastery' },
    { id: '11', name: 'Class 11', icon: '🎯', desc: 'Competitive Edge' },
    { id: '12', name: 'Class 12', icon: '🚀', desc: 'Final Sprint' }
  ];

  // For grades 6-10: Single "Class" option (auto-selected)
  // For grades 11-12: JEE/NEET selection
  const goals = {
    '6': [
      { id: 'Class', name: 'Class 6 Course', icon: <BookOpen className="w-6 h-6" />, color: 'bg-blue-500', desc: 'Complete PCMB syllabus' }
    ],
    '7': [
      { id: 'Class', name: 'Class 7 Course', icon: <BookOpen className="w-6 h-6" />, color: 'bg-blue-500', desc: 'Complete PCMB syllabus' }
    ],
    '8': [
      { id: 'Class', name: 'Class 8 Course', icon: <BookOpen className="w-6 h-6" />, color: 'bg-blue-500', desc: 'Complete PCMB syllabus' }
    ],
    '9': [
      { id: 'Class', name: 'Class 9 Course', icon: <BookOpen className="w-6 h-6" />, color: 'bg-blue-500', desc: 'Complete PCMB syllabus' }
    ],
    '10': [
      { id: 'Class', name: 'Class 10 Course', icon: <BookOpen className="w-6 h-6" />, color: 'bg-blue-500', desc: 'Complete PCMB syllabus' }
    ],
    '11': [
      { id: 'JEE', name: 'JEE Preparation', icon: <Calculator className="w-6 h-6" />, color: 'bg-red-500', desc: 'IIT-JEE Main + Advanced' },
      { id: 'NEET', name: 'NEET Preparation', icon: <Stethoscope className="w-6 h-6" />, color: 'bg-green-500', desc: 'Medical entrance' }
    ],
    '12': [
      { id: 'JEE', name: 'JEE Preparation', icon: <Calculator className="w-6 h-6" />, color: 'bg-red-500', desc: 'IIT-JEE Main + Advanced' },
      { id: 'NEET', name: 'NEET Preparation', icon: <Stethoscope className="w-6 h-6" />, color: 'bg-green-500', desc: 'Medical entrance' }
    ]
  };
  
  // Auto-select all subjects based on goal (only JEE and NEET for 11-12)
  const subjects: Record<string, string[]> = {
    'JEE': ['Physics', 'Chemistry', 'Mathematics'],
    'NEET': ['Physics', 'Chemistry', 'Biology'],
    'Class': ['Physics', 'Chemistry', 'Mathematics', 'Biology']
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle Start Journey button click
  const handleStartJourney = () => {
    if (!selectedGoal || !selectedGrade) {
      logger.warn('Missing required selections');
      return;
    }
    
    // If changing goal, show warning instead of welcome dialog
    if (isChangingGoal) {
      setShowGoalChangeWarning(true);
      return;
    }
    
    setShowWelcomeDialog(true);
  };

  const confirmStartJourney = async () => {
    setIsStartingJourney(true);
    setShowWelcomeDialog(false);
    
    // Auto-select all subjects for the chosen goal
    const selectedSubjects = subjects[selectedGoal] || [];
    
    try {
      if (!user?.id) {
        logger.error('No user found');
        toast.error('Please login again');
        setIsStartingJourney(false);
        navigate('/login');
        return;
      }
  
      // Get user's name from Google auth (already stored in profile)
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
  
      logger.info('User name from profile:', profile?.full_name);
  
      // Update profile with grade, exam, and subjects
      const gradeNumber = parseInt(selectedGrade, 10) || 11;
      
      // Map goal to specific course type
      // For grades 6-10, 'Class' goal maps to 'Foundation-X' in DB for backward compatibility
      let targetExamValue = selectedGoal;
      if (selectedGoal === 'Class') {
        targetExamValue = `Foundation-${gradeNumber}`;
      }
      
      // Save goal for new users (first time setup)
      // Only update columns that exist in the database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          target_exam: targetExamValue,
          grade: gradeNumber,
          selected_goal: selectedGoal.toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
  
      if (profileError) {
        logger.error('Profile update error:', profileError);
        toast.error('Error saving profile. Please try again.');
        setIsStartingJourney(false);
        return;
      }
  
      // Log the goal selection in audit table
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
  
      // Save to localStorage as backup
      const userGoals = {
        grade: selectedGrade,
        goal: selectedGoal,
        subjects: selectedSubjects,
        name: profile?.full_name,
        daysRemaining: daysRemaining,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('userGoals', JSON.stringify(userGoals));
      
      // Mark that we successfully completed goal selection to prevent re-entry
      sessionStorage.setItem('goalSelectionComplete', 'true');
      
      // Wait briefly for UI feedback, then navigate
      await new Promise(resolve => setTimeout(resolve, 800));
    
      // Navigate to dashboard - this should be the final action
      logger.info('Navigating to dashboard after goal setup');
      setIsStartingJourney(false);
      navigate('/dashboard', { replace: true });
    
    } catch (error) {
      logger.error('Error saving goals:', error);
      toast.error('Something went wrong. Please try again.');
      setIsStartingJourney(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return selectedGrade;
    if (currentStep === 2) return selectedGoal;
    return false;
  };

  // Show loading while checking user profile
  if (isLoading) {
    return <LoadingScreen message="Setting up your learning journey..." />;
  }

  return (
    <>
      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50" style={{backgroundColor: '#e9e9e9'}}>
        <div className="h-full flex flex-col">
          {/* Header - Fixed height */}
          <div className="flex-shrink-0 text-center pt-8 pb-6">
            {/* Back button for change mode */}
            {isChangingGoal && (
              <button
                onClick={() => navigate('/settings')}
                className="absolute left-4 top-8 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Settings</span>
              </button>
            )}
            
            <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{color: '#013062'}}>
              {isChangingGoal ? 'Change Your Goal ⚠️' : 'Welcome to JEEnius! 🎯'}
            </h1>
            <p className="text-lg md:text-xl text-gray-600">
              {isChangingGoal 
                ? 'Warning: Changing your goal will reset all progress data'
                : "Let's customize your learning journey"}
            </p>
            
            {/* Change Warning Banner */}
            {isChangingGoal && (
              <div className="max-w-2xl mx-auto mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-amber-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Changing from <strong>{existingGoal?.toUpperCase()}</strong> will DELETE all your points, streaks, and question history.
                  </span>
                </div>
              </div>
            )}
            
            {/* Progress Bar - Only 2 steps */}
            <div className="flex justify-center mt-6 mb-4">
              <div className="flex space-x-4">
                {[1, 2].map((step) => (
                  <div key={step} className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                    step <= currentStep ? 'text-white shadow-lg' : 'bg-gray-400 text-gray-600'
                  }`} style={{
                    backgroundColor: step <= currentStep ? '#013062' : undefined
                  }}>
                    {step}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Step {currentStep}: {currentStep === 1 ? 'Select Grade' : 'Choose Course'}
            </div>
          </div>

          {/* Content - Scrollable if needed but constrained */}
          <div className="flex-1 overflow-auto px-6">
            {/* Step 1: Grade Selection */}
            {currentStep === 1 && (
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-6" style={{color: '#013062'}}>Which grade are you in? 📚</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {grades.map((grade) => (
                    <div
                      key={grade.id}
                      onClick={() => setSelectedGrade(grade.id)}
                      className={`p-3 md:p-4 lg:p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 border-2 bg-white shadow-lg hover:shadow-xl ${
                        selectedGrade === grade.id
                          ? 'shadow-2xl transform scale-105'
                          : 'hover:border-gray-300'
                      }`}
                      style={{
                        borderColor: selectedGrade === grade.id ? '#013062' : '#e5e7eb',
                        boxShadow: selectedGrade === grade.id ? '0 0 0 3px rgba(1, 48, 98, 0.1)' : undefined
                      }}
                    >
                      <div className="text-2xl md:text-3xl lg:text-4xl mb-2 md:mb-3 text-center">{grade.icon}</div>
                      <h3 className="text-sm md:text-lg lg:text-xl font-bold text-center mb-1 md:mb-2" style={{color: '#013062'}}>{grade.name}</h3>
                      <p className="text-xs md:text-sm text-gray-500 text-center">{grade.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Course Selection */}
            {currentStep === 2 && selectedGrade && (
              <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-2" style={{color: '#013062'}}>What's your target? 🎯</h2>
                <p className="text-center text-gray-600 mb-8">Choose your learning path and let's create your personalized study plan</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {goals[selectedGrade]?.map((goal) => (
                    <div
                      key={goal.id}
                      onClick={() => setSelectedGoal(goal.id)}
                      className={`group relative overflow-hidden p-6 md:p-8 rounded-2xl cursor-pointer transition-all duration-300 transform border-2 bg-white hover:shadow-2xl ${
                        selectedGoal === goal.id
                          ? 'shadow-2xl scale-105'
                          : 'hover:scale-102 hover:shadow-xl'
                      }`}
                      style={{
                        borderColor: selectedGoal === goal.id ? '#013062' : '#e5e7eb',
                        boxShadow: selectedGoal === goal.id ? '0 0 0 3px rgba(1, 48, 98, 0.1)' : undefined
                      }}
                    >
                      {/* Background gradient on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity" style={{backgroundColor: goal.color}} />
                      
                      <div className={`inline-flex p-4 rounded-full ${goal.color} text-white mb-4 transition-transform group-hover:scale-110`}>
                        {goal.icon}
                      </div>
                      
                      <h3 className="text-2xl md:text-3xl font-bold mb-2" style={{color: '#013062'}}>{goal.name}</h3>
                      <p className="text-gray-600 mb-4 text-sm md:text-base">{goal.desc}</p>
                      
                      {/* Subject badges */}
                      <div className="mb-4 flex flex-wrap gap-2">
                        {subjects[goal.id]?.map((subject, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-full text-xs font-semibold" style={{backgroundColor: '#f0f4f8', color: '#013062'}}>
                            {subject}
                          </span>
                        ))}
                      </div>
                      
                      {/* Exam details for grades 11-12 */}
                      {examDate && examDates[goal.id] && (
                        <div className="mt-4 pt-4 border-t" style={{borderColor: '#e5e7eb'}}>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center text-gray-600">
                                <Calendar className="w-4 h-4 mr-2" style={{color: '#013062'}} />
                                <span>Exam Date</span>
                              </div>
                              <span className="font-semibold" style={{color: '#013062'}}>{new Date(examDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center text-gray-600">
                                <Clock className="w-4 h-4 mr-2" style={{color: '#dc2626'}} />
                                <span>Time Remaining</span>
                              </div>
                              <span className="font-bold" style={{color: '#dc2626'}}>{daysRemaining} days</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Selected indicator */}
                      {selectedGoal === goal.id && (
                        <div className="absolute top-4 right-4">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{backgroundColor: '#013062'}}>
                            <span className="text-white font-bold">✓</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons - Fixed at bottom */}
          <div className="flex-shrink-0 text-center py-8">
            {currentStep === 1 && (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-lg transition-all duration-300 transform text-white shadow-lg hover:shadow-xl ${
                  canProceed()
                    ? 'hover:scale-105'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                style={{
                  backgroundColor: canProceed() ? '#013062' : '#9ca3af'
                }}
              >
                Continue
                <ChevronRight className="inline ml-2 w-5 h-5" />
              </button>
            )}

            {currentStep === 2 && (
              <div className="space-x-4">
                <button
                  onClick={handleStartJourney}
                  disabled={!selectedGoal}
                  className={`px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-lg transition-all duration-300 transform text-white shadow-lg hover:shadow-xl ${
                    selectedGoal
                      ? 'hover:scale-105'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  style={{
                    backgroundColor: selectedGoal ? '#013062' : '#9ca3af'
                  }}
                >
                  Start My Journey! 🚀
                </button>
                
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 md:px-6 py-3 md:py-4 rounded-full border border-gray-400 text-gray-600 hover:bg-gray-100 transition-all duration-300"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Welcome Dialog */}
      {showWelcomeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 md:p-10 max-w-lg w-full mx-4 text-center transform transition-all duration-300 scale-100 shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Animated icon */}
            <div className="mb-6 relative">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center animate-bounce" style={{backgroundColor: '#013062'}}>
                <Trophy className="w-12 h-12 text-white" />
              </div>
              {/* Decorative rings */}
              <div className="absolute inset-0 rounded-full flex items-center justify-center pointer-events-none">
                <div className="w-28 h-28 rounded-full border-2 border-blue-200 animate-pulse" />
              </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{color: '#013062'}}>
              Welcome Aboard! 🎉
            </h2>
            <p className="text-gray-600 text-lg mb-6">
              You're about to embark on an incredible learning journey customized just for you!
            </p>

            {/* Goal Lock Warning */}
            <div className="mb-6 p-4 bg-amber-50 border-l-4 rounded-lg text-left" style={{borderColor: '#f59e0b'}}>
              <div className="flex items-start space-x-3">
                <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Goal is Now Locked</p>
                  <p className="text-xs text-amber-700 mt-1">
                    You can change it later, but it will reset your progress. Choose wisely!
                  </p>
                </div>
              </div>
            </div>

            {/* Features list with icons */}
            <div className="space-y-3 mb-8 text-left bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Personalized Study Plans</p>
                  <p className="text-xs text-gray-600">Built just for your grade and goals</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Smart Progress Tracking</p>
                  <p className="text-xs text-gray-600">Watch your growth in real-time</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">AI-Powered Recommendations</p>
                  <p className="text-xs text-gray-600">Get smarter insights every day</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <button
              onClick={confirmStartJourney}
              disabled={isStartingJourney}
              className={`w-full py-3 md:py-4 rounded-full font-bold text-lg transition-all duration-300 text-white shadow-lg mb-3 flex items-center justify-center space-x-2 ${
                isStartingJourney 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:shadow-xl transform hover:scale-105'
              }`}
              style={{backgroundColor: '#013062'}}
            >
              {isStartingJourney ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Preparing your journey...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  <span>Let's Begin!</span>
                </>
              )}
            </button>

            {!isStartingJourney && (
              <button
                onClick={() => setShowWelcomeDialog(false)}
                className="w-full py-2 text-gray-500 hover:text-gray-700 transition-colors font-medium"
              >
                Review my choices
              </button>
            )}
          </div>
        </div>
      )}

      {/* Goal Change Warning Dialog */}
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
            toast.success('Goal changed! Starting fresh 🎯');
            navigate('/dashboard', { replace: true });
          }}
        />
      )}
    </>
  );
};

export default GoalSelectionPage;
