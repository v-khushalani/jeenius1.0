/**
 * Empty / Not Enough Data / Diagnostic Needed state
 */
import { Brain, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PLANNER } from '@/lib/ai-planner/constants';

interface EmptyStateProps {
  studentName: string;
  totalQuestions: number;
  needsDiagnostic: boolean;
}

export function EmptyState({ studentName, totalQuestions, needsDiagnostic }: EmptyStateProps) {
  const navigate = useNavigate();
  const firstName = studentName?.split(' ')[0] || 'there';
  const remaining = PLANNER.MIN_QUESTIONS - totalQuestions;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      {/* Animated brain */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-[#013062]/10 animate-pulse absolute inset-0 blur-xl" />
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#013062] to-[#01408a] flex items-center justify-center relative">
          <Brain className="w-10 h-10 text-white" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-900">
        {needsDiagnostic ? `Hey ${firstName}, let's get started` : `Almost there, ${firstName}!`}
      </h2>

      <p className="text-sm text-slate-500 mt-2 max-w-sm">
        {needsDiagnostic
          ? 'Your AI planner needs to understand your strengths. Take a quick diagnostic or solve some practice questions to activate your personalized study plan.'
          : `Solve ${remaining} more question${remaining > 1 ? 's' : ''} to unlock your AI-powered study plan. The planner learns from your performance data.`
        }
      </p>

      {/* Progress indicator */}
      <div className="w-full max-w-xs mt-6">
        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
          <span>{totalQuestions} solved</span>
          <span>{PLANNER.MIN_QUESTIONS} needed</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#013062] to-[#01408a] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (totalQuestions / PLANNER.MIN_QUESTIONS) * 100)}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-3 mt-8 w-full max-w-xs">
        <Button
          onClick={() => navigate('/study-now')}
          className="w-full bg-[#013062] hover:bg-[#01408a] text-white h-12 rounded-xl text-sm font-medium"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Start Practicing
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/tests')}
          className="w-full h-11 rounded-xl text-sm border-[#013062] text-[#013062] hover:bg-[#013062]/5"
        >
          Take a Quick Test
        </Button>
      </div>
    </div>
  );
}
