/**
 * PROGRAM CONFIGURATION - SIMPLIFIED ARCHITECTURE
 * 
 * FLOW:
 * 1. Student selects Grade (6-12)
 * 2. For Grades 6-10: Direct school course (No exam selection needed)
 * 3. For Grades 11-12: Student selects exam (JEE or NEET)
 *    - JEE = PCM (Physics, Chemistry, Mathematics)
 *    - NEET = PCB (Physics, Chemistry, Biology)
 * 
 * Key Points:
 * - Grades 6-10 are separate (not merged)
 * - Grades 11 and 12 are kept separate (not merged)
 * - No "Class"/"School Course" terminology
 * - No Foundation/Scholarship/Olympiad concepts
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export type Exam = 'JEE' | 'NEET';
export type Grade = 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface ExamInfo {
  name: Exam;
  displayName: string;
  description: string;
  subjects: string[];
  icon: string;
  color: string;
  isFreeAvailable: boolean;
}

// ============================================
// GRADE → EXAMS MAPPING
// ============================================

/**
 * Which exams are available for each grade
 * Grades 6-10: Empty array (direct school course, no exam selection)
 * Grades 11-12: ['JEE', 'NEET']
 */
export const GRADE_EXAMS: Record<number, Exam[]> = {
  6: [],   // No exam selection for 6-10
  7: [],
  8: [],
  9: [],
  10: [],
  11: ['JEE', 'NEET'],  // Separate options for 11th
  12: ['JEE', 'NEET'],  // Separate options for 12th
};

// ============================================
// EXAM → SUBJECTS MAPPING
// ============================================

/**
 * Which subjects are included in each exam (11-12 only)
 */
export const EXAM_SUBJECTS: Record<Exam, string[]> = {
  'JEE': ['Physics', 'Chemistry', 'Mathematics'],  // PCM
  'NEET': ['Physics', 'Chemistry', 'Biology'],     // PCB
};

/**
 * Default subjects for grades 6-10
 */
export const GRADE_SUBJECTS: Record<number, string[]> = {
  6: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],    // PCMB
  7: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  8: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  9: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  10: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  11: [],  // Determined by exam choice (JEE/NEET)
  12: [],  // Determined by exam choice (JEE/NEET)
};

// ============================================
// EXAM DETAILS
// ============================================

/**
 * Full details for each exam (for UI display)
 */
