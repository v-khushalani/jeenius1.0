/**
 * Quick Replan Sheet — "I only have X hours today"
 */
import { useState } from 'react';
import { Clock, Sparkles } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface QuickReplanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentHours: number;
  onReplan: (minutes: number) => void;
}

const PRESETS = [
  { label: '1 hr', mins: 60 },
  { label: '2 hrs', mins: 120 },
  { label: '3 hrs', mins: 180 },
  { label: '4 hrs', mins: 240 },
];

export function QuickReplanSheet({ open, onOpenChange, currentHours, onReplan }: QuickReplanSheetProps) {
  const [mins, setMins] = useState(currentHours * 60);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[50vh]">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-[#013062]">
            <Clock className="w-5 h-5" /> Quick Replan
          </SheetTitle>
          <SheetDescription>
            How much time do you have today? AI will pick the highest ROI tasks.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Presets */}
          <div className="flex gap-2">
            {PRESETS.map(p => (
              <button
                key={p.mins}
                onClick={() => setMins(p.mins)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mins === p.mins
                    ? 'bg-[#013062] text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Slider for custom */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Custom</span>
              <span className="text-sm font-bold text-[#013062]">
                {Math.floor(mins / 60)}h {mins % 60 > 0 ? `${mins % 60}m` : ''}
              </span>
            </div>
            <Slider
              value={[mins]}
              onValueChange={([v]) => setMins(v)}
              min={30}
              max={720}
              step={30}
              className="w-full"
            />
          </div>

          <Button
            onClick={() => { onReplan(mins); onOpenChange(false); }}
            className="w-full bg-[#013062] hover:bg-[#01408a] text-white h-11 rounded-xl"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Replan for {Math.floor(mins / 60)}h {mins % 60 > 0 ? `${mins % 60}m` : ''}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
