/**
 * PROGRAM CONFIGURATION - Simple & Strong Architecture
 * 
 * FLOW:
 * 1. Student selects Grade (6-12)
 * 2. Student sees available Programs for that grade
 * 3. Student selects ONE program to practice at a time
 * 4. Content is filtered by: grade + active_program
 * 
 * PROGRAMS:
 * - Foundation: School syllabus + basic competitive (Grades 6-10)
 * - Scholarship: NTSE, Scholarship exams (Grades 6-10)
 * - Olympiad: NSO, IMO, IEO, etc. (Grades 6-10)
 * - JEE: IIT-JEE Main + Advanced (Grades 11-12)
 * - NEET: Medical entrance (Grades 11-12)
 * - CET: State level engineering (Grades 11-12)
 * - Boards: Board exam prep only (Grades 11-12)
 */

import { logger } from './logger';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type Program = 
  | 'Foundation' 
  | 'Scholarship' 
  | 'Olympiad' 
  | 'JEE' 
  | 'NEET' 
  | 'CET' 
  | 'Boards';

export type Grade = 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface ProgramInfo {
  name: Program;
  displayName: string;
  description: string;
  subjects: string[];
  icon: string;
  color: string;
  isFreeAvailable: boolean;
}

// ============================================
// GRADE → PROGRAMS MAPPING
// ============================================

/**
 * Which programs are available for each grade
 */
export const GRADE_PROGRAMS: Record<number, Program[]> = {
  6: ['Foundation', 'Scholarship', 'Olympiad'],
  7: ['Foundation', 'Scholarship', 'Olympiad'],
  8: ['Foundation', 'Scholarship', 'Olympiad'],
  9: ['Foundation', 'Scholarship', 'Olympiad'],
  10: ['Foundation', 'Scholarship', 'Olympiad'],
  11: ['JEE', 'NEET', 'CET', 'Boards'],
  12: ['JEE', 'NEET', 'CET', 'Boards'],
};

// ============================================
// PROGRAM → SUBJECTS MAPPING
// ============================================

/**
 * Which subjects are included in each program
 */
export const PROGRAM_SUBJECTS: Record<Program, string[]> = {
  'Foundation': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  'Scholarship': ['Mathematics', 'Science', 'Mental Ability', 'English'],
  'Olympiad': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  'JEE': ['Physics', 'Chemistry', 'Mathematics'],
  'NEET': ['Physics', 'Chemistry', 'Biology'],
  'CET': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  'Boards': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
};

// ============================================
// PROGRAM DETAILS
// ============================================

/**
 * Full details for each program (for UI display)
 */
