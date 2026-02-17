import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import { logger } from '@/utils/logger';

interface Batch {
  id: string;
  name: string;
  exam_type: string;
  grade: number;
}

interface Chapter {
  id: string;
  chapter_name: string;
  chapter_number: number;
  subject: string;
  description: string | null;
  is_free: boolean | null;
  batch_id: string | null;
}

interface Topic {
  id: string;
  chapter_id: string | null;
  topic_number: number | null;
  topic_name: string;
  description?: string | null;
}

interface Question {
  id: string;
  topic_id: string | null;
  chapter_id: string | null;
  subject: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string | null;
  difficulty: string | null;
}

const GRADES = [6, 7, 8, 9, 10, 11, 12];

const getSubjectsForGrade = (grade: number): string[] => {
  if (grade >= 11) return ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
  if (grade >= 6) return ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
  return [];
};

export const UnifiedContentManager = () => {
  // **State for hierarchy**
  const [selectedGrade, setSelectedGrade] = useState<number>(11);
  const [selectedSubject, setSelectedSubject] = useState<string>('Physics');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // **Data states**
  const [batches, setBatches] = useState<Batch[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  // **Dialog states**
  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // **Form data**
  const [chapterForm, setChapterForm] = useState({
    chapter_name: '',
    chapter_number: 1,
    description: '',
    is_free: true
  });

  const [topicForm, setTopicForm] = useState({
    topic_name: '',
    topic_number: 1,
    description: ''
  });

  const [questionForm, setQuestionForm] = useState({
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A' as 'A' | 'B' | 'C' | 'D',
    explanation: '',
    difficulty: 'medium'
  });

  // **Fetch batches on mount**
  useEffect(() => {
    fetchBatches();
  }, []);

  // **Fetch chapters when subject or grade changes**
  useEffect(() => {
    fetchChapters();
  }, [selectedGrade, selectedSubject]);

  // **Fetch topics when chapter changes**
  useEffect(() => {
    if (selectedChapter) {
      fetchTopics();
    } else {
      setTopics([]);
    }
  }, [selectedChapter]);

  // **Fetch questions when topic changes**
  useEffect(() => {
    if (selectedTopic) {
      fetchQuestions();
    } else {
      setQuestions([]);
    }
  }, [selectedTopic]);

  // **API Functions**
  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('id, name, exam_type, grade')
        .eq('is_active', true)
        .order('grade');
      
      if (error) throw error;
      setBatches(data || []);
    } catch (error: any) {
      logger.error('Error fetching batches:', error);
      toast.error('Failed to load batches');
    }
  };

  const fetchChapters = async () => {
    try {
      setLoading(true);
      
      // Find batch for selected grade
      const batch = batches.find(b => b.grade === selectedGrade);
      if (!batch) {
        setChapters([]);
        return;
      }

      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('batch_id', batch.id)
        .eq('subject', selectedSubject)
        .order('chapter_number');

      if (error) throw error;
      setChapters(data || []);
      setSelectedChapter(null);
    } catch (error: any) {
      logger.error('Error fetching chapters:', error);
      toast.error('Failed to load chapters');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('chapter_id', selectedChapter?.id)
        .order('topic_number');

      if (error) throw error;
      setTopics(data || []);
      setSelectedTopic(null);
    } catch (error: any) {
      logger.error('Error fetching topics:', error);
      toast.error('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('topic_id', selectedTopic?.id)
        .order('created_at');

      if (error) throw error;
      setQuestions(data || []);
    } catch (error: any) {
      logger.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  // **Add/Edit Chapter**
  const handleSaveChapter = async () => {
    if (!chapterForm.chapter_name.trim()) {
      toast.error('Chapter name is required');
      return;
    }

    const batch = batches.find(b => b.grade === selectedGrade);
    if (!batch) {
      toast.error('No batch found for this grade');
      return;
    }

    try {
      if (editingChapter) {
        await supabase
          .from('chapters')
          .update({
            chapter_name: chapterForm.chapter_name,
            chapter_number: chapterForm.chapter_number,
            description: chapterForm.description,
            is_free: chapterForm.is_free
          })
          .eq('id', editingChapter.id);
        toast.success('Chapter updated');
      } else {
        await supabase
          .from('chapters')
          .insert({
            chapter_name: chapterForm.chapter_name,
            chapter_number: chapterForm.chapter_number,
            subject: selectedSubject,
            description: chapterForm.description,
            is_free: chapterForm.is_free,
            batch_id: batch.id
          });
        toast.success('Chapter added');
      }

      setIsAddChapterOpen(false);
      setEditingChapter(null);
      setChapterForm({ chapter_name: '', chapter_number: 1, description: '', is_free: true });
      fetchChapters();
    } catch (error: any) {
      logger.error('Error saving chapter:', error);
      toast.error('Failed to save chapter');
    }
  };

  const handleDeleteChapter = async (id: string) => {
    if (!confirm('Delete this chapter? All topics and questions will be deleted.')) return;

    try {
      await supabase.from('chapters').delete().eq('id', id);
      toast.success('Chapter deleted');
      fetchChapters();
    } catch (error: any) {
      logger.error('Error deleting chapter:', error);
      toast.error('Failed to delete chapter');
    }
  };

  // **Add/Edit Topic**
  const handleSaveTopic = async () => {
    if (!topicForm.topic_name.trim()) {
      toast.error('Topic name is required');
      return;
    }

    if (!selectedChapter) {
      toast.error('Select a chapter first');
      return;
    }

    try {
      if (editingTopic) {
        await supabase
          .from('topics')
          .update({
            topic_name: topicForm.topic_name,
            topic_number: topicForm.topic_number,
            description: topicForm.description
          })
          .eq('id', editingTopic.id);
        toast.success('Topic updated');
      } else {
        await supabase
          .from('topics')
          .insert({
            chapter_id: selectedChapter.id,
            topic_name: topicForm.topic_name,
            topic_number: topicForm.topic_number,
            description: topicForm.description
          });
        toast.success('Topic added');
      }

      setIsAddTopicOpen(false);
      setEditingTopic(null);
      setTopicForm({ topic_name: '', topic_number: 1, description: '' });
      fetchTopics();
    } catch (error: any) {
      logger.error('Error saving topic:', error);
      toast.error('Failed to save topic');
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm('Delete this topic? All questions will be deleted.')) return;

    try {
      await supabase.from('topics').delete().eq('id', id);
      toast.success('Topic deleted');
      fetchTopics();
    } catch (error: any) {
      logger.error('Error deleting topic:', error);
      toast.error('Failed to delete topic');
    }
  };

  // **Add/Edit Question**
  const handleSaveQuestion = async () => {
    if (!questionForm.question.trim()) {
      toast.error('Question is required');
      return;
    }

    if (!selectedTopic) {
      toast.error('Select a topic first');
      return;
    }

    try {
      if (editingQuestion) {
        await supabase
          .from('questions')
          .update({
            question: questionForm.question,
            option_a: questionForm.option_a,
            option_b: questionForm.option_b,
            option_c: questionForm.option_c,
            option_d: questionForm.option_d,
            correct_option: questionForm.correct_option,
            explanation: questionForm.explanation,
            difficulty: questionForm.difficulty
          })
          .eq('id', editingQuestion.id);
        toast.success('Question updated');
      } else {
        await supabase
          .from('questions')
          .insert({
            subject: selectedSubject,
            chapter: selectedChapter?.chapter_name || '',
            question: questionForm.question,
            option_a: questionForm.option_a,
            option_b: questionForm.option_b,
            option_c: questionForm.option_c,
            option_d: questionForm.option_d,
            correct_option: questionForm.correct_option,
            explanation: questionForm.explanation,
            difficulty: questionForm.difficulty
          } as any);
        toast.success('Question added');
      }

      setIsAddQuestionOpen(false);
      setEditingQuestion(null);
      setQuestionForm({
        question: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'A',
        explanation: '',
        difficulty: 'medium'
      });
      fetchQuestions();
    } catch (error: any) {
      logger.error('Error saving question:', error);
      toast.error('Failed to save question');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Delete this question?')) return;

    try {
      await supabase.from('questions').delete().eq('id', id);
      toast.success('Question deleted');
      fetchQuestions();
    } catch (error: any) {
      logger.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">📚 Unified Content Manager</h1>
        <p className="text-muted-foreground mt-2">Grade → Subject → Chapter → Topic → Questions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* **Grade Selection Sidebar** */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Grades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {GRADES.map((grade) => (
                <Button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  variant={selectedGrade === grade ? 'default' : 'outline'}
                  className="w-full justify-start"
                >
                  Grade {grade}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* **Subject & Chapters Panel** */}
        <div className="lg:col-span-3 space-y-6">
          {/* Subject Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getSubjectsForGrade(selectedGrade).map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Chapters Section */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg">Chapters ({chapters.length})</CardTitle>
              <Dialog open={isAddChapterOpen} onOpenChange={setIsAddChapterOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setEditingChapter(null)}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingChapter ? 'Edit' : 'Add'} Chapter</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Chapter Name</Label>
                      <Input
                        value={chapterForm.chapter_name}
                        onChange={(e) => setChapterForm({ ...chapterForm, chapter_name: e.target.value })}
                        placeholder="e.g., Motion and Force"
                      />
                    </div>
                    <div>
                      <Label>Chapter Number</Label>
                      <Input
                        type="number"
                        value={chapterForm.chapter_number}
                        onChange={(e) => setChapterForm({ ...chapterForm, chapter_number: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={chapterForm.description}
                        onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                        placeholder="Optional description"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={chapterForm.is_free}
                        onChange={(e) => setChapterForm({ ...chapterForm, is_free: e.target.checked })}
                        id="is_free"
                      />
                      <Label htmlFor="is_free">Free Chapter</Label>
                    </div>
                    <Button onClick={handleSaveChapter} className="w-full">Save Chapter</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : chapters.length === 0 ? (
                <p className="text-muted-foreground text-sm">No chapters yet</p>
              ) : (
                chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    onClick={() => setSelectedChapter(chapter)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedChapter?.id === chapter.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge>Ch {chapter.chapter_number}</Badge>
                          <span className="font-semibold">{chapter.chapter_name}</span>
                        </div>
                        {chapter.is_free && <Badge className="bg-green-100 text-green-800 mt-1">Free</Badge>}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingChapter(chapter);
                            setChapterForm({
                              chapter_name: chapter.chapter_name,
                              chapter_number: chapter.chapter_number,
                              description: chapter.description || '',
                              is_free: chapter.is_free || true
                            });
                            setIsAddChapterOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChapter(chapter.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Topics Section */}
          {selectedChapter && (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-lg">Topics ({topics.length})</CardTitle>
                <Dialog open={isAddTopicOpen} onOpenChange={setIsAddTopicOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => setEditingTopic(null)}>
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingTopic ? 'Edit' : 'Add'} Topic</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Topic Name</Label>
                        <Input
                          value={topicForm.topic_name}
                          onChange={(e) => setTopicForm({ ...topicForm, topic_name: e.target.value })}
                          placeholder="e.g., Newton's Laws"
                        />
                      </div>
                      <div>
                        <Label>Topic Number</Label>
                        <Input
                          type="number"
                          value={topicForm.topic_number}
                          onChange={(e) => setTopicForm({ ...topicForm, topic_number: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={topicForm.description}
                          onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                          placeholder="Optional description"
                        />
                      </div>
                      <Button onClick={handleSaveTopic} className="w-full">Save Topic</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : topics.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No topics yet</p>
                ) : (
                  topics.map((topic) => (
                    <div
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedTopic?.id === topic.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">T {topic.topic_number}</Badge>
                            <span className="font-semibold">{topic.topic_name}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTopic(topic);
                              setTopicForm({
                                topic_name: topic.topic_name,
                                topic_number: topic.topic_number || 1,
                                description: topic.description || ''
                              });
                              setIsAddTopicOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTopic(topic.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Questions Section */}
          {selectedTopic && (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-lg">Questions ({questions.length})</CardTitle>
                <Dialog open={isAddQuestionOpen} onOpenChange={setIsAddQuestionOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => setEditingQuestion(null)}>
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingQuestion ? 'Edit' : 'Add'} Question</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Question</Label>
                        <Textarea
                          value={questionForm.question}
                          onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                          placeholder="Enter question"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                          <div key={opt}>
                            <Label>Option {opt}</Label>
                            <Input
                              value={questionForm[`option_${opt.toLowerCase()}` as keyof typeof questionForm] as string}
                              onChange={(e) => setQuestionForm({
                                ...questionForm,
                                [`option_${opt.toLowerCase()}`]: e.target.value
                              })}
                              placeholder={`Enter option ${opt}`}
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label>Correct Option</Label>
                        <Select value={questionForm.correct_option} onValueChange={(val) => setQuestionForm({ ...questionForm, correct_option: val as 'A' | 'B' | 'C' | 'D' })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['A', 'B', 'C', 'D'].map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Difficulty</Label>
                        <Select value={questionForm.difficulty} onValueChange={(val) => setQuestionForm({ ...questionForm, difficulty: val })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Explanation</Label>
                        <Textarea
                          value={questionForm.explanation}
                          onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                          placeholder="Optional explanation"
                          rows={2}
                        />
                      </div>
                      <Button onClick={handleSaveQuestion} className="w-full">Save Question</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : questions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No questions yet</p>
                ) : (
                  questions.map((question, idx) => (
                    <div
                      key={question.id}
                      className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{idx + 1}. {question.question.substring(0, 100)}...</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">Answer: {question.correct_option}</Badge>
                            {question.difficulty && <Badge variant="secondary" className="text-xs capitalize">{question.difficulty}</Badge>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingQuestion(question);
                              setQuestionForm({
                                question: question.question,
                                option_a: question.option_a,
                                option_b: question.option_b,
                                option_c: question.option_c,
                                option_d: question.option_d,
                                correct_option: question.correct_option as 'A' | 'B' | 'C' | 'D',
                                explanation: question.explanation || '',
                                difficulty: question.difficulty || 'medium'
                              });
                              setIsAddQuestionOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteQuestion(question.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedContentManager;
