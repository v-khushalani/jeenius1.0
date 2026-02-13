/**
 * Program Switcher Component
 * 
 * Allows students to switch between their purchased/available programs
 * Only ONE program can be active at a time for practice
 */

import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import {
  Program,
  getProgramsForGrade,
  getProgramInfo,
  normalizeProgram,
} from '@/utils/programConfig';
import { parseGrade } from '@/utils/gradeParser';

interface ProgramSwitcherProps {
  onProgramChange?: (program: Program) => void;
  className?: string;
  showLabel?: boolean;
}

interface ProgramAccess {
  program: Program;
  hasAccess: boolean;
  isFree: boolean;
}

const ProgramSwitcher: React.FC<ProgramSwitcherProps> = ({
  onProgramChange,
  className = '',
  showLabel = true,
}) => {
  const [activeProgram, setActiveProgram] = useState<Program>('Class');
  const [grade, setGrade] = useState<number>(9);
  const [availablePrograms, setAvailablePrograms] = useState<ProgramAccess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserPrograms();
  }, []);

  const loadUserPrograms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('grade, target_exam')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const userGrade = parseGrade(profile.grade || 9);
      setGrade(userGrade);

      // Get current active program from target_exam (using target_exam as the source of truth)
      const currentProgram = normalizeProgram(profile.target_exam);
      setActiveProgram(currentProgram);

      // Get available programs for this grade
      const gradePrograms = getProgramsForGrade(userGrade);

      // Get user's batch subscriptions to check access
      const { data: subscriptions } = await supabase
        .from('user_batch_subscriptions')
        .select('batch_id, batches(exam_type, grade)')
        .eq('user_id', user.id)
        .gte('expires_at', new Date().toISOString());

      // Build program access list
      const programAccess: ProgramAccess[] = gradePrograms.map(program => {
        const programInfo = getProgramInfo(program);
        // Check if user has a subscription to a batch with matching exam_type (which maps to program)
        const hasSubscription = subscriptions?.some(
          sub => {
            const batch = sub.batches as any;
            return batch?.exam_type === program || normalizeProgram(batch?.exam_type) === program;
          }
        );
        
        return {
          program,
          hasAccess: programInfo.isFreeAvailable || hasSubscription,
          isFree: programInfo.isFreeAvailable,
        };
      });

      setAvailablePrograms(programAccess);
    } catch (error) {
      logger.error('Error loading user programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProgramSwitch = async (program: Program) => {
    const programAccess = availablePrograms.find(p => p.program === program);
    
    if (!programAccess?.hasAccess) {
      toast.error(`Purchase ${program} to access this program`);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update profile with new active program (stored in target_exam)
      const { error } = await supabase
        .from('profiles')
        .update({ 
          target_exam: program,
        })
        .eq('id', user.id);

      if (error) throw error;

      setActiveProgram(program);
      toast.success(`Switched to ${program}`);
      
      if (onProgramChange) {
        onProgramChange(program);
      }
    } catch (error) {
      logger.error('Error switching program:', error);
      toast.error('Failed to switch program');
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-muted rounded-lg h-10 w-32 ${className}`} />
    );
  }

  const activeProgramInfo = getProgramInfo(activeProgram);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={`flex items-center gap-2 ${className}`}
        >
          <span className="text-lg">{activeProgramInfo.icon}</span>
          {showLabel && (
            <span className="font-medium">{activeProgramInfo.displayName}</span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-muted-foreground">
          {grade}th Class Programs
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {availablePrograms.map(({ program, hasAccess, isFree }) => {
          const info = getProgramInfo(program);
          const isActive = program === activeProgram;
          
          return (
            <DropdownMenuItem
              key={program}
              onClick={() => handleProgramSwitch(program)}
              disabled={!hasAccess}
              className={`flex items-center justify-between py-3 cursor-pointer ${
                isActive ? 'bg-primary/10' : ''
              } ${!hasAccess ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{info.icon}</span>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {info.displayName}
                    {isFree && (
                      <Badge variant="secondary" className="text-xs">
                        Free
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {info.subjects.join(' • ')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                {isActive && (
                  <Check className="h-4 w-4 text-primary" />
                )}
                {!hasAccess && (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-primary cursor-pointer"
          onClick={() => window.location.href = '/batches'}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Explore More Programs
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProgramSwitcher;
