/**
 * SettingsSheet — Study hours & exam settings in a bottom sheet
 */

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Clock, GraduationCap } from 'lucide-react';
import type { TimeAllocation } from '@/lib/planner/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dailyStudyHours: number;
  targetExam: string;
  timeAllocation: TimeAllocation;
  onSave: (hours: number, exam: string) => void;
}

const EXAM_OPTIONS = [
  { value: 'JEE', label: 'JEE', desc: 'Main / Advanced' },
  { value: 'NEET', label: 'NEET', desc: 'Medical' },
  { value: 'CET', label: 'MHT-CET', desc: 'Maharashtra' },
  { value: 'Foundation', label: 'Foundation', desc: 'Board Prep' },
];

export function SettingsSheet({ open, onOpenChange, dailyStudyHours, targetExam, timeAllocation, onSave }: Props) {
  const [hours, setHours] = useState(dailyStudyHours);
  const [exam, setExam] = useState(targetExam);

  useEffect(() => {
    setHours(dailyStudyHours);
    setExam(targetExam);
  }, [dailyStudyHours, targetExam]);

  const handleSave = () => {
    onSave(hours, exam);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh]">
        <SheetHeader>
          <SheetTitle className="text-left text-lg">Study Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Daily hours */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-[#013062]" />
              <span className="text-sm font-medium text-slate-700">Daily Study Hours</span>
              <span className="ml-auto text-lg font-bold text-[#013062]">{hours}h</span>
            </div>

            <input
              type="range"
              min={1} max={12} step={0.5}
              value={hours}
              onChange={e => setHours(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#013062]"
            />

            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-slate-400">1h</span>
              <span className="text-[10px] text-slate-400">6h</span>
              <span className="text-[10px] text-slate-400">12h</span>
            </div>

            {/* Allocation preview */}
            <div className="mt-3 flex items-center gap-1.5">
              <div className="h-2 rounded-full bg-[#013062]" style={{ width: `${timeAllocation.study * 100}%` }} title="Study" />
              <div className="h-2 rounded-full bg-[#0261cc]" style={{ width: `${timeAllocation.revision * 100}%` }} title="Revision" />
              <div className="h-2 rounded-full bg-[#4a9eff]" style={{ width: `${timeAllocation.practice * 100}%` }} title="Practice" />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-400">Study {Math.round(timeAllocation.study * hours * 60)}m</span>
              <span className="text-[10px] text-slate-400">Revision {Math.round(timeAllocation.revision * hours * 60)}m</span>
              <span className="text-[10px] text-slate-400">Practice {Math.round(timeAllocation.practice * hours * 60)}m</span>
            </div>
          </div>

          {/* Target exam */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="h-4 w-4 text-[#013062]" />
              <span className="text-sm font-medium text-slate-700">Target Exam</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {EXAM_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setExam(opt.value)}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                    exam === opt.value || (exam && exam.includes(opt.value))
                      ? 'border-[#013062] bg-[#013062]/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className={`text-sm font-semibold ${
                    exam === opt.value || (exam && exam.includes(opt.value)) ? 'text-[#013062]' : 'text-slate-700'
                  }`}>
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-slate-400">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          <Button
            onClick={handleSave}
            className="w-full bg-[#013062] hover:bg-[#024a8c] text-white font-semibold py-6 rounded-xl"
          >
            Save & Regenerate Plan
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
