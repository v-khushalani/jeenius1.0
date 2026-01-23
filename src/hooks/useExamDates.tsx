import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface ExamConfig {
  exam_name: string;
  exam_date: string;
}

export const useExamDates = () => {
  const [jeeDate, setJeeDate] = useState('2026-05-24');
  const [neetDate, setNeetDate] = useState('2026-05-05');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExamDates();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('exam_dates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exam_config'
        },
        () => {
          loadExamDates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadExamDates = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_config')
        .select('exam_name, exam_date');

      if (error) throw error;

      const jee = data?.find((e: ExamConfig) => e.exam_name === 'JEE');
      const neet = data?.find((e: ExamConfig) => e.exam_name === 'NEET');

      if (jee) setJeeDate(jee.exam_date);
      if (neet) setNeetDate(neet.exam_date);
    } catch (error) {
      logger.error('Error loading exam dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExamDate = (examType: 'JEE' | 'NEET') => {
    return examType === 'JEE' ? jeeDate : neetDate;
  };

  return { jeeDate, neetDate, getExamDate, loading };
};