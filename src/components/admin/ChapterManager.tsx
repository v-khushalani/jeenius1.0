import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GripVertical, Lock, Unlock, BookOpen, GraduationCap, Plus, Edit, Trash2 } from 'lucide-react';
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

const ChapterManager = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('Physics');
  const [filterExam, setFilterExam] = useState('JEE'); // Default to JEE instead of 'all'
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [formData, setFormData] = useState({
    chapter_name: '',
    chapter_number: 1,
    description: '',
    is_free: true
  });

  // Get valid subjects based on exam type
  const getSubjectsForExam = (exam: string): string[] => {
    if (exam === 'JEE') return ['Physics', 'Chemistry', 'Mathematics'];
    if (exam === 'NEET') return ['Physics', 'Chemistry', 'Biology'];
    // Foundation (6-10) has all 4 subjects
    return ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
  };

  const validSubjects = getSubjectsForExam(filterExam);

  // Reset subject if not valid for current exam
  useEffect(() => {
    if (!validSubjects.includes(selectedSubject)) {
      setSelectedSubject(validSubjects[0] || 'Physics');
    }
  }, [filterExam]);

  useEffect(() => {
    fetchBatches();
  }, []);;

  useEffect(() => {
    fetchChapters();
  }, [selectedSubject, filterExam, batches]);

  const fetchBatches = async () => {
    const { data } = await supabase
      .from('batches')
      .select('id, name, exam_type, grade')
      .order('grade');
    setBatches(data || []);
    logger.info('Fetched batches', { count: data?.length || 0 });
  };

  // Get batch_id for current filter - ALL chapters must be linked to a batch
  const getCurrentBatchId = (): string | 'NOT_FOUND' => {
    if (filterExam === 'JEE') {
      const batch = batches.find(b => b.exam_type.toLowerCase() === 'jee');
      return batch?.id || 'NOT_FOUND';
    }
    
    if (filterExam === 'NEET') {
      const batch = batches.find(b => b.exam_type.toLowerCase() === 'neet');
      return batch?.id || 'NOT_FOUND';
    }
    
    if (filterExam.startsWith('Foundation-')) {
      const grade = parseInt(filterExam.replace('Foundation-', ''));
      const batch = batches.find(b => b.exam_type.toLowerCase() === 'foundation' && b.grade === grade);
      return batch?.id || 'NOT_FOUND';
    }
    
    return 'NOT_FOUND';
  };

  // Get batch name for display
  const getBatchName = (batchId: string): string => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return 'Unknown';
    if (batch.exam_type.toLowerCase() === 'foundation') return `${batch.grade}th Foundation`;
    return batch.name || batch.exam_type;
  };

  const fetchChapters = async () => {
    const batchId = getCurrentBatchId();
    
    if (batchId === 'NOT_FOUND') {
      setChapters([]);
      return;
    }
    
    const { data } = await supabase
      .from('chapters')
      .select('*')
      .eq('subject', selectedSubject)
      .eq('batch_id', batchId)
      .order('chapter_number');

    setChapters(data || []);
  };

  const updateChapterSequence = async (chapterId: string, newNumber: number) => {
    await supabase
      .from('chapters')
      .update({ chapter_number: newNumber })
      .eq('id', chapterId);
    fetchChapters();
  };

  const toggleFreeStatus = async (chapterId: string, currentStatus: boolean | null) => {
    await supabase
      .from('chapters')
      .update({ is_free: !currentStatus })
      .eq('id', chapterId);
    fetchChapters();
  };

  const handleAddChapter = async () => {
    if (!formData.chapter_name.trim()) {
      toast.error('Please enter chapter name');
      return;
    }

    const batchId = getCurrentBatchId();
    
    if (batchId === 'NOT_FOUND') {
      toast.error('Please select a valid course first');
      return;
    }

    const { error } = await supabase
      .from('chapters')
      .insert([{
        chapter_name: formData.chapter_name,
        chapter_number: formData.chapter_number,
        description: formData.description || null,
        subject: selectedSubject,
        is_free: formData.is_free,
        batch_id: batchId
      }]);

    if (error) {
      toast.error('Failed to add chapter');
      logger.error('Failed to add chapter', error);
      return;
    }

    toast.success('Chapter added successfully');
    setIsAddDialogOpen(false);
    resetForm();
    fetchChapters();
  };

  const handleEditChapter = async () => {
    if (!editingChapter || !formData.chapter_name.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    const { error } = await supabase
      .from('chapters')
      .update({
        chapter_name: formData.chapter_name,
        chapter_number: formData.chapter_number,
        description: formData.description || null,
        is_free: formData.is_free
      })
      .eq('id', editingChapter.id);

    if (error) {
      toast.error('Failed to update chapter');
      logger.error('Failed to update chapter', error);
      return;
    }

    toast.success('Chapter updated successfully');
    setIsEditDialogOpen(false);
    setEditingChapter(null);
    resetForm();
    fetchChapters();
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return;

    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', chapterId);

    if (error) {
      toast.error('Failed to delete chapter');
      logger.error('Failed to delete chapter', error);
      return;
    }

    toast.success('Chapter deleted successfully');
    fetchChapters();
  };

  const openEditDialog = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setFormData({
      chapter_name: chapter.chapter_name,
      chapter_number: chapter.chapter_number,
      description: chapter.description || '',
      is_free: chapter.is_free ?? true
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      chapter_name: '',
      chapter_number: 1,
      description: '',
      is_free: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Course/Grade Selector Banner */}
      <Card className={`border-2 ${filterExam !== 'all' ? 'border-primary bg-primary/5' : 'border-dashed border-muted-foreground/30'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${filterExam !== 'all' ? 'bg-primary text-primary-foreground' : 'bg-amber-500 text-white'}`}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {filterExam !== 'all' ? `Viewing: ${filterExam} Chapters` : '⚠️ Select a Course First'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {filterExam !== 'all' 
                    ? `Chapters for ${filterExam} only`
                    : 'You must select a course (JEE/NEET/Class) to add or view chapters'
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterExam === 'JEE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterExam('JEE')}
              >
                JEE (PCM)
              </Button>
              <Button
                variant={filterExam === 'NEET' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterExam('NEET')}
              >
                NEET (PCB)
              </Button>
              {[6, 7, 8, 9, 10].map(grade => (
                <Button
                  key={grade}
                  variant={filterExam === `Foundation-${grade}` ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterExam(`Foundation-${grade}`)}
                >
                  Class {grade}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Chapter Management
              </CardTitle>
              <CardDescription>
                Organize chapters and manage their availability
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={resetForm} disabled={filterExam === 'all'}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Chapter
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Chapter</DialogTitle>
                  <DialogDescription>
                    Add a new chapter to {selectedSubject}
                  </DialogDescription>
                </DialogHeader>
                
                {/* Course/Grade Badge - Prominent */}
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-primary">Adding to: {filterExam}</p>
                    <p className="text-xs text-muted-foreground">
                      {filterExam === 'JEE' && 'PCM - Physics, Chemistry, Mathematics'}
                      {filterExam === 'NEET' && 'PCB - Physics, Chemistry, Biology'}
                      {filterExam.startsWith('Foundation-') && 'PCMB - All 4 subjects'}
                    </p>
                  </div>
                </div>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Chapter Number*</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.chapter_number}
                        onChange={(e) => setFormData({...formData, chapter_number: parseInt(e.target.value) || 1})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Access</Label>
                      <Select value={formData.is_free ? 'free' : 'premium'} onValueChange={(val) => setFormData({...formData, is_free: val === 'free'})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Chapter Name*</Label>
                    <Input
                      value={formData.chapter_name}
                      onChange={(e) => setFormData({...formData, chapter_name: e.target.value})}
                      placeholder="e.g., Mechanics"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Brief description of the chapter"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddChapter}>Add Chapter</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Subject Selector - filtered by exam type */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {validSubjects.map(subject => (
              <Button
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                variant={selectedSubject === subject ? 'default' : 'outline'}
                size="sm"
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
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{chapter.chapter_name}</p>
                    <Badge variant="outline" className="text-xs">
                      {chapter.batch_id ? getBatchName(chapter.batch_id) : 'JEE/NEET'}
                    </Badge>
                  </div>
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

                {/* Edit/Delete Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(chapter)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteChapter(chapter.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {chapters.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No chapters found for {selectedSubject} {filterExam !== 'all' ? `in ${filterExam}` : ''}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Chapter</DialogTitle>
            <DialogDescription>
              Update chapter details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Chapter Number*</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.chapter_number}
                  onChange={(e) => setFormData({...formData, chapter_number: parseInt(e.target.value) || 1})}
                />
              </div>
              <div className="space-y-2">
                <Label>Access</Label>
                <Select value={formData.is_free ? 'free' : 'premium'} onValueChange={(val) => setFormData({...formData, is_free: val === 'free'})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Chapter Name*</Label>
              <Input
                value={formData.chapter_name}
                onChange={(e) => setFormData({...formData, chapter_name: e.target.value})}
                placeholder="e.g., Mechanics"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of the chapter"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditChapter}>Update Chapter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChapterManager;