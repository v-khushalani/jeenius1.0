import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useTestGenerator } from '@/hooks/useTestGenerator';
import { toast } from 'sonner';
import { Loader2, Brain, BookOpen, Target, Clock } from 'lucide-react';

interface TestGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTestGenerated: () => void;
}

const TestGeneratorModal: React.FC<TestGeneratorModalProps> = ({
  open,
  onOpenChange,
  onTestGenerated
}) => {
  const [formData, setFormData] = useState({
    testType: 'subject' as 'subject' | 'chapter' | 'mock' | 'practice',
    subject: '',
    chapter: '',
    difficulty: 'mixed' as 'easy' | 'medium' | 'hard' | 'mixed',
    questionCount: 25,
    duration: 60,
    title: '',
    description: ''
  });

  const [subjects, setSubjects] = useState<string[]>([]);
  const [chapters, setChapters] = useState<Array<{chapter: string, subject: string}>>([]);
  const [availableQuestions, setAvailableQuestions] = useState(0);

  const { generateTest, getAvailableSubjects, getAvailableChapters, getQuestionCount, loading } = useTestGenerator();

  useEffect(() => {
    if (open) {
      loadSubjects();
      loadChapters();
    }
  }, [open, loadSubjects, loadChapters]);

  useEffect(() => {
    updateQuestionCount();
  }, [updateQuestionCount]);

  const loadSubjects = useCallback(async () => {
    const subjectList = await getAvailableSubjects();
    setSubjects(subjectList as string[]);
  }, [getAvailableSubjects]);

  const loadChapters = useCallback(async () => {
    const chapterList = await getAvailableChapters();
    // Convert string[] to expected format
    const formattedChapters = (chapterList as unknown as string[]).map(chapter => ({ chapter, subject: '' }));
    setChapters(formattedChapters);
  }, [getAvailableChapters]);

  const updateQuestionCount = useCallback(async () => {
    const count = await getQuestionCount(
      formData.subject || undefined,
      formData.chapter || undefined
    );
    setAvailableQuestions(count);
  }, [formData.subject, formData.chapter, getQuestionCount]);

  const handleTestTypeChange = (value: string) => {
    const testType = value as typeof formData.testType;
    setFormData(prev => ({
      ...prev,
      testType,
      // Auto-set defaults based on test type
      questionCount: testType === 'mock' ? 90 : testType === 'subject' ? 25 : 15,
      duration: testType === 'mock' ? 180 : testType === 'subject' ? 60 : 30,
      title: testType === 'mock' ? 'JEE Main Mock Test' : 
             testType === 'subject' ? `${prev.subject || 'Subject'} Test` :
             testType === 'chapter' ? `${prev.chapter || 'Chapter'} Test` :
             'Practice Test'
    }));
  };

  const handleSubjectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      subject: value,
      chapter: '', // Reset chapter when subject changes
      title: prev.testType === 'subject' ? `${value} Test` : prev.title
    }));
  };

  const handleChapterChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      chapter: value,
      title: prev.testType === 'chapter' ? `${value} Test` : prev.title
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a test title');
      return;
    }

    if (formData.questionCount > availableQuestions) {
      toast.error(`Not enough questions available. Maximum: ${availableQuestions}`);
      return;
    }

    try {
      const result = await generateTest({
        testType: formData.testType,
        subject: formData.subject || undefined,
        chapter: formData.chapter || undefined,
        difficulty: formData.difficulty,
        questionCount: formData.questionCount,
        duration: formData.duration,
        title: formData.title,
        description: formData.description || undefined
      });

      toast.success('Test generated successfully!', {
        description: `Created "${formData.title}" with ${result.aiAnalysis?.selectedQuestions} questions`
      });

      onTestGenerated();
      onOpenChange(false);

      // Reset form
      setFormData({
        testType: 'subject',
        subject: '',
        chapter: '',
        difficulty: 'mixed',
        questionCount: 25,
        duration: 60,
        title: '',
        description: ''
      });
    } catch (error) {
      toast.error('Failed to generate test', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    }
  };

  const filteredChapters = chapters.filter(ch => 
    !formData.subject || ch.subject === formData.subject
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI Test Generator
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Test Type */}
          <div className="space-y-2">
            <Label>Test Type</Label>
            <Select value={formData.testType} onValueChange={handleTestTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mock">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Mock Test (Full JEE Pattern)
                  </div>
                </SelectItem>
                <SelectItem value="subject">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Subject Test
                  </div>
                </SelectItem>
                <SelectItem value="chapter">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Chapter Test
                  </div>
                </SelectItem>
                <SelectItem value="practice">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Practice Test
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject Selection */}
          {(formData.testType === 'subject' || formData.testType === 'chapter') && (
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={formData.subject} onValueChange={handleSubjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Chapter Selection */}
          {formData.testType === 'chapter' && formData.subject && (
            <div className="space-y-2">
              <Label>Chapter</Label>
              <Select value={formData.chapter} onValueChange={handleChapterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select chapter" />
                </SelectTrigger>
                <SelectContent>
                  {filteredChapters.map(ch => (
                    <SelectItem key={`${ch.subject}-${ch.chapter}`} value={ch.chapter}>
                      {ch.chapter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Difficulty */}
          <div className="space-y-2">
            <Label>Difficulty Level</Label>
            <Select value={formData.difficulty} onValueChange={(value: any) => setFormData(prev => ({ ...prev, difficulty: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed">Mixed (Recommended)</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Question Count and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Questions</Label>
              <Input
                type="number"
                min={5}
                max={availableQuestions}
                value={formData.questionCount}
                onChange={(e) => setFormData(prev => ({ ...prev, questionCount: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">
                Available: {availableQuestions} questions
              </p>
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min={10}
                max={300}
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Test Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter test title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the test"
              rows={3}
            />
          </div>

          {/* AI Features Badge */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Brain className="w-3 h-3" />
              AI-Balanced Questions
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              JEE Pattern Following
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Optimized Difficulty
            </Badge>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title.trim() || formData.questionCount > availableQuestions}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Generate Test
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TestGeneratorModal;