/**
 * EmptyState — Shown when student hasn't solved enough questions yet
 * Encouraging, not patronizing. Shows clear path to unlocking.
 */

import { BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Props {
  totalQuestions: number;
  minRequired: number;
  studentName: string;
}

export function EmptyState({ totalQuestions, minRequired, studentName }: Props) {
  const navigate = useNavigate();
  const percent = Math.min(99, Math.round((totalQuestions / minRequired) * 100));
  const remaining = Math.max(0, minRequired - totalQuestions);
  const name = studentName?.split(' ')[0] || 'there';

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
      {/* Icon */}
      <div className="w-20 h-20 bg-[#013062]/10 rounded-2xl flex items-center justify-center mb-5">
        <BookOpen className="h-10 w-10 text-[#013062]" />
      </div>

      {/* Message */}
      <h3 className="text-lg font-semibold text-slate-800 mb-1">
        Hey {name}, your planner is almost ready
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        Solve {remaining} more question{remaining !== 1 ? 's' : ''} so we can build a plan that actually fits your strengths and gaps.
      </p>

      {/* Progress */}
      <div className="w-full max-w-xs mb-6">
        <div className="flex justify-between mb-1.5">
          <span className="text-xs text-slate-400">{totalQuestions} solved</span>
          <span className="text-xs font-medium text-[#013062]">{minRequired} needed</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#013062] to-[#0261cc] rounded-full transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">{percent}% there</p>
      </div>

      {/* CTA */}
      <Button
        onClick={() => navigate('/study-now')}
        className="bg-[#013062] hover:bg-[#024a8c] text-white font-semibold px-8 py-5 rounded-xl gap-2"
      >
        Start Practicing
        <ArrowRight className="h-4 w-4" />
      </Button>

      <p className="text-[10px] text-slate-400 mt-4">
        The more you practice, the smarter your plan gets.
      </p>
    </div>
  );
}
