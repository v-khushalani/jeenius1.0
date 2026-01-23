import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface TestGenerationParams {
  testType: 'subject' | 'chapter' | 'mock' | 'practice';
  subject?: string;
  chapter?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  questionCount: number;
  duration: number;
  title: string;
  description?: string;
}

interface TestGenerationResult {
  success: boolean;
  testSeries?: any;
  aiAnalysis?: {
    reasoning: string;
    difficultyDistribution: Record<string, number>;
    topicDistribution: Record<string, number>;
    selectedQuestions: number;
  };
  error?: string;
}

// Mock subjects and chapters data
const mockSubjects = ['Mathematics', 'Physics', 'Chemistry'];
const mockChapters = {
  'Mathematics': ['Calculus', 'Algebra', 'Trigonometry', 'Geometry', 'Statistics'],
  'Physics': ['Mechanics', 'Thermodynamics', 'Electricity', 'Optics', 'Modern Physics'],
  'Chemistry': ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Electrochemistry']
};

export const useTestGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const generateTest = async (params: TestGenerationParams): Promise<TestGenerationResult> => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to generate tests');
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate test generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockTestSeries = {
        id: Date.now().toString(),
        title: params.title,
        description: params.description || '',
        test_type: params.testType,
        total_questions: params.questionCount,
        duration_minutes: params.duration,
        max_marks: params.questionCount * 4, // 4 marks per question
        scheduled_date: new Date().toISOString(),
        registration_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_at: new Date().toISOString()
      };

      // Save to localStorage
      const existingTests = JSON.parse(localStorage.getItem('generatedTests') || '[]');
      existingTests.push(mockTestSeries);
      localStorage.setItem('generatedTests', JSON.stringify(existingTests));

      const difficultyDistribution = {
        easy: params.difficulty === 'easy' ? 100 : params.difficulty === 'mixed' ? 40 : 20,
        medium: params.difficulty === 'medium' ? 100 : params.difficulty === 'mixed' ? 40 : 50,
        hard: params.difficulty === 'hard' ? 100 : params.difficulty === 'mixed' ? 20 : 30
      };

      const topicDistribution: Record<string, number> = {};
      if (params.subject && mockChapters[params.subject as keyof typeof mockChapters]) {
        const chapters = mockChapters[params.subject as keyof typeof mockChapters];
        const questionsPerChapter = Math.floor(params.questionCount / chapters.length);
        chapters.forEach(chapter => {
          topicDistribution[chapter] = questionsPerChapter;
        });
      }

      return {
        success: true,
        testSeries: mockTestSeries,
        aiAnalysis: {
          reasoning: `Generated a ${params.testType} test with ${params.questionCount} questions focusing on ${params.subject || 'multiple subjects'}. The test is designed to assess understanding at ${params.difficulty || 'mixed'} difficulty level.`,
          difficultyDistribution,
          topicDistribution,
          selectedQuestions: params.questionCount
        }
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate test';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableSubjects = async () => {
    return mockSubjects;
  };

  const getAvailableChapters = async (subject?: string) => {
    if (!subject || !mockChapters[subject as keyof typeof mockChapters]) {
      return [];
    }

    return mockChapters[subject as keyof typeof mockChapters].map(chapter => ({
      chapter,
      subject
    }));
  };

  const getQuestionCount = async (subject?: string, chapter?: string) => {
    // Return mock question counts
    if (chapter) return 50;
    if (subject) return 200;
    return 500;
  };

  return {
    generateTest,
    getAvailableSubjects,
    getAvailableChapters,
    getQuestionCount,
    loading,
    error
  };
};