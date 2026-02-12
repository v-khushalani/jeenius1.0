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
import { GripVertical, Lock, Unlock, BookOpen, Plus, Edit, Trash2, Layers, GraduationCap } from 'lucide-react';
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
  subject: string;
  batch_id: string | null;
}

interface Topic {
  id: string;
  chapter_id: string;
  topic_name: string;
  topic_number: number | null;
  description: string | null;
  difficulty_level: string | null;
  estimated_time: number | null;
  is_free: boolean | null;
  order_index: number | null;
}

const TopicManager = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('Physics');
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [filterExam, setFilterExam] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  
  const [formData, setFormData] = useState({
    topic_name: '',
    description: '',
    difficulty_level: 'Medium',
    estimated_time: 60,
    topic_number: 1,
    is_free: true
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    fetchChapters();
  }, [selectedSubject, filterExam, batches]);

  useEffect(() => {
    if (selectedChapter) {
      fetchTopics();
    }
  }, [selectedChapter]);

  const fetchBatches = async () => {
    const { data } = await supabase
      .from('batches')
      .select('id, name, exam_type, grade')
      .order('grade');
    setBatches(data || []);
    logger.info('Fetched batches for topics', { count: data?.length || 0 });
  };

  // Get batch_id for current filter
  const getCurrentBatchId = (): string | null | 'NOT_FOUND' => {
    if (filterExam === 'all' || filterExam === 'JEE' || filterExam === 'NEET') return null;
    
    if (filterExam.startsWith('Foundation-')) {
      const grade = parseInt(filterExam.replace('Foundation-', ''));
      const batch = batches.find(b => b.exam_type === 'Foundation' && b.grade === grade);
      return batch?.id || 'NOT_FOUND';
    }
    
    return null;
  };

  const fetchChapters = async () => {
    let query = supabase
      .from('chapters')
      .select('*')
      .eq('subject', selectedSubject)
      .order('chapter_number');

    // Apply filter based on exam type
    if (filterExam !== 'all') {
      const batchId = getCurrentBatchId();
      if (filterExam === 'JEE' || filterExam === 'NEET') {
        query = query.is('batch_id', null);
      } else if (batchId && batchId !== 'NOT_FOUND') {
        query = query.eq('batch_id', batchId);
      } else if (batchId === 'NOT_FOUND') {
        setChapters([]);
        setSelectedChapter(null);
        setTopics([]);
        return;
      }
    }

    const { data } = await query;
    
    setChapters(data || []);
    if (data && data.length > 0) {
      setSelectedChapter(data[0].id);
    } else {
      setSelectedChapter(null);
      setTopics([]);
    }
  };

  const fetchTopics = async () => {
    if (!selectedChapter) return;
    
    const { data } = await supabase
      .from('topics')
      .select('*')
      .eq('chapter_id', selectedChapter)
      .order('topic_number');
    
    setTopics(data || []);
  };

  const handleAddTopic = async () => {
    if (!selectedChapter || !formData.topic_name.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    const { error } = await supabase
      .from('topics')
      .insert([{
        chapter_id: selectedChapter,
        topic_name: formData.topic_name,
        description: formData.description,
        difficulty_level: formData.difficulty_level,
        estimated_time: formData.estimated_time,
        topic_number: formData.topic_number,
        is_free: formData.is_free,
        order_index: formData.topic_number
      }]);

    if (error) {
      toast.error('Failed to add topic');
      logger.error('Failed to add topic', error);
      return;
    }

    toast.success('Topic added successfully');
    setIsAddDialogOpen(false);
    resetForm();
    fetchTopics();
  };

  const handleEditTopic = async () => {
    if (!editingTopic || !formData.topic_name.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    const { error } = await supabase
      .from('topics')
      .update({
        topic_name: formData.topic_name,
        description: formData.description,
        difficulty_level: formData.difficulty_level,
        estimated_time: formData.estimated_time,
        topic_number: formData.topic_number,
        is_free: formData.is_free,
        order_index: formData.topic_number
      })
      .eq('id', editingTopic.id);

    if (error) {
      toast.error('Failed to update topic');
      logger.error('Failed to update topic', error);
      return;
    }

    toast.success('Topic updated successfully');
    setIsEditDialogOpen(false);
    setEditingTopic(null);
    resetForm();
    fetchTopics();
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;

    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', topicId);

    if (error) {
      toast.error('Failed to delete topic');
      logger.error('Failed to delete topic', error);
      return;
    }

    toast.success('Topic deleted successfully');
    fetchTopics();
  };

  const toggleFreeStatus = async (topicId: string, currentStatus: boolean | null) => {
    const { error } = await supabase
      .from('topics')
      .update({ is_free: !currentStatus })
      .eq('id', topicId);

    if (error) {
      toast.error('Failed to update topic status');
      return;
    }

    toast.success('Topic status updated');
    fetchTopics();
  };

  const updateTopicNumber = async (topicId: string, newNumber: number) => {
    const { error } = await supabase
      .from('topics')
      .update({ topic_number: newNumber, order_index: newNumber })
      .eq('id', topicId);

    if (error) {
      toast.error('Failed to update topic number');
      return;
    }

    fetchTopics();
  };

  const openEditDialog = (topic: Topic) => {
    setEditingTopic(topic);
    setFormData({
      topic_name: topic.topic_name,
      description: topic.description || '',
      difficulty_level: topic.difficulty_level || 'Medium',
      estimated_time: topic.estimated_time || 60,
      topic_number: topic.topic_number || 1,
      is_free: topic.is_free ?? true
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      topic_name: '',
      description: '',
      difficulty_level: 'Medium',
      estimated_time: 60,
      topic_number: 1,
      is_free: true
    });
  };

  const selectedChapterData = chapters.find(c => c.id === selectedChapter);

  return (
    <div className="space-y-6">
      {/* Course/Grade Selector Banner */}
      <Card className={`border-2 ${filterExam !== 'all' ? 'border-primary bg-primary/5' : 'border-dashed border-muted-foreground/30'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${filterExam !== 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {filterExam !== 'all' ? `Viewing: ${filterExam} Topics` : 'All Courses / Grades'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {filterExam !== 'all' 
                    ? 'Topics are filtered for this course only'
                    : 'Select a specific course to avoid mixing topics from different grades'
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterExam === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterExam('all')}
              >
                All
              </Button>
              <Button
                variant={filterExam === 'JEE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterExam('JEE')}
              >
                JEE
              </Button>
              <Button
                variant={filterExam === 'NEET' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterExam('NEET')}
              >
                NEET
              </Button>
              {[6, 7, 8, 9, 10].map(grade => (
                <Button
                  key={grade}
                  variant={filterExam === `Foundation-${grade}` ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterExam(`Foundation-${grade}`)}
                >
                  {grade}th
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Topic Management
          </CardTitle>
          <CardDescription>
            Organize topics within chapters and manage their availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subject Selector */}
          <div>
            <Label className="mb-2 block">Select Subject</Label>
            <div className="flex gap-2 flex-wrap">
              {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map(subject => (
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
          </div>

          {/* Chapter Selector */}
          <div>
            <Label className="mb-2 block">Select Chapter</Label>
            <Select value={selectedChapter || ''} onValueChange={setSelectedChapter}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a chapter" />
              </SelectTrigger>
              <SelectContent>
                {chapters.map(chapter => (
                  <SelectItem key={chapter.id} value={chapter.id}>
                    {chapter.chapter_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add Topic Button */}
          {selectedChapter && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {topics.length} topics in {selectedChapterData?.chapter_name}
              </p>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Topic
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Topic</DialogTitle>
                    <DialogDescription>
                      Add a new topic to {selectedChapterData?.chapter_name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Topic Number*</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.topic_number}
                          onChange={(e) => setFormData({...formData, topic_number: parseInt(e.target.value) || 1})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Difficulty Level</Label>
                        <Select value={formData.difficulty_level} onValueChange={(val) => setFormData({...formData, difficulty_level: val})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Easy">Easy</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Topic Name*</Label>
                      <Input
                        value={formData.topic_name}
                        onChange={(e) => setFormData({...formData, topic_name: e.target.value})}
                        placeholder="e.g., Newton's Laws of Motion"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Brief description of the topic"
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Estimated Time (minutes)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.estimated_time}
                          onChange={(e) => setFormData({...formData, estimated_time: parseInt(e.target.value) || 60})}
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
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddTopic}>Add Topic</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Topics List */}
          {selectedChapter && (
            <div className="space-y-3">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center gap-4 p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  {/* Drag Handle */}
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                  
                  {/* Topic Number */}
                  <Input
                    type="number"
                    value={topic.topic_number || ''}
                    onChange={(e) => {
                      const newNumber = parseInt(e.target.value);
                      if (!isNaN(newNumber)) {
                        updateTopicNumber(topic.id, newNumber);
                      }
                    }}
                    className="w-20"
                    min="1"
                  />
                  
                  {/* Topic Info */}
                  <div className="flex-1">
                    <p className="font-medium">{topic.topic_name}</p>
                    {topic.description && (
                      <p className="text-sm text-muted-foreground">{topic.description}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      {topic.difficulty_level && (
                        <Badge variant="outline" className="text-xs">
                          {topic.difficulty_level}
                        </Badge>
                      )}
                      {topic.estimated_time && (
                        <Badge variant="outline" className="text-xs">
                          ~{topic.estimated_time} min
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Free/Premium Badge */}
                    <Badge
                      variant={topic.is_free ? 'default' : 'secondary'}
                      className={`cursor-pointer ${
                        topic.is_free
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-orange-600 hover:bg-orange-700'
                      }`}
                      onClick={() => toggleFreeStatus(topic.id, topic.is_free)}
                    >
                      {topic.is_free ? (
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

                    {/* Edit Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(topic)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    {/* Delete Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTopic(topic.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {topics.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No topics found for this chapter. Click "Add Topic" to create one.
                </div>
              )}
            </div>
          )}

          {!selectedChapter && chapters.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No chapters found for {selectedSubject}. Please add chapters first.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
            <DialogDescription>
              Update topic details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Topic Number*</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.topic_number}
                  onChange={(e) => setFormData({...formData, topic_number: parseInt(e.target.value) || 1})}
                />
              </div>
              <div className="space-y-2">
                <Label>Difficulty Level</Label>
                <Select value={formData.difficulty_level} onValueChange={(val) => setFormData({...formData, difficulty_level: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Topic Name*</Label>
              <Input
                value={formData.topic_name}
                onChange={(e) => setFormData({...formData, topic_name: e.target.value})}
                placeholder="e.g., Newton's Laws of Motion"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of the topic"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estimated Time (minutes)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.estimated_time}
                  onChange={(e) => setFormData({...formData, estimated_time: parseInt(e.target.value) || 60})}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditTopic}>Update Topic</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TopicManager;
