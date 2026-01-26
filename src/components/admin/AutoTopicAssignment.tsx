import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles, CheckCircle2, AlertTriangle, Brain } from "lucide-react";
import { usePDFExtraction } from "@/hooks/usePDFExtraction";
import { getAssignmentStats } from "@/services/topicAssignmentService";
import { toast } from "sonner";
import { logger } from "@/utils/logger";

interface AssignmentStats {
  total: number;
  autoAssigned: number;
  suggested: number;
  manual: number;
  avgConfidence: number;
}

export function AutoTopicAssignment() {
  const { fetchQueuedQuestions, autoAssignTopics } = usePDFExtraction();
  const [stats, setStats] = useState<AssignmentStats>({
    total: 0,
    autoAssigned: 0,
    suggested: 0,
    manual: 0,
    avgConfidence: 0
  });
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const data = await getAssignmentStats();
      setStats(data);
    } catch (error) {
      logger.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleBulkAutoAssign = async () => {
    try {
      setProcessing(true);
      
      // Fetch all pending questions
      const questions = await fetchQueuedQuestions("pending");
      
      if (!questions || questions.length === 0) {
        toast.info("No pending questions to process");
        return;
      }

      const questionIds = questions.map(q => q.id);
      
      // Run auto-assignment
      const result = await autoAssignTopics(questionIds);
      
      if (result) {
        // Reload stats
        await loadStats();
      }
    } catch (error) {
      logger.error("Error in bulk auto-assign:", error);
      toast.error("Failed to process questions");
    } finally {
      setProcessing(false);
    }
  };

  const autoAssignedPercentage = stats.total > 0 
    ? Math.round((stats.autoAssigned / stats.total) * 100) 
    : 0;

  const suggestedPercentage = stats.total > 0 
    ? Math.round((stats.suggested / stats.total) * 100) 
    : 0;

  const manualPercentage = stats.total > 0 
    ? Math.round((stats.manual / stats.total) * 100) 
    : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-2xl">NLP Auto-Assignment</CardTitle>
              <CardDescription>
                Automatically assign chapters and topics using Natural Language Processing
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Process all pending questions and automatically assign topics based on content analysis
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Uses TF-IDF and keyword matching for intelligent assignment
              </p>
            </div>
            <Button
              onClick={handleBulkAutoAssign}
              disabled={processing || stats.total === 0}
              size="lg"
              className="gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Auto-Assign All
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Statistics</CardTitle>
          <CardDescription>Overview of automatic topic assignment performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Questions */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Questions</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <p className="text-sm text-muted-foreground">Auto-Assigned</p>
              </div>
              <p className="text-3xl font-bold text-green-500">{stats.autoAssigned}</p>
              <Badge variant="outline" className="text-xs">
                {autoAssignedPercentage}% (≥75% confidence)
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <p className="text-sm text-muted-foreground">Suggested</p>
              </div>
              <p className="text-3xl font-bold text-yellow-500">{stats.suggested}</p>
              <Badge variant="outline" className="text-xs">
                {suggestedPercentage}% (50-75% confidence)
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-muted-foreground">Manual Review</p>
              </div>
              <p className="text-3xl font-bold text-gray-500">{stats.manual}</p>
              <Badge variant="outline" className="text-xs">
                {manualPercentage}% (&lt;50% confidence)
              </Badge>
            </div>
          </div>

          {/* Average Confidence */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Average Confidence Score</p>
              <p className="text-sm font-bold">{stats.avgConfidence.toFixed(1)}%</p>
            </div>
            <Progress value={stats.avgConfidence} className="h-2" />
          </div>

          {/* Distribution Breakdown */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Assignment Distribution</p>
            <div className="flex h-4 w-full overflow-hidden rounded-full">
              {stats.autoAssigned > 0 && (
                <div
                  className="bg-green-500"
                  style={{ width: `${autoAssignedPercentage}%` }}
                  title={`Auto-assigned: ${autoAssignedPercentage}%`}
                />
              )}
              {stats.suggested > 0 && (
                <div
                  className="bg-yellow-500"
                  style={{ width: `${suggestedPercentage}%` }}
                  title={`Suggested: ${suggestedPercentage}%`}
                />
              )}
              {stats.manual > 0 && (
                <div
                  className="bg-gray-400"
                  style={{ width: `${manualPercentage}%` }}
                  title={`Manual: ${manualPercentage}%`}
                />
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Auto (≥75%)</span>
              <span>Suggested (50-75%)</span>
              <span>Manual (&lt;50%)</span>
            </div>
          </div>

          {/* How It Works */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">How NLP Auto-Assignment Works:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Keyword Extraction:</strong> Extracts meaningful keywords from question text</li>
              <li><strong>TF-IDF Analysis:</strong> Calculates term importance and document similarity</li>
              <li><strong>Cosine Similarity:</strong> Measures semantic similarity with topic keywords</li>
              <li><strong>Confidence Scoring:</strong> Assigns confidence based on match quality</li>
              <li><strong>Smart Thresholds:</strong> Auto-approves high confidence (≥75%), suggests medium (50-75%), requires manual review for low (&lt;50%)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">
                Intelligent Assignment with Quality Control
              </p>
              <p className="text-xs text-blue-700">
                The system uses advanced NLP techniques to analyze question content and match it with relevant topics. 
                High-confidence matches (&gt;75%) are automatically assigned, while lower confidence matches are flagged 
                for manual review to ensure accuracy. You can always override auto-assignments in the review queue.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
