/**
 * BATCH QUERY BUILDER
 * 
 * Centralized logic for building database queries that filter by batch
 * Ensures students can ONLY see questions from their batch
 * 
 * ARCHITECTURE:
 * - Class 6-10: Foundation batches → Questions with exam field matching batch
 * - Class 7: Scholarship batch → Questions with exam="Scholarship"
 * - Class 11: JEE/NEET/CET batches → Questions with exam matching batch
 * - Class 12: JEE/NEET/CET batches → Questions with exam matching batch
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

export interface BatchQueryFilters {
  batchId: string;           // Unique batch identifier
  examType: string;          // 'Foundation-6', 'JEE', 'NEET', 'CET', 'Scholarship'
  grade: number;             // 6-12
  subject?: string;
  chapter?: string;
  topic?: string;
  difficulty?: string;
  limit?: number;
}

/**
 * Map batch to exam field value used in questions table
 * 
 * CRITICAL LOGIC:
 * - Foundation-6 to Foundation-10 → exam='Foundation-6', 'Foundation-7', etc.
 * - 7th Scholarship → exam='Scholarship'
 * - 11th JEE → exam='JEE'
 * - 11th NEET → exam='NEET'
 * - 11th CET → exam='CET'
 * - 12th JEE → exam='JEE' (shares with 11th)
 * - 12th NEET → exam='NEET' (shares with 11th)
 * - 12th CET → exam='CET' (shares with 11th)
 */
export const mapBatchToExamField = (examType: string, grade?: number): string => {
  if (examType.startsWith('Foundation')) {
    // Foundation-6, Foundation-7, ... Foundation-10
    return examType;
  }
  
  if (examType === 'Scholarship') {
    return 'Scholarship';
  }
  
  // JEE, NEET, CET for both grades 11 and 12
  return examType;
};

/**
 * Get all chapters for a batch with proper filtering
 * 
 * Foundation students: Only chapters from their grade batch
 * 11-12 students: Chapters from their exam (JEE/NEET/CET)
 */
export const getChaptersForBatch = async (filters: {
  batchId: string;
  examType: string;
  subject: string;
  grade: number;
}) => {
  try {
    let query = supabase
      .from('chapters')
      .select('id, chapter_name, chapter_number, description, difficulty_level, batch_id, subject')
      .eq('subject', filters.subject);

    // For Foundation students, filter by batch_id
    if (filters.examType.startsWith('Foundation')) {
      query = query.eq('batch_id', filters.batchId);
      logger.info('Foundation chapter query', { 
        batchId: filters.batchId, 
        subject: filters.subject 
      });
    }
    // For 11-12 students, don't filter by batch_id (they share chapters across grades)
    // Just use the exam type filtering in questions

    query = query.order('chapter_number', { ascending: true });

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching chapters for batch', { error, filters });
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Error in getChaptersForBatch', { error, filters });
    throw error;
  }
};

/**
 * Get topics for a specific subject-chapter combination
 * Filtered by batch/exam type
 */
export const getTopicsForChapter = async (filters: {
  batchId: string;
  examType: string;
  grade: number;
  subject: string;
  chapter: string;
}) => {
  try {
    const examField = mapBatchToExamField(filters.examType, filters.grade);

    const { data, error } = await supabase
      .from('questions')
      .select('topic')
      .eq('exam', examField)
      .eq('subject', filters.subject)
      .eq('chapter', filters.chapter);

    if (error) {
      logger.error('Error fetching topics', { error, filters });
      throw error;
    }

    // Get unique topics
    const uniqueTopics = [...new Set(data?.map(q => q.topic).filter(Boolean) || [])];
    
    logger.info('Topics fetched for chapter', {
      examType: filters.examType,
      subject: filters.subject,
      chapter: filters.chapter,
      topicCount: uniqueTopics.length
    });

    return uniqueTopics;
  } catch (error) {
    logger.error('Error in getTopicsForChapter', { error, filters });
    throw error;
  }
};

/**
 * Get practice questions for a specific filter set
 * 
 * CRITICAL: This is the MAIN filtering point
 * All questions returned are ONLY from the student's batch/exam
 */
