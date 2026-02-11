import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GripVertical, Lock, Unlock, BookOpen, GraduationCap, Filter } from 'lucide-react';

interface Batch {
  id: string;
  name: string;
  grade: number;
  exam_type: string;
}

interface Chapter {
  id: string;
  chapter_name: string;
  chapter_number: number;
  subject: string;
  is_free: boolean;
  batch_id: string | null;
  description?: string;
}

const ChapterManager = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('Physics');
  const [selectedBatchId, setSelectedBatchId] = useState<string | 'global'>('global');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    fetchChapters();
  }, [selectedSubject, selectedBatchId]);

  const fetchBatches = async () => {
    const { data } = await supabase
      .from('batches')
      .select('id, name, grade, exam_type')
      .order('grade', { ascending: true });
    setBatches(data || []);
    setLoading(false);
  };

  const fetchChapters = async () => {
    let query = supabase
      .from('chapters')
      .select('*')
      .eq('subject', selectedSubject)
      .order('chapter_number');
    
    if (selectedBatchId === 'global') {
      query = query.is('batch_id', null);
    } else {
      query = query.eq('batch_id', selectedBatchId);
    }
    
    const { data } = await query;
    setChapters(data || []);
  };

  const updateChapterSequence = async (chapterId: string, newNumber: number) => {
    await supabase
      .from('chapters')
      .update({ chapter_number: newNumber })
      .eq('id', chapterId);
    toast.success('Chapter order updated');
    fetchChapters();
  };

  const toggleFreeStatus = async (chapterId: string, currentStatus: boolean) => {
    await supabase
      .from('chapters')
      .update({ is_free: !currentStatus })
      .eq('id', chapterId);
    toast.success('Chapter status updated');
    fetchChapters();
  };

  const getGradeLabel = () => {
    if (selectedBatchId === 'global') return 'JEE/NEET/CET (Global)';
    const batch = batches.find(b => b.id === selectedBatchId);
    return batch ? `Grade ${batch.grade} - ${batch.exam_type}` : '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Chapter Management
          </CardTitle>
          <CardDescription>
            Organize chapters and manage their availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Grade/Batch Filter */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Select Grade/Course</span>
            </div>
            <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select grade or course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    JEE / NEET / CET (Global Chapters)
                  </div>
                </SelectItem>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                  FOUNDATION GRADES
                </div>
                {batches.filter(b => b.exam_type === 'Foundation').map(batch => (
                  <SelectItem key={batch.id} value={batch.id}>
                    Grade {batch.grade} - {batch.name}
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                  OTHER COURSES
                </div>
                {batches.filter(b => b.exam_type !== 'Foundation').map(batch => (
                  <SelectItem key={batch.id} value={batch.id}>
                    Grade {batch.grade} - {batch.name} ({batch.exam_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-2 text-xs text-muted-foreground">
              Currently viewing: <span className="font-medium text-foreground">{getGradeLabel()}</span>
            </div>
          </div>

          {/* Subject Selector */}
          <div className="flex gap-2 mb-6">
            {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map(subject => (
              <Button
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                variant={selectedSubject === subject ? 'default' : 'outline'}
                className={selectedSubject === subject ? 'bg-primary' : ''}
              >
                {subject}
              </Button>
            ))}
          </div>

          {/* Chapters List */}
          <div className="space-y-3">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="flex items-center gap-4 p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                {/* Drag Handle */}
                <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                
                {/* Chapter Number */}
                <Input
                  type="number"
                  value={chapter.chapter_number}
                  onChange={(e) => {
                    const newNumber = parseInt(e.target.value);
                    if (!isNaN(newNumber)) {
                      updateChapterSequence(chapter.id, newNumber);
                    }
                  }}
                  className="w-20"
                  min="1"
                />
                
                {/* Chapter Info */}
                <div className="flex-1">
                  <p className="font-medium">{chapter.chapter_name}</p>
                  {chapter.description && (
                    <p className="text-sm text-muted-foreground">{chapter.description}</p>
                  )}
                </div>
                
                {/* Free/Premium Badge */}
                <Badge
                  variant={chapter.is_free ? 'default' : 'secondary'}
                  className={`cursor-pointer ${
                    chapter.is_free
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                  onClick={() => toggleFreeStatus(chapter.id, chapter.is_free)}
                >
                  {chapter.is_free ? (
                    <div className="flex items-center gap-1">
                      <Unlock className="w-3 h-3" />
                      Free
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Premium
                    </div>
                  )}
                </Badge>
              </div>
            ))}
            
            {chapters.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No chapters found for {selectedSubject} in {getGradeLabel()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChapterManager;
