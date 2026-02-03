import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  Save,
  IndianRupee,
  Calendar,
  BookOpen,
  GraduationCap,
  Loader2,
  Tag,
  X
} from 'lucide-react';

interface BatchSubject {
  id: string;
  subject: string;
  display_order: number;
}

interface Batch {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  grade: number;
  exam_type: string;
  price: number;
  validity_days: number;
  is_active: boolean;
  color: string | null;
  icon: string | null;
  display_order: number | null;
  batch_subjects?: BatchSubject[];
}

const GRADE_OPTIONS = [6, 7, 8, 9, 10, 11, 12];
const EXAM_TYPES = ['Foundation', 'Scholarship', 'Homi Bhabha', 'JEE', 'NEET', 'Olympiad'];
const SUBJECT_OPTIONS = ['Math', 'Science', 'Physics', 'Chemistry', 'Biology', 'Mental Ability', 'English', 'Social Studies'];

export const BatchManager: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    grade: 6,
    exam_type: 'Foundation',
    price: 999,
    validity_days: 365,
    is_active: true,
    color: '#3B82F6',
    subjects: [] as string[]
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select(`
          *,
          batch_subjects (id, subject, display_order)
        `)
        .order('display_order', { ascending: true });

      if (error) throw error;
<<<<<<< HEAD
      setBatches((data || []) as any);
=======
      setBatches(data || []);
