import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

export interface TestSeries {
  id: string;
  title: string;
  description: string;
  test_type: string;
  total_questions: number;
  duration_minutes: number;
  max_marks: number;
  scheduled_date: string;
  registration_deadline: string;
  is_active: boolean;
  created_at: string;
}

export interface TestAttempt {
  id: string;
  test_series_id: string;
  user_id: string;
  score: number;
  max_score: number;
  percentage: number;
  percentile: number | null;
  time_taken_minutes: number | null;
  started_at: string;
  submitted_at: string;
  all_india_rank: number | null;
  state_rank: number | null;
}

export interface TestRegistration {
  id: string;
  user_id: string;
  test_series_id: string;
  registered_at: string;
}

// Mock data
const mockTestSeries: TestSeries[] = [
  {
    id: '1',
    title: 'JEE Main Mock Test 1',
    description: 'Complete JEE Main practice test covering all subjects',
    test_type: 'mock',
    total_questions: 90,
    duration_minutes: 180,
    max_marks: 300,
    scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    registration_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Mathematics Chapter Test',
    description: 'Calculus and Algebra practice test',
    test_type: 'chapter',
    total_questions: 30,
    duration_minutes: 60,
    max_marks: 120,
    scheduled_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    registration_deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Physics Weekly Test',
    description: 'Mechanics and Thermodynamics',
    test_type: 'subject',
    total_questions: 25,
    duration_minutes: 45,
    max_marks: 100,
    scheduled_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    registration_deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: new Date().toISOString()
  }
];

export const useTestSeries = () => {
  const { user, isAuthenticated } = useAuth();
  const [tests, setTests] = useState<TestSeries[]>([]);
  const [userAttempts, setUserAttempts] = useState<TestAttempt[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<TestRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTests();
    if (isAuthenticated && user) {
      fetchUserAttempts();
      fetchUserRegistrations();
    }
  }, [isAuthenticated, user]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTests(mockTestSeries);
    } catch (err) {
      logger.error('Error fetching test series:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tests');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAttempts = async () => {
    if (!user) return;

    try {
      const attempts = JSON.parse(localStorage.getItem('testAttempts') || '[]');
      const userAttempts = attempts.filter((attempt: TestAttempt) => attempt.user_id === user.id);
      setUserAttempts(userAttempts);
    } catch (err) {
      logger.error('Error fetching user attempts:', err);
    }
  };

  const fetchUserRegistrations = async () => {
    if (!user) return;

    try {
      const registrations = JSON.parse(localStorage.getItem('testRegistrations') || '[]');
      const userRegs = registrations.filter((reg: TestRegistration) => reg.user_id === user.id);
      setUserRegistrations(userRegs);
    } catch (err) {
      logger.error('Error fetching user registrations:', err);
    }
  };

  const registerForTest = async (testId: string) => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated');
    }

    try {
      const registrations = JSON.parse(localStorage.getItem('testRegistrations') || '[]');
      
      // Check if already registered
      const existingReg = registrations.find((reg: TestRegistration) => 
        reg.user_id === user.id && reg.test_series_id === testId
      );
      
      if (existingReg) {
        throw new Error('Already registered for this test');
      }

      const newRegistration: TestRegistration = {
        id: Date.now().toString(),
        user_id: user.id,
        test_series_id: testId,
        registered_at: new Date().toISOString()
      };

      registrations.push(newRegistration);
      localStorage.setItem('testRegistrations', JSON.stringify(registrations));
      
      // Refresh registrations
      await fetchUserRegistrations();
    } catch (err) {
      logger.error('Error registering for test:', err);
      throw err;
    }
  };

  return {
    tests,
    userAttempts,
    userRegistrations,
    loading,
    error,
    registerForTest,
    refetch: () => {
      fetchTests();
      if (isAuthenticated && user) {
        fetchUserAttempts();
        fetchUserRegistrations();
      }
    }
  };
};