export const PROGRAM_INFO: Record<Program, ProgramInfo> = {
  'Foundation': {
    name: 'Foundation',
    displayName: 'Foundation',
    description: 'School syllabus + basic competitive prep',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    icon: '📚',
    color: 'blue',
    isFreeAvailable: true,
  },
  'Scholarship': {
    name: 'Scholarship',
    displayName: 'Scholarship',
    description: 'NTSE, State Scholarship exams',
    subjects: ['Mathematics', 'Science', 'Mental Ability', 'English'],
    icon: '🏆',
    color: 'yellow',
    isFreeAvailable: false,
  },
  'Olympiad': {
    name: 'Olympiad',
    displayName: 'Olympiad',
    description: 'NSO, IMO, IEO, SOF Olympiads',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    icon: '🥇',
    color: 'orange',
    isFreeAvailable: false,
  },
  'JEE': {
    name: 'JEE',
    displayName: 'JEE',
    description: 'IIT-JEE Main + Advanced',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    icon: '🎯',
    color: 'purple',
    isFreeAvailable: true,
  },
  'NEET': {
    name: 'NEET',
    displayName: 'NEET',
    description: 'Medical entrance exam',
    subjects: ['Physics', 'Chemistry', 'Biology'],
    icon: '🩺',
    color: 'green',
    isFreeAvailable: true,
  },
  'CET': {
    name: 'CET',
    displayName: 'CET',
    description: 'State level engineering entrance',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    icon: '🏛️',
    color: 'indigo',
    isFreeAvailable: false,
  },
  'Boards': {
    name: 'Boards',
    displayName: 'Boards',
    description: 'Board exam preparation',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    icon: '📝',
    color: 'gray',
    isFreeAvailable: true,
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get available programs for a grade
 */
export const getProgramsForGrade = (grade: number): Program[] => {
  const programs = GRADE_PROGRAMS[grade];
  if (!programs) {
    logger.warn('Unknown grade, defaulting to Foundation', { grade });
    return ['Foundation'];
  }
  return programs;
};

/**
 * Get subjects for a program
 */
export const getSubjectsForProgram = (program: Program | string): string[] => {
  const subjects = PROGRAM_SUBJECTS[program as Program];
  if (!subjects) {
    logger.warn('Unknown program, defaulting to Foundation subjects', { program });
    return PROGRAM_SUBJECTS['Foundation'];
  }
  return subjects;
};

/**
 * Get program info for display
 */
export const getProgramInfo = (program: Program | string): ProgramInfo => {
  const info = PROGRAM_INFO[program as Program];
  if (!info) {
    logger.warn('Unknown program, defaulting to Foundation info', { program });
    return PROGRAM_INFO['Foundation'];
  }
  return info;
};

/**
 * Get default program for a grade
 * - Grades 6-10: Foundation
 * - Grades 11-12: JEE (most common)
 */
export const getDefaultProgram = (grade: number): Program => {
  if (grade >= 6 && grade <= 10) {
    return 'Foundation';
  }
  return 'JEE';
};

/**
 * Check if program is valid for grade
 */
export const isProgramValidForGrade = (program: string, grade: number): boolean => {
  const validPrograms = getProgramsForGrade(grade);
  return validPrograms.includes(program as Program);
};

/**
 * Check if grade is Foundation level (6-10)
 */
export const isFoundationLevel = (grade: number): boolean => {
  return grade >= 6 && grade <= 10;
};

/**
 * Check if grade is Higher Education level (11-12)
 */
export const isHigherEdLevel = (grade: number): boolean => {
  return grade === 11 || grade === 12;
};

// ============================================
// LEGACY COMPATIBILITY
// ============================================

/**
 * Convert old target_exam format to new program format
 * Old: 'Foundation-9', 'JEE Main', 'NEET'
 * New: 'Foundation', 'JEE', 'NEET'
 */
export const normalizeProgram = (targetExam: string | null | undefined): Program => {
  if (!targetExam) return 'Foundation';
  
  // Handle Foundation-X format
  if (targetExam.startsWith('Foundation')) {
    return 'Foundation';
  }
  
  // Handle JEE variants
  if (targetExam.includes('JEE')) {
    return 'JEE';
  }
  
  // Handle direct matches
  if (targetExam in PROGRAM_INFO) {
    return targetExam as Program;
  }
  
  // Default
  return 'Foundation';
};

/**
 * Map program to exam field for database queries
 * Used for filtering questions by exam field
 */
export const mapProgramToExamField = (program: Program, grade: number): string => {
  // For Foundation grades, use Foundation-X format for backward compatibility
  if (isFoundationLevel(grade) && program === 'Foundation') {
    return `Foundation-${grade}`;
  }
  
  // For other programs, use the program name directly
  return program;
};

// ============================================
// DATABASE QUERY HELPERS
// ============================================

/**
 * Build filter for chapters query
 */
export const getChapterFilters = (grade: number, program: Program) => {
  return {
    grade,
    program,
  };
};

/**
 * Build filter for questions query
 */
export const getQuestionFilters = (grade: number, program: Program, subject?: string) => {
  const filters: Record<string, any> = {
    grade,
    exam: mapProgramToExamField(program, grade),
  };
  
  if (subject) {
    filters.subject = subject;
  }
  
  return filters;
};
