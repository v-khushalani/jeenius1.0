/**
 * BATCH CONFIGURATION UTILITY - CLEAN ARCHITECTURE
 * 
 * Links together: Grade → Batch → Subjects → Questions
 * 
 * ARCHITECTURE:
 * - Grade 6-10: Foundation-X batches (PCMB subjects only, MCQ questions only)
 * - Grade 7: Scholarship batch option (SMAT subjects)
 * - Grade 11: JEE/NEET/CET batches (exam-specific subjects)
 * - Grade 12: JEE/NEET/CET batches (exam-specific subjects, shared curriculum with 11th)
 * 
 * CRITICAL RULE:
 * Each student belongs to EXACTLY ONE BATCH
 * Each student solves questions ONLY from their batch's exam field
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';
import { parseGrade, isFoundationGrade, extractGradeFromExamType } from './gradeParser';

export interface BatchInfo {
  id: string;
  name: string;
  slug: string;
  grade: number;
  exam_type: string;
  subjects: string[];
  description?: string;
}

export interface SubjectConfig {
  [key: string]: string[]; // exam_type -> allowed subjects for UI
}

/**
 * Subject configuration - determines what subjects appear in UI
 * 
 * PCMB:       Physics, Chemistry, Mathematics, Biology (Grades 6-10)
 * Scholarship: Mathematics, Science, Mental Ability, English (Grade 7 optional)
 * JEE:        Physics, Chemistry, Mathematics (Grades 11-12)
 * NEET:       Physics, Chemistry, Biology (Grades 11-12)
 * CET:        Physics, Chemistry, Biology, Mathematics (Grades 11-12, State exams)
 */
export const SUBJECT_CONFIG: SubjectConfig = {
  // Foundation: Grades 6-10 (PCMB only)
  'Foundation-6': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  'Foundation-7': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  'Foundation-8': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  'Foundation-9': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  'Foundation-10': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  
  // Scholarship: Grade 7 (SMAT)
  'Scholarship': ['Mathematics', 'Science', 'Mental Ability', 'English'],
  
  // JEE: Grades 11-12 (PCM)
  'JEE': ['Physics', 'Chemistry', 'Mathematics'],
  'JEE Main': ['Physics', 'Chemistry', 'Mathematics'],
  'JEE Advanced': ['Physics', 'Chemistry', 'Mathematics'],
  
  // NEET: Grades 11-12 (PCB)
  'NEET': ['Physics', 'Chemistry', 'Biology'],
  
  // CET: Grades 11-12 (PCMB)
  'CET': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  
  // Legacy/Other
  'Foundation': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  'Olympiad': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  'Homi Bhabha': ['Science', 'Mathematics']
};

/**
 * Get allowed subjects for a target exam type
 */
export const getAllowedSubjects = (targetExam: string): string[] => {
  return SUBJECT_CONFIG[targetExam] || SUBJECT_CONFIG['JEE'];
};

/**
 * Get batch info for a student based on grade and target exam
 * 
 * @param userId - Student's user ID
 * @param grade - Student's grade (numeric)
 * @param targetExam - Student's target exam (e.g., "Foundation-9", "JEE")
 * @returns Batch info with subjects from batch_subjects table
 */
export const getBatchForStudent = async (
  userId: string,
  grade: number,
  targetExam: string
): Promise<BatchInfo | null> => {
  try {
    const parsedGrade = parseGrade(grade);
    
    logger.info('getBatchForStudent', {
      userId,
      parsedGrade,
      targetExam
    });

    // Determine if student is in Foundation or JEE/NEET
    if (isFoundationGrade(parsedGrade)) {
      // Foundation student - find batch by grade
      const gradeFromExam = extractGradeFromExamType(targetExam);
      const gradeToUse = gradeFromExam >= 6 && gradeFromExam <= 10 ? gradeFromExam : parsedGrade;

      const { data: batch, error } = await supabase
        .from('batches')
        .select(`
          id,
          name,
          slug,
          grade,
          exam_type,
          batch_subjects (subject)
        `)
        .eq('grade', gradeToUse)
        .eq('exam_type', 'Foundation')
        .eq('is_active', true)
        .single();

      if (error) {
        logger.warn('Batch not found for Foundation student', { gradeToUse, error });
        return null;
      }

      return {
        id: batch.id,
        name: batch.name,
        slug: batch.slug,
        grade: batch.grade,
        exam_type: batch.exam_type,
        subjects: batch.batch_subjects?.map((bs: any) => bs.subject) || []
      };
    } else {
      // JEE/NEET student (grades 11-12) - find batch by exam type
      const examType = targetExam?.startsWith('Foundation')
        ? 'JEE' // Fallback if somehow marked as Foundation
        : targetExam?.includes('NEET')
          ? 'NEET'
          : 'JEE';

      const { data: batch, error } = await supabase
        .from('batches')
        .select(`
          id,
          name,
          slug,
          grade,
          exam_type,
          batch_subjects (subject)
        `)
        .eq('exam_type', examType)
        .eq('grade', parsedGrade)
        .eq('is_active', true)
        .single();

      if (error) {
        logger.warn('Batch not found for JEE/NEET student', { examType, parsedGrade, error });
        return null;
      }

      return {
        id: batch.id,
        name: batch.name,
        slug: batch.slug,
        grade: batch.grade,
        exam_type: batch.exam_type,
        subjects: batch.batch_subjects?.map((bs: any) => bs.subject) || []
      };
    }
  } catch (error) {
    logger.error('Error getting batch for student:', error);
    return null;
  }
};