>>>>>>> d46a1cf3cf02ef41487dbbf3dbee73e47950c6de
    } catch (error: any) {
      toast.error('Failed to fetch batches: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string, grade: number) => {
    return `${grade}th-${name.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const handleCreate = () => {
    setEditingBatch(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      grade: 6,
      exam_type: 'Foundation',
      price: 999,
      validity_days: 365,
      is_active: true,
      color: '#3B82F6',
      subjects: []
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      slug: batch.slug,
      description: batch.description || '',
      grade: batch.grade,
      exam_type: batch.exam_type,
      price: batch.price,
      validity_days: batch.validity_days,
      is_active: batch.is_active,
      color: batch.color || '#3B82F6',
      subjects: batch.batch_subjects?.map(s => s.subject) || []
    });
    setIsDialogOpen(true);
  };

  const handleAddSubject = () => {
    if (newSubject && !formData.subjects.includes(newSubject)) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, newSubject]
      }));
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s !== subject)
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Name and slug are required');
      return;
    }

    setSaving(true);
    try {
      if (editingBatch) {
        // Update batch
        const { error: batchError } = await supabase
          .from('batches')
          .update({
            name: formData.name,
            slug: formData.slug,
            description: formData.description || null,
            grade: formData.grade,
            exam_type: formData.exam_type,
            price: formData.price,
            validity_days: formData.validity_days,
            is_active: formData.is_active,
            color: formData.color,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingBatch.id);
<<<<<<< HEAD
        
=======

>>>>>>> d46a1cf3cf02ef41487dbbf3dbee73e47950c6de
        if (batchError) throw batchError;

        // Update subjects - delete old and insert new
        await supabase
          .from('batch_subjects')
          .delete()
          .eq('batch_id', editingBatch.id);

        if (formData.subjects.length > 0) {
          const subjectsToInsert = formData.subjects.map((subject, index) => ({
            batch_id: editingBatch.id,
            subject,
            display_order: index + 1
          }));

          const { error: subjectsError } = await supabase
            .from('batch_subjects')
            .insert(subjectsToInsert);

          if (subjectsError) throw subjectsError;
        }

        toast.success('Batch updated successfully');
      } else {
        // Create new batch
        const { data: newBatch, error: batchError } = await supabase
          .from('batches')
          .insert({
            name: formData.name,
            slug: formData.slug,
            description: formData.description || null,
            grade: formData.grade,
            exam_type: formData.exam_type,
            price: formData.price,
            validity_days: formData.validity_days,
            is_active: formData.is_active,
            color: formData.color,
            display_order: batches.length + 1
          })
          .select()
          .single();

        if (batchError) throw batchError;

        // Insert subjects
        if (formData.subjects.length > 0 && newBatch) {
          const subjectsToInsert = formData.subjects.map((subject, index) => ({
            batch_id: newBatch.id,
            subject,
            display_order: index + 1
          }));

          const { error: subjectsError } = await supabase
            .from('batch_subjects')
            .insert(subjectsToInsert);

          if (subjectsError) throw subjectsError;
        }

        toast.success('Batch created successfully');
      }

      setIsDialogOpen(false);
      fetchBatches();
    } catch (error: any) {
      toast.error('Failed to save batch: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this batch? This cannot be undone.')) {
      return;
    }

    try {
      // Delete subjects first
      await supabase
        .from('batch_subjects')
        .delete()
        .eq('batch_id', batchId);

      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', batchId);

      if (error) throw error;

      toast.success('Batch deleted successfully');
      fetchBatches();
    } catch (error: any) {
      toast.error('Failed to delete batch: ' + error.message);
    }
  };

  const handleToggleActive = async (batch: Batch) => {
    try {
      const { error } = await supabase
        .from('batches')
        .update({ is_active: !batch.is_active })
        .eq('id', batch.id);

      if (error) throw error;

      setBatches(prev => 
        prev.map(b => b.id === batch.id ? { ...b, is_active: !b.is_active } : b)
      );
      toast.success(`Batch ${!batch.is_active ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error('Failed to update batch: ' + error.message);
    }
  };

  const handleQuickPriceUpdate = async (batchId: string, newPrice: number) => {
    try {
      const { error } = await supabase
        .from('batches')
        .update({ price: newPrice, updated_at: new Date().toISOString() })
        .eq('id', batchId);

      if (error) throw error;

      setBatches(prev => 
        prev.map(b => b.id === batchId ? { ...b, price: newPrice } : b)
      );
      toast.success('Price updated');
    } catch (error: any) {
      toast.error('Failed to update price: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Batch Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage course batches, pricing, and subjects
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Batch
        </Button>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {batches.map((batch) => (
          <Card 
            key={batch.id} 
            className={`relative overflow-hidden transition-all hover:shadow-md ${
              !batch.is_active ? 'opacity-60' : ''
            }`}
          >
            <div 
              className="absolute top-0 left-0 right-0 h-1"
              style={{ backgroundColor: batch.color || '#3B82F6' }}
            />
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${batch.color}20` }}
                  >
                    <GraduationCap className="w-5 h-5" style={{ color: batch.color || '#3B82F6' }} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{batch.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Grade {batch.grade} • {batch.exam_type}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={batch.is_active}
                  onCheckedChange={() => handleToggleActive(batch)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
<<<<<<< HEAD
              {batch.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {batch.description}
                </p>
              )}

=======
>>>>>>> d46a1cf3cf02ef41487dbbf3dbee73e47950c6de
              {/* Pricing */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Price</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={batch.price}
                    onChange={(e) => handleQuickPriceUpdate(batch.id, parseInt(e.target.value) || 0)}
                    className="w-24 h-8 text-right font-semibold"
                  />
                </div>
              </div>

              {/* Validity */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Validity</span>
                </div>
                <span className="font-medium">{batch.validity_days} days</span>
              </div>

              {/* Subjects */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  <span>Subjects</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {batch.batch_subjects?.map((subject) => (
                    <Badge key={subject.id} variant="secondary" className="text-xs">
                      {subject.subject}
                    </Badge>
                  ))}
                  {(!batch.batch_subjects || batch.batch_subjects.length === 0) && (
                    <span className="text-xs text-muted-foreground italic">No subjects assigned</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 gap-1.5"
                  onClick={() => handleEdit(batch)}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(batch.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {batches.length === 0 && (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Batches Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first batch to start organizing courses
          </p>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Batch
          </Button>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBatch ? 'Edit Batch' : 'Create New Batch'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Batch Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      name: e.target.value,
                      slug: generateSlug(e.target.value, prev.grade)
                    }));
                  }}
                  placeholder="e.g., Foundation 2025"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="e.g., 6th-foundation-2025"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select
                  value={formData.grade.toString()}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    grade: parseInt(value),
                    slug: generateSlug(prev.name, parseInt(value))
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_OPTIONS.map((grade) => (
                      <SelectItem key={grade} value={grade.toString()}>
                        {grade}th Grade
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exam_type">Exam Type</Label>
                <Select
                  value={formData.exam_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, exam_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this batch..."
                rows={2}
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validity">Validity (days)</Label>
                <Input
                  id="validity"
                  type="number"
                  value={formData.validity_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, validity_days: parseInt(e.target.value) || 365 }))}
                />
              </div>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="color">Theme Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="flex-1"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            {/* Subjects */}
            <div className="space-y-2">
              <Label>Subjects</Label>
              <div className="flex items-center gap-2">
                <Select value={newSubject} onValueChange={setNewSubject}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECT_OPTIONS.filter(s => !formData.subjects.includes(s)).map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={handleAddSubject} disabled={!newSubject}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.subjects.map((subject) => (
                  <Badge key={subject} variant="secondary" className="gap-1 pr-1">
                    {subject}
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(subject)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="is_active" className="cursor-pointer">Active Status</Label>
                <p className="text-xs text-muted-foreground">Batch is visible and available for purchase</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              {editingBatch ? 'Update Batch' : 'Create Batch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BatchManager;