export const getPracticeQuestions = async (filters: {
  batchId: string;
  examType: string;
  grade: number;
  subject: string;
  chapter?: string;
  topic?: string;
  difficulty?: string;
  limit?: number;
  excludeIds?: string[];
}) => {
  try {
    const examField = mapBatchToExamField(filters.examType, filters.grade);
    const limit = filters.limit || 5;

    let query = supabase
      .from('questions')
      .select('*')
      .eq('exam', examField)
      .eq('subject', filters.subject);

    // Filter by chapter if provided
    if (filters.chapter) {
      query = query.eq('chapter', filters.chapter);
    }

    // Filter by topic if provided
    if (filters.topic) {
      query = query.eq('topic', filters.topic);
    }

    // Filter by difficulty if provided
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    // Exclude already attempted questions
    if (filters.excludeIds && filters.excludeIds.length > 0) {
      query = query.not('id', 'in', `(${filters.excludeIds.map(id => `'${id}'`).join(',')})`);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching practice questions', { error, filters });
      throw error;
    }

    logger.info('Practice questions fetched', {
      examType: filters.examType,
      subject: filters.subject,
      chapter: filters.chapter,
      topic: filters.topic,
      questionCount: data?.length || 0,
      totalRequested: limit
    });

    return data || [];
  } catch (error) {
    logger.error('Error in getPracticeQuestions', { error, filters });
    throw error;
  }
};

/**
 * Get test series questions (for test mode)
 * Returns 20-30 questions for a complete test
 */
export const getTestSeriesQuestions = async (filters: {
  batchId: string;
  examType: string;
  grade: number;
  subjects?: string[];
  testDuration?: number; // in minutes
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
}) => {
  try {
    const examField = mapBatchToExamField(filters.examType, filters.grade);
    const questionCount = filters.testDuration ? Math.ceil(filters.testDuration / 1.5) : 30;

    let query = supabase
      .from('questions')
      .select('*')
      .eq('exam', examField);

    // Filter by subjects if provided
    if (filters.subjects && filters.subjects.length > 0) {
      query = query.in('subject', filters.subjects);
    }

    // Filter by difficulty if not 'Mixed'
    if (filters.difficulty && filters.difficulty !== 'Mixed') {
      query = query.eq('difficulty', filters.difficulty);
    }

    query = query.limit(questionCount);

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching test questions', { error, filters });
      throw error;
    }

    logger.info('Test questions fetched', {
      examType: filters.examType,
      subjects: filters.subjects,
      questionCount: data?.length || 0,
      totalRequested: questionCount
    });

    return data || [];
  } catch (error) {
    logger.error('Error in getTestSeriesQuestions', { error, filters });
    throw error;
  }
};

/**
 * Get question statistics for a student's batch
 * Shows total questions available, by difficulty, etc.
 */
export const getQuestionStatistics = async (filters: {
  batchId: string;
  examType: string;
  grade: number;
  subject?: string;
}) => {
  try {
    const examField = mapBatchToExamField(filters.examType, filters.grade);

    let query = supabase
      .from('questions')
      .select('subject, difficulty, chapter')
      .eq('exam', examField);

    if (filters.subject) {
      query = query.eq('subject', filters.subject);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching question statistics', { error, filters });
      throw error;
    }

    // Calculate statistics
    const stats = {
      total: data?.length || 0,
      byDifficulty: {
        Easy: data?.filter(q => q.difficulty === 'Easy').length || 0,
        Medium: data?.filter(q => q.difficulty === 'Medium').length || 0,
        Hard: data?.filter(q => q.difficulty === 'Hard').length || 0
      },
      bySubject: {} as Record<string, number>,
      byChapter: {} as Record<string, number>
    };

    // Count by subject
    data?.forEach(q => {
      stats.bySubject[q.subject] = (stats.bySubject[q.subject] || 0) + 1;
    });

    // Count by chapter
    data?.forEach(q => {
      stats.byChapter[q.chapter] = (stats.byChapter[q.chapter] || 0) + 1;
    });

    logger.info('Question statistics calculated', {
      examType: filters.examType,
      subject: filters.subject,
      totalQuestions: stats.total
    });

    return stats;
  } catch (error) {
    logger.error('Error in getQuestionStatistics', { error, filters });
    throw error;
  }
};

/**
 * Validate that a question belongs to the student's batch
 * Used when attempting questions to prevent security bypass
 */
export const validateQuestionBelongsToBatch = async (
  questionId: string,
  examType: string,
  grade: number
): Promise<boolean> => {
  try {
    const examField = mapBatchToExamField(examType, grade);

    const { data, error } = await supabase
      .from('questions')
      .select('id')
      .eq('id', questionId)
      .eq('exam', examField)
      .single();

    if (error || !data) {
      logger.warn('Question validation failed', { 
        questionId, 
        examType, 
        grade,
        error 
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error validating question', { error, questionId, examType, grade });
    return false;
  }
};

/**
 * Log batch query operation for debugging
 */
export const logBatchQueryOperation = (
  operation: string,
  filters: BatchQueryFilters,
  result?: any
) => {
  logger.info(`BATCH_QUERY [${operation}]`, {
    examType: filters.examType,
    grade: filters.grade,
    subject: filters.subject,
    chapter: filters.chapter,
    topic: filters.topic,
    resultCount: result?.length || result?.total || 0
  });
};
