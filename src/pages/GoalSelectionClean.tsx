import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

const GoalSelectionClean = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [grade, setGrade] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  const GRADES = ['6', '7', '8', '9', '10', '11', '12'];
  const isFoundation = grade && parseInt(grade) <= 10;
  const goals = isFoundation 
    ? ['Foundation Course']
    : ['JEE', 'NEET'];

  useEffect(() => {
    if (!user?.id) return;

    const checkProfile = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('grade, target_exam')
          .eq('id', user.id)
          .single();

        if (data?.grade && data?.target_exam) {
          logger.log('Profile already set, redirecting...');
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        logger.log('Profile not set, proceeding to goal selection');
      } finally {
        setIsCheckingProfile(false);
      }
    };

    checkProfile();
  }, [user?.id, navigate]);

  const handleConfirm = async () => {
    if (!grade || !goal || !user?.id) return;

    try {
      setIsLoading(true);

      const gradeNum = parseInt(grade);
      const targetExam = goal === 'Foundation Course' 
        ? `Foundation-${gradeNum}`
        : goal;

      const examType = goal === 'Foundation Course' ? 'Foundation' : goal;

      // Find matching batch
      const { data: batch } = await supabase
        .from('batches')
        .select('id')
        .eq('grade', gradeNum)
        .eq('exam_type', examType)
        .eq('is_active', true)
        .single();

      // Update profile
      await supabase
        .from('profiles')
        .update({
          grade: gradeNum,
          target_exam: targetExam,
          selected_goal: goal.toLowerCase(),
        })
        .eq('id', user.id);

      logger.log('✅ Goal selection saved:', { grade: gradeNum, exam: targetExam });
      toast.success('Profile updated! Redirecting...');
      
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    } catch (err: any) {
      logger.error('Error saving goal:', err);
      toast.error(err.message || 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-2">🎓 Select Your Learning Path</CardTitle>
            <p className="text-gray-600">Step {step} of 2</p>
          </CardHeader>

          <CardContent className="p-8">
            {step === 1 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Select Your Class</h3>
                <div className="grid grid-cols-4 gap-2">
                  {GRADES.map(g => (
                    <Button
                      key={g}
                      onClick={() => setGrade(g)}
                      variant={grade === g ? 'default' : 'outline'}
                      className="w-full"
                    >
                      {g}
                    </Button>
                  ))}
                </div>

                <div className="pt-4 flex gap-2">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!grade}
                    className="flex-1"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Select Your Goal</h3>
                <div className="grid grid-cols-2 gap-3">
                  {goals.map(g => (
                    <Button
                      key={g}
                      onClick={() => setGoal(g)}
                      variant={goal === g ? 'default' : 'outline'}
                      className="h-16 w-full"
                    >
                      {g}
                    </Button>
                  ))}
                </div>

                <div className="pt-4 flex gap-2">
                  <Button
                    onClick={() => {
                      setStep(1);
                      setGoal('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    ← Back
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={!goal || isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'Saving...' : 'Start Learning'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GoalSelectionClean;
