import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import {
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingUp,
  Brain,
  BookOpen,
  ArrowLeft,
  Eye,
  FileText,
  MessageCircle,
  RefreshCw,
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation?: string;
  topic?: string;
  chapter?: string;
  difficulty?: string;
}

interface TestResult {
  testTitle: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  percentage: string;
  timeSpent: number;
  completedAt?: string;
  questions?: Question[];
  results: Array<{
    questionId: string;
    selectedOption: string;
    correctOption: string;
    isCorrect: boolean;
    timeSpent: number;
    isMarkedForReview: boolean;
  }>;
}

const TestResultsPage = () => {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedResults = localStorage.getItem("testResults");
    if (savedResults) {
      setTestResult(JSON.parse(savedResults));
    } else {
      navigate("/tests");
    }
  }, [navigate]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90)
      return {
        label: "Excellent",
        color: "text-green-600",
        bg: "bg-green-100",
      };
    if (percentage >= 75)
      return { label: "Good", color: "text-blue-600", bg: "bg-blue-100" };
    if (percentage >= 60)
      return {
        label: "Average",
        color: "text-yellow-600",
        bg: "bg-yellow-100",
      };
    if (percentage >= 40)
      return {
        label: "Below Average",
        color: "text-orange-600",
        bg: "bg-orange-100",
      };
    return {
      label: "Needs Improvement",
      color: "text-red-600",
      bg: "bg-red-100",
    };
  };

  const calculateStats = () => {
    if (!testResult) return null;

    const correctAnswers = testResult.correctAnswers;
    const incorrectAnswers = testResult.results.filter(
      (r) => !r.isCorrect && r.selectedOption
    ).length;
    const skippedQuestions = testResult.results.filter((r) => !r.selectedOption).length;

    const earnedMarks = correctAnswers * 4 + incorrectAnswers * (-1);
    const totalMarks = testResult.totalQuestions * 4;

    const accuracy =
      testResult.answeredQuestions > 0
        ? (
            (testResult.correctAnswers / testResult.answeredQuestions) *
            100
          ).toFixed(1)
        : "0";

    const attemptRate = (
      (testResult.answeredQuestions / testResult.totalQuestions) *
      100
    ).toFixed(1);
    
    const avgTimePerQuestion =
      testResult.answeredQuestions > 0
        ? Math.round(testResult.timeSpent / testResult.answeredQuestions)
        : 0;

    const scorePercentage = totalMarks > 0 ? ((earnedMarks / totalMarks) * 100).toFixed(1) : "0";

    return { 
      accuracy, 
      attemptRate, 
      avgTimePerQuestion, 
      earnedMarks, 
      totalMarks, 
      scorePercentage,
      correctAnswers,
      incorrectAnswers,
      skippedQuestions
    };
  };

  const getTestDate = () => {
    if (testResult?.completedAt) {
      const date = new Date(testResult.completedAt);
      return date.toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return new Date().toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const handleWhatsAppShare = () => {
    if (!testResult) return;
    const stats = calculateStats();
    const performance = getPerformanceLevel(parseFloat(stats?.scorePercentage || "0"));
    const testDate = getTestDate();
    
    // WhatsApp supports *bold* formatting
    const message = `*TEST RESULT* (${testDate})

*${testResult.testTitle}*

-----------------------------
*Score:* ${stats?.earnedMarks}/${stats?.totalMarks} *(${stats?.scorePercentage}%)*
*Correct:* ${stats?.correctAnswers}
*Wrong:* ${stats?.incorrectAnswers}
*Time:* ${formatTime(testResult.timeSpent)}
*Accuracy:* ${stats?.accuracy}%
-----------------------------

*Percentile:* -

*${performance.label} Performance!*

_Powered by JEEnius_`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const generateQuestionPaperPDF = () => {
    if (!testResult) {
      toast.error('No test result available');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = 20;

    // Helper to add new page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (yPos + requiredSpace > 270) {
        addFooter();
        doc.addPage();
        yPos = 25;
        addHeader();
      }
    };

    // Helper to clean text (remove HTML/LaTeX for PDF)
    const cleanText = (text: string): string => {
      if (!text) return '';
      return text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\\[a-zA-Z]+\{[^}]*\}/g, '[Math]') // Replace LaTeX
        .replace(/\$[^$]+\$/g, '[Math]') // Replace inline math
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
    };

    // Add header with JEEnius branding
    const addHeader = () => {
      doc.setFillColor(79, 70, 229); // Primary purple
      doc.rect(0, 0, pageWidth, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('JEEnius', margin, 12);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Your AI-Powered JEE/NEET Prep Partner', pageWidth - margin, 12, { align: 'right' });
      doc.setTextColor(0, 0, 0);
    };

    // Add footer
    const addFooter = () => {
      const pageNum = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text('Powered by JEEnius', pageWidth - margin, pageHeight - 10, { align: 'right' });
      doc.setTextColor(0, 0, 0);
    };

    // Add initial header
    addHeader();
    yPos = 30;

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text(testResult.testTitle, pageWidth / 2, yPos, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    // Subtitle with date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${getTestDate()} | Total Questions: ${testResult.totalQuestions} | Total Marks: ${testResult.totalQuestions * 4}`, pageWidth / 2, yPos, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos += 10;

    // Instructions box
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 12, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Instructions: +4 for correct answer | -1 for incorrect | 0 for unattempted', pageWidth / 2, yPos + 7, { align: 'center' });
    yPos += 18;

    // Check if questions are available
    if (!testResult.questions || testResult.questions.length === 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Question details are not available for this test.', pageWidth / 2, yPos + 20, { align: 'center' });
      doc.text('This may happen for tests taken before the update.', pageWidth / 2, yPos + 30, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Test Summary: ${testResult.correctAnswers}/${testResult.totalQuestions} correct`, pageWidth / 2, yPos + 45, { align: 'center' });
      addFooter();
      const fileName = `${testResult.testTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Summary.pdf`;
      doc.save(fileName);
      toast.success('Summary PDF downloaded!');
      return;
    }

    // Questions
    testResult.questions.forEach((q, index) => {
      checkPageBreak(55);

      // Question number box
      doc.setFillColor(79, 70, 229);
      doc.circle(margin + 4, yPos + 2, 4, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}`, margin + 4, yPos + 4, { align: 'center' });
      doc.setTextColor(0, 0, 0);

      // Question text
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const questionText = cleanText(q.question);
      const splitQuestion = doc.splitTextToSize(questionText, pageWidth - 2 * margin - 15);
      doc.text(splitQuestion, margin + 12, yPos + 3);
      yPos += splitQuestion.length * 5 + 5;

      // Options
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const options = [
        { label: 'A', text: cleanText(q.option_a) },
        { label: 'B', text: cleanText(q.option_b) },
        { label: 'C', text: cleanText(q.option_c) },
        { label: 'D', text: cleanText(q.option_d) },
      ];

      options.forEach(opt => {
        checkPageBreak(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`(${opt.label})`, margin + 5, yPos);
        doc.setFont('helvetica', 'normal');
        const splitOpt = doc.splitTextToSize(opt.text, pageWidth - 2 * margin - 20);
        doc.text(splitOpt, margin + 15, yPos);
        yPos += splitOpt.length * 4 + 3;
      });

      yPos += 6;

      // Divider line between questions
      if (index < testResult.questions.length - 1) {
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, yPos - 3, pageWidth - margin, yPos - 3);
      }
    });

    // Add footer to last page
    addFooter();

    // Save PDF
    const fileName = `${testResult.testTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Question_Paper.pdf`;
    doc.save(fileName);
    toast.success('Question paper downloaded!');
  };

  if (!testResult) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-32 pb-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = calculateStats();
  const performance = getPerformanceLevel(parseFloat(stats?.scorePercentage || "0"));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      <div className="pt-20 sm:pt-24 pb-4 sm:pb-8">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8">
          {/* Header */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <Button
              variant="outline"
              onClick={() => navigate("/tests")}
              size="sm"
              className="mb-3 sm:mb-4 hover:bg-primary hover:text-white transition-all text-xs sm:text-sm"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Back
            </Button>

            <div className="text-center">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-blue-600 to-indigo-700 bg-clip-text text-transparent mb-1 sm:mb-2">
                Test Results 📊
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">{testResult.testTitle}</p>
            </div>
          </div>

          {/* Results Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
            {/* Score Card - Main Focus */}
            <Card className="bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-white sm:col-span-2 lg:col-span-2 border-0 shadow-xl">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <Trophy className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 opacity-90" />
                  <div className="text-right">
                    <div className="text-xs sm:text-sm opacity-75">Marking: +4 | -1</div>
                  </div>
                </div>
                <div className="text-center mb-3 sm:mb-4">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">
                    {stats?.earnedMarks} / {stats?.totalMarks}
                  </div>
                  <div className="text-base sm:text-lg opacity-90">
                    Score: {stats?.scorePercentage}%
                  </div>
                  <div className="text-xs sm:text-sm opacity-75 mt-1">
                    Accuracy: {testResult.percentage}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-white/20">
                    {performance.label}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Correct Answers */}
            <Card className="border-2 border-green-200 bg-green-50/50 hover:shadow-lg transition-all">
              <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 mx-auto mb-2 sm:mb-3 text-green-600" />
                <div className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1 text-green-700">
                  {stats?.correctAnswers}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">
                  Correct
                </div>
                <div className="text-xs text-green-700 font-medium">
                  +{(stats?.correctAnswers || 0) * 4} marks
                </div>
              </CardContent>
            </Card>

            {/* Incorrect Answers */}
            <Card className="border-2 border-red-200 bg-red-50/50 hover:shadow-lg transition-all">
              <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                <XCircle className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 mx-auto mb-2 sm:mb-3 text-red-600" />
                <div className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1 text-red-700">
                  {stats?.incorrectAnswers}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">
                  Incorrect
                </div>
                <div className="text-xs text-red-700 font-medium">
                  {(stats?.incorrectAnswers || 0) * -1} marks
                </div>
              </CardContent>
            </Card>

            {/* Time Taken */}
            <Card className="border-2 border-blue-200 bg-blue-50/50 hover:shadow-lg transition-all">
              <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 mx-auto mb-2 sm:mb-3 text-blue-600" />
                <div className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1 text-blue-700">
                  {formatTime(testResult.timeSpent)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">
                  Time Taken
                </div>
                <div className="text-xs text-muted-foreground">
                  {stats?.avgTimePerQuestion}s/Q
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {/* Performance Analysis */}
            <div className="lg:col-span-2 space-y-6">
              {/* Performance Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Performance Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Score Performance */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Score Performance</span>
                      <span className="text-sm font-bold text-primary">
                        {stats?.scorePercentage}%
                      </span>
                    </div>
                    <Progress
                      value={Math.max(0, parseFloat(stats?.scorePercentage || "0"))}
                      className="h-3"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats?.earnedMarks} marks earned out of {stats?.totalMarks} total marks
                    </p>
                  </div>

                  {/* Accuracy */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Accuracy Rate</span>
                      <span className="text-sm font-bold text-green-600">
                        {stats?.accuracy}%
                      </span>
                    </div>
                    <Progress
                      value={parseFloat(stats?.accuracy || "0")}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {testResult.correctAnswers} correct out of{" "}
                      {testResult.answeredQuestions} attempted
                    </p>
                  </div>

                  {/* Attempt Rate */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Attempt Rate</span>
                      <span className="text-sm font-bold text-blue-600">
                        {stats?.attemptRate}%
                      </span>
                    </div>
                    <Progress
                      value={parseFloat(stats?.attemptRate || "0")}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {testResult.answeredQuestions} attempted out of{" "}
                      {testResult.totalQuestions} total
                    </p>
                  </div>

                  {/* Speed Analysis */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">
                        Speed Analysis
                      </span>
                      <span className="text-sm font-bold text-purple-600">
                        {stats?.avgTimePerQuestion}s/question
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            ((stats?.avgTimePerQuestion || 0) / 120) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Optimal time: 60-90s per question
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Question-wise Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Question Analysis
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setShowDetailedAnalysis(!showDetailedAnalysis)
                      }
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {showDetailedAnalysis ? "Hide Details" : "View Details"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {showDetailedAnalysis ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {testResult.results.map((result, index) => (
                        <div
                          key={result.questionId}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              Question {index + 1}
                            </span>
                            <div className="flex items-center space-x-2">
                              {result.isCorrect ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  +4 marks
                                </Badge>
                              ) : result.selectedOption ? (
                                <Badge variant="destructive">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  -1 mark
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  0 marks
                                </Badge>
                              )}
                              {result.isMarkedForReview && (
                                <Badge variant="outline">Marked</Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Your Answer:{" "}
                              </span>
                              <span className="font-medium">
                                {result.selectedOption || "Not Attempted"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Correct Answer:{" "}
                              </span>
                              <span className="font-medium text-green-600">
                                {result.correctOption}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Time:{" "}
                              </span>
                              <span className="font-medium">
                                {result.timeSpent}s
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        Click "View Details" to see question-wise breakdown with answers and time analysis
                      </p>
                      <div className="text-sm text-muted-foreground">
                        Individual question analysis available above
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">

              {/* Quick Actions */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Target className="w-5 h-5 mr-2 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Primary Action */}
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md" 
                    onClick={() => navigate("/tests")}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Take Another Test
                  </Button>

                  {/* Share Section */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Share Results</p>
                    <Button 
                      variant="outline" 
                      className="w-full border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700" 
                      onClick={handleWhatsAppShare}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Share on WhatsApp
                    </Button>
                  </div>

                  {/* Download Section */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Downloads</p>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={generateQuestionPaperPDF}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Question Paper (PDF)
                    </Button>
                  </div>

                  {/* Study Section */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Continue Learning</p>
                    <Button
                      variant="outline"
                      className="w-full border-purple-500 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                      onClick={() => navigate("/study-now")}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Study Weak Areas
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>
                      Review incorrect answers and understand concepts
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>
                      Focus on accuracy to avoid negative marking
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Practice similar questions to strengthen weak areas</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Take regular mock tests to track progress</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResultsPage;