export const EXAM_INFO: Record<Exam, ExamInfo> = {
  'JEE': {
    name: 'JEE',
    displayName: 'JEE',
    description: 'IIT-JEE Main + Advanced preparation',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    icon: '🎯',
    color: 'purple',
    isFreeAvailable: true,
  },
  'NEET': {
    name: 'NEET',
    displayName: 'NEET',
    description: 'Medical entrance exam preparation',
    subjects: ['Physics', 'Chemistry', 'Biology'],
    icon: '🩺',
    color: 'green',
    isFreeAvailable: true,
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get exams available for a grade
 * Grades 6-10: Return empty array (no exam selection)
 * Grades 11-12: Return ['JEE', 'NEET']
 */
export const getExamsForGrade = (grade: number): Exam[] => {
  return GRADE_EXAMS[grade] || [];
};

/**
 * Get subjects for a grade
 * For 6-10: Return PCMB subjects
 * For 11-12: Determine by exam type
 */
export const getSubjectsForGrade = (grade: number, exam?: Exam): string[] => {
  if (grade >= 11 && exam) {
    return EXAM_SUBJECTS[exam];
  }
  return GRADE_SUBJECTS[grade] || GRADE_SUBJECTS[6];
};

/**
 * Check if a grade needs exam selection
 * True for 11-12, false for 6-10
 */
export const needsExamSelection = (grade: number): boolean => {
  return grade >= 11;
};

/**
 * Get display name for a grade
 */
export const getGradeDisplayName = (grade: number): string => {
  if (grade === 11) return '11th Grade';
  if (grade === 12) return '12th Grade';
  return `Grade ${grade}`;
};

/**
 * Get display name for a course (grade + exam)
 */
export const getCourseDisplayName = (grade: number, exam?: Exam): string => {
  if (grade < 11) return `Grade ${grade}`;
  return exam ? `Grade ${grade} - ${exam}` : `Grade ${grade}`;
};

/**
 * Get exam info for display
 */
export const getExamInfo = (exam: Exam): ExamInfo => {
  return EXAM_INFO[exam];
};

/**
 * Check if grade is school level (6-10)
 * No exam selection needed
 */
export const isSchoolGrade = (grade: number): boolean => {
  return grade >= 6 && grade <= 10;
};

/**
 * Check if grade is higher education level (11-12)
 * Exam selection needed (JEE/NEET)
 */
export const isHigherEdGrade = (grade: number): boolean => {
  return grade === 11 || grade === 12;
};

/**
 * Map grade+exam to database exam field
 * Used for filtering questions by exam field in database
 */
export const mapGradeExamToDbField = (grade: number, exam?: Exam): string => {
  if (grade >= 11 && exam) {
    return exam;
  }
  // For grades 6-10, use legacy Foundation-X format for backward compatibility
  return `Foundation-${grade}`;
};

// ============================================
// LEGACY COMPATIBILITY LAYER (OLD PROGRAM SYSTEM)
// ============================================

/**
 * Legacy Program type for backward compatibility
 * Old: 'Class', 'JEE', 'NEET'
 */
export type Program = 'Class' | 'JEE' | 'NEET';

export interface ProgramInfo {
  name: Program;
  displayName: string;
  description: string;
  icon: string;
  color: string;
}

/**
 * Legacy mapping - kept for backward compatibility
 */
export const GRADE_PROGRAMS: Record<number, Program[]> = {
  6: ['Class'],
  7: ['Class'],
  8: ['Class'],
  9: ['Class'],
  10: ['Class'],
  11: ['JEE', 'NEET'],
  12: ['JEE', 'NEET'],
};

/**
 * Legacy program subjects - kept for backward compatibility
 */
export const PROGRAM_SUBJECTS: Record<Program, string[]> = {
  'Class': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  'JEE': ['Physics', 'Chemistry', 'Mathematics'],
  'NEET': ['Physics', 'Chemistry', 'Biology'],
};

/**
 * Legacy program info - kept for backward compatibility
 */
export const PROGRAM_INFO: Record<Program, ProgramInfo> = {
  'Class': {
    name: 'Class',
    displayName: 'School',
    description: 'School Board Curriculum',
    icon: '📚',
    color: 'blue',
  },
  'JEE': EXAM_INFO['JEE'] as any,
  'NEET': EXAM_INFO['NEET'] as any,
};

/**
 * Get available programs for a grade (legacy)
 */
export const getProgramsForGrade = (grade: number): Program[] => {
  return GRADE_PROGRAMS[grade] || ['Class'];
};

/**
 * Get info for a program (legacy)
 */
export const getProgramInfo = (program: Program | string): ProgramInfo => {
  const info = PROGRAM_INFO[program as Program];
  return info || PROGRAM_INFO['Class'];
};

/**
 * Normalize legacy program values
 */
export const normalizeProgram = (value: string | null | undefined): Program => {
  if (!value) return 'Class';
  if (value.startsWith('Foundation')) return 'Class';
  if (value === 'Scholarship' || value === 'Olympiad') return 'Class';
  if (value.includes('JEE')) return 'JEE';
  if (value.includes('NEET')) return 'NEET';
  if (value === 'Class') return 'Class';
  return 'Class';
};

/**
 * Map program to exam field for database (legacy)
 */
export const mapProgramToExamField = (program: Program | string, grade: number): string => {
  if (grade >= 11 && (program === 'JEE' || program === 'NEET')) {
    return program;
  }
  if (grade >= 6 && grade <= 10) {
    return `Foundation-${grade}`;
  }
  return program === 'Class' ? `Foundation-${grade}` : String(program);
};