/**
 * Get subjects available in a specific batch
 * Always fetches from batch_subjects table for accuracy
 */
export const getBatchSubjectsFromDB = async (batchId: string): Promise<string[]> => {
  try {
    const { data: subjects, error } = await supabase
      .from('batch_subjects')
      .select('subject')
      .eq('batch_id', batchId)
      .order('display_order', { ascending: true });

    if (error || !subjects) {
      return [];
    }

    return subjects.map(s => s.subject);
  } catch (error) {
    logger.error('Error fetching batch subjects from DB:', error);
    return [];
  }
};

/**
 * Filter subjects - intersection of allowed (by target_exam) and available (by batch)
 * 
 * @param targetExam - Student's target exam
 * @param batchSubjects - Subjects available in the batch
 * @returns Filtered subjects that are both allowed and available
 */
export const getFilteredSubjects = (
  targetExam: string,
  batchSubjects: string[]
): string[] => {
  const allowedSubjects = getAllowedSubjects(targetExam);
  
  // Return intersection - only subjects that are both allowed AND in the batch
  return batchSubjects.filter(subject => allowedSubjects.includes(subject));
};

/**
 * Validate if a subject is allowed for a student
 */
export const isSubjectAllowed = (
  targetExam: string,
  subject: string,
  batchSubjects: string[]
): boolean => {
  const allowedSubjects = getAllowedSubjects(targetExam);
  return allowedSubjects.includes(subject) && batchSubjects.includes(subject);
};

/**
 * Create dependency array for useEffect
 * Returns array of values that should trigger refetch when changed
 */
export const getBatchDependencies = (profile: any): (string | number | undefined)[] => {
  return [
    profile?.grade,        // Grade change → might change batch
    profile?.target_exam,  // Target exam change → might change batch or allowed subjects
    profile?.batch_id      // Explicit batch selection
  ];
};

/**
 * Determine exam type from grade (CRITICAL LOGIC)
 * Grade determines exam type automatically:
 * - Grades 6-10: Foundation (PCMB)
 * - Grades 11-12: JEE or NEET (based on target_exam selection)
 */
export const getExamTypeForGrade = (
  grade: number,
  targetExam?: string
): string => {
  const parsedGrade = parseGrade(grade);
  
  // Grades 6-10: Always Foundation
  if (isFoundationGrade(parsedGrade)) {
    return 'Foundation';
  }
  
  // Grades 11-12: Determine from target_exam
  if (parsedGrade >= 11 && parsedGrade <= 12) {
    if (targetExam?.includes('NEET')) {
      return 'NEET';
    }
    return 'JEE';
  }
  
  return 'JEE'; // Default fallback
};

/**
 * Log batch configuration for debugging
 */
export const logBatchConfig = (
  stage: string,
  userId: string,
  grade: number,
  targetExam: string,
  batch?: BatchInfo | null
) => {
  logger.info(`BATCH_CONFIG [${stage}]`, {
    userId,
    grade: parseGrade(grade),
    targetExam,
    batchFound: !!batch,
    batchId: batch?.id,
    batchName: batch?.name,
    batchExamType: batch?.exam_type,
    subjectCount: batch?.subjects.length || 0,
    subjects: batch?.subjects
  });
};
