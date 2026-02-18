import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { useBatch } from '@/hooks/useBatch';
import { useChapters } from '@/hooks/useChapters';
import { useTopics } from '@/hooks/useTopics';
import { useQuestions } from '@/hooks/useQuestions';
import { Home, ChevronRight } from 'lucide-react';

interface Profile {
  grade: number;
  target_exam: string;
}

interface Chapter {
  id: string;
  chapter_number: number;
  chapter_name: string;
  description?: string;
}

interface Topic {
  id: string;
  topic_number?: number;
  topic_name: string;
}

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  difficulty?: string;
  explanation?: string | null;
}

const StudyHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Profile
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Selections
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Data hooks
  const { batch, isLoading: batchLoading } = useBatch(profile);
  const { chapters, isLoading: chaptersLoading } = useChapters(batch?.id || null, selectedSubject);
  const { topics, isLoading: topicsLoading } = useTopics(selectedChapter?.id || null);
  const { questions, isLoading: questionsLoading } = useQuestions(selectedTopic?.id || null);

  // Load profile
  useEffect(() => {
    if (!user?.id) return;

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('grade, target_exam')
          .eq('id', user.id)
          .single();

        if (error || !data?.grade || !data?.target_exam) {
          navigate('/goal-selection', { replace: true });
          return;
        }

        setProfile({
          grade: data.grade,
          target_exam: data.target_exam,
        });
      } catch (err) {
        logger.error('Error loading profile:', err);
        navigate('/goal-selection', { replace: true });
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [user?.id, navigate]);

  const handleSelectSubject = (subject: string) => {
    setSelectedSubject(subject);
    setSelectedChapter(null);
    setSelectedTopic(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    logger.log('📖 Subject selected:', subject);
  };

  const handleSelectChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setSelectedTopic(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    logger.log('📚 Chapter selected:', chapter.chapter_name);
  };

  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    logger.log('⚡ Topic selected:', topic.topic_name);
  };

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer || !user?.id || !questions[currentQuestionIndex]) return;

    const question = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correct_option;

    try {
      await supabase
        .from('question_attempts')
        .insert({
          user_id: user.id,
          question_id: question.id,
          is_correct: isCorrect,
          selected_option: selectedAnswer,
          attempted_at: new Date().toISOString(),
        });

      setShowResult(true);
      logger.log('✅ Answer recorded:', { correct: isCorrect });
    } catch (err) {
      logger.error('Error recording answer:', err);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading study profile...</p>
        </div>
      </div>
    );
  }

  if (!profile || !batch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <p className="text-gray-600 mb-4">Unable to load your profile</p>
              <Button onClick={() => navigate('/dashboard', { replace: true })}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">📚 Study Hub</h1>
            <p className="text-gray-600 mt-2">
              {batch.name} • Class {profile.grade}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Subjects */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">📖 Subjects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {batch.subjects.map(subject => (
                  <Button
                    key={subject}
                    onClick={() => handleSelectSubject(subject)}
                    variant={selectedSubject === subject ? 'default' : 'outline'}
                    className="w-full justify-start"
                  >
                    {subject}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Chapters */}
            {selectedSubject && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">📚 Chapters ({chapters.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                  {chaptersLoading ? (
                    <p className="text-sm text-gray-500">Loading...</p>
                  ) : chapters.length === 0 ? (
                    <p className="text-sm text-gray-500">No chapters</p>
                  ) : (
                    chapters.map(chapter => (
                      <Button
                        key={chapter.id}
                        onClick={() => handleSelectChapter(chapter)}
                        variant={selectedChapter?.id === chapter.id ? 'default' : 'outline'}
                        className="w-full justify-start text-xs"
                      >
                        Ch {chapter.chapter_number}: {chapter.chapter_name.substring(0, 20)}...
                      </Button>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            {/* Topics */}
            {selectedChapter && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">⚡ Topics ({topics.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                  {topicsLoading ? (
                    <p className="text-sm text-gray-500">Loading...</p>
                  ) : topics.length === 0 ? (
                    <p className="text-sm text-gray-500">No topics</p>
                  ) : (
                    topics.map(topic => (
                      <Button
                        key={topic.id}
                        onClick={() => handleSelectTopic(topic)}
                        variant={selectedTopic?.id === topic.id ? 'default' : 'outline'}
                        className="w-full justify-start text-xs"
                      >
                        {topic.topic_name.substring(0, 25)}...
                      </Button>
                    ))
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedTopic && currentQuestion ? (
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Q{currentQuestionIndex + 1}/{questions.length}</CardTitle>
                    {currentQuestion.difficulty && (
                      <Badge>{currentQuestion.difficulty}</Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Question */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-lg font-semibold text-gray-800">{currentQuestion.question}</p>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {['option_a', 'option_b', 'option_c', 'option_d'].map((opt, idx) => {
                      const key = opt as keyof typeof currentQuestion;
                      const label = String.fromCharCode(65 + idx);
                      const isSelected = selectedAnswer === label;
                      const isCorrect = label === currentQuestion.correct_option;
                      const showCorrect = showResult && isCorrect;
                      const showIncorrect = showResult && isSelected && !isCorrect;

                      return (
                        <Button
                          key={opt}
                          onClick={() => !showResult && setSelectedAnswer(label)}
                          disabled={showResult}
                          variant="outline"
                          className={`w-full justify-start text-left h-auto p-4 ${
                            showCorrect ? 'border-green-500 bg-green-50' : ''
                          } ${showIncorrect ? 'border-red-500 bg-red-50' : ''} ${
                            isSelected && !showResult ? 'border-blue-500 bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex gap-3 w-full">
                            <span className="font-bold min-w-8">{label})</span>
                            <span>{currentQuestion[key]}</span>
                            {showCorrect && <span className="ml-auto text-green-600">✓</span>}
                            {showIncorrect && <span className="ml-auto text-red-600">✗</span>}
                          </div>
                        </Button>
                      );
                    })}
                  </div>

                  {/* Result */}
                  {showResult && (
                    <Card className={currentQuestion.correct_option === selectedAnswer ? 'bg-green-50' : 'bg-red-50'}>
                      <CardContent className="p-4">
                        <p className="font-semibold mb-2">
                          {currentQuestion.correct_option === selectedAnswer ? '✓ Correct!' : '✗ Wrong'}
                        </p>
                        {currentQuestion.explanation && (
                          <p className="text-sm text-gray-700">{currentQuestion.explanation}</p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handlePrevQuestion}
                      disabled={currentQuestionIndex === 0}
                      variant="outline"
                      className="flex-1"
                    >
                      ← Prev
                    </Button>

                    {!showResult ? (
                      <Button
                        onClick={handleAnswerSubmit}
                        disabled={!selectedAnswer}
                        className="flex-1"
                      >
                        Submit
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNextQuestion}
                        disabled={currentQuestionIndex === questions.length - 1}
                        className="flex-1"
                      >
                        Next →
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-lg text-gray-500">👈 Select subject, chapter, and topic to start</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyHub;
