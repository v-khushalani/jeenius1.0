import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface Batch {
  id: string;
  name: string;
  grade: number;
  exam_type: string;
  subjects: string[];
}

interface StudentProfile {
  grade: number;
  target_exam: string;
}

export const useBatch = (profile: StudentProfile | null) => {
  const [batch, setBatch] = useState<Batch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.grade || !profile?.target_exam) {
      setBatch(null);
      return;
    }

    fetchBatch();
  }, [profile?.grade, profile?.target_exam]);

  const fetchBatch = async () => {
    if (!profile) return;

    try {
      setIsLoading(true);
      setError(null);

      logger.log('🔍 Fetching batch:', {
        grade: profile.grade,
        exam: profile.target_exam,
      });

      let examType = profile.target_exam;
      if (profile.target_exam.startsWith('Foundation')) {
        examType = 'Foundation';
      }

      const { data, error: queryError } = await supabase
        .from('batches')
        .select('id, name, grade, exam_type')
        .eq('grade', profile.grade)
        .eq('exam_type', examType)
        .eq('is_active', true)
        .single();

      if (queryError) throw queryError;

      if (data) {
        // Get subjects from batch_subjects table
        const { data: subjectsData } = await supabase
          .from('batch_subjects')
          .select('subject')
          .eq('batch_id', data.id);

        const subjects = subjectsData?.map(s => s.subject) || [];

        setBatch({
          id: data.id,
          name: data.name,
          grade: data.grade,
          exam_type: data.exam_type,
          subjects,
        });

        logger.log('✅ Batch loaded:', data.name);
      }
    } catch (err: any) {
      logger.error('Error in useBatch:', err);
      setError(err.message || 'Failed to load batch');
    } finally {
      setIsLoading(false);
    }
  };

  return { batch, isLoading, error };
};
