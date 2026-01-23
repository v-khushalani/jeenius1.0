import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar, Save } from 'lucide-react';
import { logger } from '@/utils/logger';

interface ExamConfig {
  id: string;
  exam_name: string;
  exam_date: string;
}

const ExamDateManager = () => {
  const [examDates, setExamDates] = useState<ExamConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExamDates();
  }, []);

  const loadExamDates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_config')
        .select('*')
        .order('exam_name');

      if (error) throw error;
      setExamDates(data || []);
    } catch (error) {
      logger.error('Error loading exam dates:', error);
      toast.error('Failed to load exam dates');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (examName: string, newDate: string) => {
    setExamDates(prev =>
      prev.map(exam =>
        exam.exam_name === examName
          ? { ...exam, exam_date: newDate }
          : exam
      )
    );
  };

  const saveExamDate = async (exam: ExamConfig) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('exam_config')
        .update({
          exam_date: exam.exam_date,
          updated_at: new Date().toISOString()
        })
        .eq('exam_name', exam.exam_name);

      if (error) throw error;
      toast.success(`${exam.exam_name} date updated successfully!`);
    } catch (error) {
      logger.error('Error saving exam date:', error);
      toast.error('Failed to update exam date');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading exam dates...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Exam Date Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-sm text-muted-foreground mb-4">
          Set the exam dates that will be used across the application. These dates will sync to all student study planners.
        </div>
        
        {examDates.map((exam) => (
          <div key={exam.id} className="space-y-2 p-4 border rounded-lg">
            <Label htmlFor={`date-${exam.exam_name}`} className="text-base font-semibold">
              {exam.exam_name} Exam Date
            </Label>
            <div className="flex gap-3">
              <Input
                id={`date-${exam.exam_name}`}
                type="date"
                value={exam.exam_date}
                onChange={(e) => handleDateChange(exam.exam_name, e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => saveExamDate(exam)}
                disabled={saving}
                className="bg-primary hover:bg-primary/90"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Current date: {new Date(exam.exam_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ExamDateManager;