import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Upload, FileText, Loader2, CheckCircle2, XCircle, Image as ImageIcon, Sparkles, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import * as pdfjsLib from "pdfjs-dist";
import { logger } from "@/utils/logger";
import { parseGrade, isFoundationGrade, extractGradeFromExamType } from "@/utils/gradeParser";
// @ts-ignore - Vite handles this URL import
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Use Vite's URL import for reliable worker loading
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface ExtractionLog {
  page: number;
  status: "pending" | "processing" | "success" | "error" | "warning";
  questionsFound: number;
  reportedTotal?: number;
  message?: string;
}

interface Chapter {
  id: string;
  chapter_name: string;
  subject: string;
}

export function PDFQuestionExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [logs, setLogs] = useState<ExtractionLog[]>([]);
  const [totalExtracted, setTotalExtracted] = useState(0);
  
  // Pre-selection filters
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [selectedChapterName, setSelectedChapterName] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number | null>(null);
  
  // Chapters from database
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);

  // Curriculum-based subject mapping
  const CURRICULUM_SUBJECTS: Record<string, string[]> = {
    'JEE': ['Physics', 'Chemistry', 'Mathematics'],
    'NEET': ['Physics', 'Chemistry', 'Biology'],
    'MHT-CET': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    'CET': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    'Foundation-6': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    'Foundation-7': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    'Foundation-8': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    'Foundation-9': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    'Foundation-10': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    'Scholarship': ['Mathematics', 'Science', 'Mental Ability', 'English'],
    'Olympiad': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  };

  // Get available subjects based on selected course
  const availableSubjects = selectedExam ? (CURRICULUM_SUBJECTS[selectedExam] || []) : [];

  // Reset subject when course changes
  useEffect(() => {
    setSelectedSubject("");
    setSelectedChapterId("");
    setSelectedChapterName("");
    setChapters([]);
  }, [selectedExam]);

  // Fetch chapters when subject or exam changes
  useEffect(() => {
    if (selectedSubject && selectedExam) {
      fetchChaptersBySubjectAndExam(selectedSubject, selectedExam);
    } else {
      setChapters([]);
      setSelectedChapterId("");
      setSelectedChapterName("");
    }
  }, [selectedSubject, selectedExam]);

  const fetchChaptersBySubjectAndExam = async (subject: string, exam: string) => {
    setLoadingChapters(true);
    try {
      let query = supabase
        .from("chapters")
        .select("id, chapter_name, subject, batch_id")
        .eq("subject", subject)
        .order("chapter_number");

      // If it's a Foundation course, filter by batch
      if (exam.startsWith('Foundation')) {
        const grade = exam.replace('Foundation-', '');
        // First try to get batch for this grade
        const { data: batchData } = await supabase
          .from("batches")
          .select("id")
          .eq("exam_type", "Foundation")
          .eq("grade", parseInt(grade))
          .single();
        
        if (batchData?.id) {
          query = query.eq("batch_id", batchData.id);
        } else {
          // Batch not found - don't show any chapters
          setChapters([]);
          setLoadingChapters(false);
          return;
        }
      } else {
        // JEE/NEET/CET: only show chapters with null batch_id
        query = query.is("batch_id", null);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setChapters(data || []);
    } catch (error) {
      logger.error("Error fetching chapters:", error);
      toast.error("Failed to load chapters");
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setLogs([]);
      setProgress(0);
      setTotalExtracted(0);
      toast.success(`Selected: ${selectedFile.name}`);
    } else {
      toast.error("Please select a valid PDF file");
    }
  }, []);

  const convertPageToImage = async (pdf: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<string> => {
    const page = await pdf.getPage(pageNum);
    const scale = 2.0; // Higher quality
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    return canvas.toDataURL("image/png");
  };

  const extractQuestions = async () => {
    if (!file) {
      toast.error("Please select a PDF file first");
      return;
    }

    // Validate mandatory fields
    if (!selectedExam) {
      toast.error("Please select a Course Type");
      return;
    }
    if (!selectedSubject) {
      toast.error("Please select a Subject");
      return;
    }
    if (!selectedChapterId || !selectedChapterName) {
      toast.error("Please select a Chapter");
      return;
    }

    setIsExtracting(true);
    setLogs([]);
    setTotalExtracted(0);

    try {
      // Load PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      setTotalPages(numPages);
      
      const actualEndPage = endPage || numPages;
      const pagesToProcess = actualEndPage - startPage + 1;
      
      toast.info(`Processing ${pagesToProcess} pages from ${file.name}`);

      let extracted = 0;

      for (let pageNum = startPage; pageNum <= actualEndPage; pageNum++) {
        setCurrentPage(pageNum);
        setProgress(((pageNum - startPage) / pagesToProcess) * 100);
        
        // Update log
        setLogs(prev => [...prev, {
          page: pageNum,
          status: "processing",
          questionsFound: 0,
          message: "Extracting..."
        }]);

        try {
          // Convert page to image
          const imageBase64 = await convertPageToImage(pdf, pageNum);
          
          // Call edge function
          const { data, error } = await supabase.functions.invoke("extract-pdf-questions", {
            body: {
              imageBase64,
              sourceFile: file.name,
              pageNumber: pageNum,
              subject: selectedSubject,
              chapter: selectedChapterName,
              chapterId: selectedChapterId,
              exam: selectedExam
            }
          });

          if (error) throw error;

          const questionsFound = data.questionsExtracted || 0;
          const reportedTotal = data.reportedTotal || questionsFound;
          extracted += questionsFound;
          setTotalExtracted(extracted);

          // Check if some questions may have been missed
          const hasMismatch = reportedTotal > questionsFound;

          // Update log
          setLogs(prev => prev.map(log => 
            log.page === pageNum 
              ? { 
                  ...log, 
                  status: hasMismatch ? "warning" : "success", 
                  questionsFound, 
                  reportedTotal,
                  message: hasMismatch 
                    ? `Found ${questionsFound}/${reportedTotal} (some may be missed)` 
                    : `Found ${questionsFound} questions` 
                }
              : log
          ));

        } catch (pageError) {
          logger.error(`Error processing page ${pageNum}:`, pageError);
          setLogs(prev => prev.map(log => 
            log.page === pageNum 
              ? { ...log, status: "error", message: pageError instanceof Error ? pageError.message : "Failed" }
              : log
          ));
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setProgress(100);
      toast.success(`Extraction complete! Found ${extracted} questions total.`);

    } catch (error) {
      logger.error("Extraction error:", error);
      toast.error(error instanceof Error ? error.message : "Extraction failed");
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            PDF Question Extractor
          </CardTitle>
          <CardDescription>
            Upload PDF books to automatically extract questions using AI. Questions will be added to review queue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <Input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="pdf-upload"
              disabled={isExtracting}
            />
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                {file ? (
                  <>
                    <FileText className="h-12 w-12 text-primary" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <p className="font-medium">Drop PDF here or click to upload</p>
                    <p className="text-sm text-muted-foreground">
                      Supports textbooks, question banks, PYQ papers
                    </p>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* Pre-selection Filters - ALL MANDATORY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Course Type <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger className={!selectedExam ? "border-red-300" : ""}>
                  <SelectValue placeholder="Select course type" />
                </SelectTrigger>
                <SelectContent>
                  {/* Higher Education */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    HIGHER EDUCATION
                  </div>
                  <SelectItem value="JEE">JEE Main & Advanced</SelectItem>
                  <SelectItem value="NEET">NEET Medical</SelectItem>
                  <SelectItem value="MHT-CET">MHT CET Engineering</SelectItem>
                  <SelectItem value="CET">CET (Generic)</SelectItem>
                  
                  {/* Foundation Courses */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    FOUNDATION COURSES
                  </div>
                  <SelectItem value="Foundation-6">6th Foundation</SelectItem>
                  <SelectItem value="Foundation-7">7th Foundation</SelectItem>
                  <SelectItem value="Foundation-8">8th Foundation</SelectItem>
                  <SelectItem value="Foundation-9">9th Foundation</SelectItem>
                  <SelectItem value="Foundation-10">10th Foundation</SelectItem>
                  
                  {/* Competitive Exams */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    COMPETITIVE EXAMS
                  </div>
                  <SelectItem value="Scholarship">Scholarship Exam</SelectItem>
                  <SelectItem value="Olympiad">Olympiad</SelectItem>
                </SelectContent>
              </Select>
              {!selectedExam && (
                <p className="text-xs text-red-500">Required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={selectedSubject} 
                onValueChange={setSelectedSubject}
                disabled={!selectedExam}
              >
                <SelectTrigger className={selectedExam && !selectedSubject ? "border-red-300" : ""}>
                  <SelectValue placeholder={!selectedExam ? "Select course first" : "Select subject"} />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedExam && (
                <p className="text-xs text-muted-foreground">Select a course type first</p>
              )}
              {selectedExam && !selectedSubject && (
                <p className="text-xs text-red-500">Required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Chapter <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={selectedChapterId} 
                onValueChange={(val) => {
                  const chapter = chapters.find(c => c.id === val);
                  setSelectedChapterId(val);
                  setSelectedChapterName(chapter?.chapter_name || "");
                }}
                disabled={!selectedSubject || loadingChapters}
              >
                <SelectTrigger className={selectedSubject && !selectedChapterId ? "border-red-300" : ""}>
                  <SelectValue placeholder={
                    loadingChapters ? "Loading chapters..." : 
                    !selectedSubject ? "Select subject first" : 
                    chapters.length === 0 ? "No chapters found" :
                    "Select chapter"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-60">
                    {chapters.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.chapter_name}</SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
              {!selectedSubject && (
                <p className="text-xs text-muted-foreground">Select a subject first</p>
              )}
              {selectedSubject && loadingChapters && (
                <p className="text-xs text-muted-foreground">Loading chapters...</p>
              )}
              {selectedSubject && !loadingChapters && chapters.length === 0 && (
                <p className="text-xs text-amber-600">No chapters found for this course/subject</p>
              )}
              {selectedSubject && !loadingChapters && chapters.length > 0 && !selectedChapterId && (
                <p className="text-xs text-red-500">Required</p>
              )}
            </div>
          </div>

          {/* Selected Summary */}
          {selectedExam && selectedSubject && selectedChapterName && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 font-medium">
                ✓ Ready to extract: {selectedExam} → {selectedSubject} → {selectedChapterName}
              </p>
            </div>
          )}

          {/* Page Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Page</Label>
              <Input 
                type="number"
                min={1}
                value={startPage}
                onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Page (leave empty for all)</Label>
              <Input 
                type="number"
                min={startPage}
                value={endPage || ""}
                onChange={(e) => setEndPage(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="All pages"
              />
            </div>
          </div>

          {/* Extract Button */}
          <Button 
            onClick={extractQuestions} 
            disabled={!file || isExtracting || !selectedExam || !selectedSubject || !selectedChapterId}
            className="w-full"
            size="lg"
          >
            {isExtracting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting Page {currentPage} of {totalPages}...
              </>
            ) : !file ? (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload PDF First
              </>
            ) : !selectedExam || !selectedSubject || !selectedChapterId ? (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Select Course, Subject & Chapter
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Start AI Extraction
              </>
            )}
          </Button>

          {/* Progress */}
          {isExtracting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Page {currentPage} / {totalPages}</span>
                <span className="text-primary font-medium">{totalExtracted} questions found</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extraction Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Extraction Log</span>
              <Badge variant="outline">{totalExtracted} total questions</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {logs.map((log, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      log.status === "success" ? "bg-green-500/10" :
                      log.status === "warning" ? "bg-yellow-500/10" :
                      log.status === "error" ? "bg-red-500/10" :
                      log.status === "processing" ? "bg-yellow-500/10" :
                      "bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {log.status === "success" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {log.status === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                      {log.status === "error" && <XCircle className="h-4 w-4 text-red-500" />}
                      {log.status === "processing" && <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />}
                      {log.status === "pending" && <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                      <span className="font-mono text-sm">Page {log.page}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{log.message}</span>
                      {log.questionsFound > 0 && (
                        <Badge variant={log.status === "warning" ? "outline" : "secondary"}>
                          {log.questionsFound} Q
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
