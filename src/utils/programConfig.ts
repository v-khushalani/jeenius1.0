/**
 * PROGRAM CONFIGURATION - SIMPLIFIED ARCHITECTURE
 * 
 * FLOW:
 * 1. Student selects Grade (6-12)
 * 2. For Grades 6-10: ONE COURSE per grade (no program selection)
 * 3. For Grades 11-12: Student selects exam (JEE/NEET/CET/Boards)
 * 4. Content is filtered by: grade (6-10) OR grade + exam (11-12)
 * 
 * GRADE COURSES (6-10):
 * - Each grade is ONE course with PCMB subjects
 * - No Foundation/Scholarship/Olympiad distinction
 * 
 * EXAMS (11-12):
 * - JEE: IIT-JEE Main + Advanced (PCM)
 * - NEET: Medical entrance (PCB)
 * - CET: State level engineering (PCMB)
 * - Boards: Board exam prep only (PCMB)
 */

import { logger } from './logger';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type Program = 
  | 'Class' // Generic for grades 6-10
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
 * Grades 6-10: Just 'Class' (one course per grade)
 * Grades 11-12: Competitive exams
 */
export const GRADE_PROGRAMS: Record<number, Program[]> = {
  6: ['Class'],
  7: ['Class'],
  8: ['Class'],
  9: ['Class'],
  10: ['Class'],
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
  'Class': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
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
  'Class': {
    name: 'Class',
    displayName: 'School Course',
    description: 'Complete PCMB syllabus practice',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    icon: '📚',
    color: 'blue',
    isFreeAvailable: true,
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
    isFreeAvailable: true,
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
 * Grades 6-10: Just 'Class' (one course)
 * Grades 11-12: JEE/NEET/CET/Boards
 */
export const getProgramsForGrade = (grade: number): Program[] => {
  const programs = GRADE_PROGRAMS[grade];
  if (!programs) {
    logger.warn('Unknown grade, defaulting to Class', { grade });
    return ['Class'];
  }
  return programs;
};

/**
 * Get subjects for a program
 */
export const getSubjectsForProgram = (program: Program | string): string[] => {
  // Handle legacy Foundation-X format
  if (typeof program === 'string' && program.startsWith('Foundation')) {
    return PROGRAM_SUBJECTS['Class'];
  }
  const subjects = PROGRAM_SUBJECTS[program as Program];
  if (!subjects) {
    logger.warn('Unknown program, defaulting to Class subjects', { program });
    return PROGRAM_SUBJECTS['Class'];
  }
  return subjects;
};

/**
 * Get program info for display
 */
export const getProgramInfo = (program: Program | string): ProgramInfo => {
  // Handle legacy Foundation-X format
  if (typeof program === 'string' && program.startsWith('Foundation')) {
    return PROGRAM_INFO['Class'];
  }
  const info = PROGRAM_INFO[program as Program];
  if (!info) {
    logger.warn('Unknown program, defaulting to Class info', { program });
    return PROGRAM_INFO['Class'];
  }
  return info;
};

/**
 * Get default program for a grade
 * - Grades 6-10: Class
 * - Grades 11-12: JEE (most common)
 */
export const getDefaultProgram = (grade: number): Program => {
  if (grade >= 6 && grade <= 10) {
    return 'Class';
  }
  return 'JEE';
};

/**
 * Check if program is valid for grade
 */
export const isProgramValidForGrade = (program: string, grade: number): boolean => {
  const validPrograms = getProgramsForGrade(grade);
  // Handle legacy Foundation-X format
  if (program.startsWith('Foundation') && grade >= 6 && grade <= 10) {
    return true;
  }
  return validPrograms.includes(program as Program);
};

/**
 * Check if grade is School level (6-10)
 * No program selection needed - just ONE course per grade
 */
export const isSchoolGrade = (grade: number): boolean => {
  return grade >= 6 && grade <= 10;
};

/**
 * Check if grade is Higher Education level (11-12)
 * Program selection needed (JEE/NEET/CET/Boards)
 */
export const isHigherEdLevel = (grade: number): boolean => {
  return grade === 11 || grade === 12;
};

/**
 * Get display name for a grade/program combo
 */
export const getCourseDisplayName = (grade: number, program?: string): string => {
  if (isSchoolGrade(grade)) {
    return `Class ${grade}`;
  }
  return program || 'JEE';
};

// ============================================
// LEGACY COMPATIBILITY
// ============================================

/**
 * Convert old target_exam format to new program format
 * Old: 'Foundation-9', 'JEE Main', 'NEET', 'Scholarship', 'Olympiad'
 * New: 'Class' (for 6-10), 'JEE', 'NEET', etc.
 */
export const normalizeProgram = (targetExam: string | null | undefined): Program => {
  if (!targetExam) return 'Class';
  
  // Handle Foundation/Scholarship/Olympiad → Class (legacy)
  if (targetExam.startsWith('Foundation') || 
      targetExam === 'Scholarship' || 
      targetExam === 'Olympiad') {
    return 'Class';
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
  return 'Class';
};

/**
 * Map program to exam field for database queries
 * Used for filtering questions by exam field
 */
export const mapProgramToExamField = (program: Program | string, grade: number): string => {
  // For School grades (6-10), use Foundation-X for backward compatibility with DB
  if (isSchoolGrade(grade)) {
    return `Foundation-${grade}`;
  }
  
  // For 11-12, use the program name directly
  return program === 'Class' ? 'JEE' : program;
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
