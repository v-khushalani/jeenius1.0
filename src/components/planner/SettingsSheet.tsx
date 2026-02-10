/**
 * Settings Sheet — Daily hours, target exam
 */
import { useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { EXAMS } from '@/lib/ai-planner/constants';
import { cn } from '@/lib/utils';

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dailyStudyHours: number;
  targetExam: string;
  onSave: (hours: number, exam: string) => void;
}

export function SettingsSheet({ open, onOpenChange, dailyStudyHours, targetExam, onSave }: SettingsSheetProps) {
  const [hours, setHours] = useState(dailyStudyHours);
  const [exam, setExam] = useState(targetExam);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[60vh]">
        <SheetHeader className="text-left">
          <SheetTitle className="text-[#013062]">Study Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Daily hours */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-700">Daily Study Hours</span>
              <span className="text-sm font-bold text-[#013062]">{hours}h</span>
            </div>
            <Slider
              value={[hours]}
              onValueChange={([v]) => setHours(v)}
              min={1} max={14} step={0.5}
              className="w-full"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-400">1h</span>
              <span className="text-[10px] text-slate-400">14h</span>
            </div>
          </div>

          {/* Target exam */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Target Exam</p>
            <div className="grid grid-cols-2 gap-2">
              {EXAMS.map(e => (
                <button
                  key={e.value}
                  onClick={() => setExam(e.value)}
                  className={cn(
                    'py-3 px-3 rounded-xl text-sm font-medium border-2 transition-all',
                    exam === e.value
                      ? 'border-[#013062] bg-[#013062]/5 text-[#013062]'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300',
                  )}
                >
                  {e.label}
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    {e.subjects.join(' · ')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => { onSave(hours, exam); onOpenChange(false); }}
            className="w-full bg-[#013062] hover:bg-[#01408a] text-white h-11 rounded-xl"
          >
            Save & Regenerate Plan
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
