import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Brain, Play, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotEnoughDataProps {
  totalQuestions: number;
  minRequired: number;
  onRefresh: () => void;
}

export function NotEnoughData({ totalQuestions, minRequired, onRefresh }: NotEnoughDataProps) {
  const navigate = useNavigate();
  const progress = (totalQuestions / minRequired) * 100;

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl">
        <CardContent className="p-8 text-center space-y-5">
          {/* Icon */}
          <div className="relative inline-flex">
            <div className="absolute inset-0 w-24 h-24 bg-[#013062]/10 rounded-full blur-xl" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-[#013062] to-[#024a8c] rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">
              Build Your Foundation First 🎯
            </h3>
            <p className="text-slate-600 text-sm">
              Complete at least <span className="font-bold text-[#013062]">{minRequired} questions</span> to unlock your personalized AI Study Plan.
            </p>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                {totalQuestions}/{minRequired} questions
              </span>
              <span className="text-sm text-[#013062] font-semibold">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              onClick={() => navigate('/study-now')}
              className="bg-[#013062] hover:bg-[#013062]/90"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Practicing
            </Button>
            <Button
              onClick={onRefresh}
              variant="outline"
              className="border-[#013062] text-[#013062]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
