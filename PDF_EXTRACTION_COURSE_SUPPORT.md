# 📚 PDF Question Extraction - Multi-Course Support Guide

## Overview

The PDF question extraction system has been updated to support **Foundation Courses (6th-10th grade)** in addition to the existing JEE/NEET/MHT-CET support. This document provides a complete guide on how the system works and how to use it for different course types.

---

## 🎓 Supported Course Types

### Higher Education (Competitive Exams)
- **JEE** - JEE Main & Advanced preparation
- **NEET** - National Eligibility cum Entrance Test (Medical)
- **MHT-CET** - Maharashtra Common Entrance Test (Engineering)

### Foundation Courses
- **Foundation-6** - 6th Grade Foundation
- **Foundation-7** - 7th Grade Foundation
- **Foundation-8** - 8th Grade Foundation
- **Foundation-9** - 9th Grade Foundation (NEW)
- **Foundation-10** - 10th Grade Foundation

---

## 📋 System Architecture

### Components Involved

#### 1. **PDFQuestionExtractor.tsx**
- **Location**: `src/components/admin/PDFQuestionExtractor.tsx`
- **Purpose**: Frontend UI for PDF upload and extraction configuration
- **Key Updates**: Course type dropdown now includes all Foundation courses

#### 2. **extract-pdf-questions (Edge Function)**
- **Location**: `supabase/functions/extract-pdf-questions/index.ts`
- **Purpose**: AI-powered extraction of questions from PDF images using Claude Vision
- **Key Updates**: Updated prompts to recognize Foundation-level content

#### 3. **ExtractionReviewQueue.tsx**
- **Location**: `src/components/admin/ExtractionReviewQueue.tsx`
- **Purpose**: Review, edit, and approve extracted questions before adding to database
- **Features**: Auto-assignment of chapters/topics, duplicate detection

#### 4. **QuestionManager.tsx**
- **Location**: `src/components/admin/QuestionManager.tsx`
- **Purpose**: Manual question management, CSV upload/download, filtering
- **Key Updates**: Course type dropdowns updated with Foundation options

#### 5. **usePDFExtraction Hook**
- **Location**: `src/hooks/usePDFExtraction.ts`
- **Purpose**: Custom hook for PDF extraction logic and database operations
- **Features**: Queue management, bulk processing, topic auto-assignment

---

## 🔄 Workflow: Adding Questions for 9th Foundation Course

### Step 1: Upload PDF
1. Navigate to **Admin Dashboard** → **PDF Question Extractor**
2. **Select Course Type**: Choose "9th Foundation"
3. **Select Subject** (Optional): 
   - Mathematics
   - Science
   - General Science
   - Biology
   - Mental Ability
   - English
4. **Select Chapter** (Optional): Auto-detect or choose from database
5. **Configure Page Range**: Specify which pages to extract
6. **Click**: "Start AI Extraction"

### Step 2: AI Processing
- The system converts PDF pages to images
- Each image is sent to Claude Vision API
- Claude extracts questions with:
  - Question text (with proper LaTeX formatting)
  - Four options (A, B, C, D)
  - Correct answer
  - Difficulty level (Easy/Medium/Hard)
  - Subject and chapter mapping
  - Explanation (if visible)

### Step 3: Review & Approval
1. Go to **Extraction Review Queue**
2. Filter by:
   - Status (Pending/Approved/Rejected)
   - Book/PDF source
   - Subject
3. For each question:
   - Review extracted content
   - Edit if needed (chapter, topic, difficulty)
   - Check for duplicates
   - **Approve** or **Reject**
   - Auto-assign topics using NLP matching

### Step 4: Database Storage
- Approved questions are automatically stored in the `questions` table
- Linked to existing curriculum (chapters & topics)
- Available for students through search and practice modes

---

## 🎯 Subject Handling by Course Type

### JEE/NEET/MHT-CET (Higher Education)
```
Physics:
- Mechanics, Thermodynamics, Waves, Electricity, Magnetism, Optics

Chemistry:
- Atomic Structure, Chemical Bonding, Reactions, Organic Chemistry

Mathematics:
- Algebra, Calculus, Geometry, Trigonometry, Statistics

Biology (NEET only):
- Cell Biology, Genetics, Physiology, Ecology
```

### Foundation Courses (6th-10th)
```
Mathematics:
- Numbers, Algebra, Geometry, Mensuration, Statistics

Science:
- Physics (Mechanics, Thermodynamics, Light, etc.)
- Chemistry (Elements, Reactions, Organic Basics)
- Biology (Cells, Organisms, Genetics Basics)

General Science:
- Interdisciplinary STEM concepts

Mental Ability:
- Logical reasoning, pattern recognition, puzzles

English:
- Grammar, comprehension, vocabulary
```

---

## 💾 CSV Upload Format

You can also upload questions via CSV. Download a template from QuestionManager.

### CSV Headers:
```csv
exam,subject,chapter,topic,subtopic,question,option_a,option_b,option_c,option_d,correct_option,explanation,difficulty,question_type,year
```

### Example Rows:
```csv
JEE,Physics,Mechanics,Newton Laws,First Law,What is inertia?,Property of matter,Force,Mass,Energy,A,Inertia is the property of matter to resist change in motion,Easy,single_correct,2024

Foundation-9,Mathematics,Algebra,Linear Equations,Solving,What is the solution to x+5=10?,x=5,x=15,x=3,x=2,A,Adding -5 to both sides,Easy,single_correct,2024

NEET,Biology,Cell Structure,Mitochondria,Function,What is the powerhouse of the cell?,Nucleus,Mitochondria,Ribosome,Chloroplast,B,Mitochondria produces ATP,Medium,single_correct,2024
```

### Valid Values:
- **Exam**: `JEE`, `NEET`, `MHT-CET`, `Foundation-6`, `Foundation-7`, `Foundation-8`, `Foundation-9`, `Foundation-10`
- **Difficulty**: `Easy`, `Medium`, `Hard`
- **Question Type**: `single_correct`, `multiple_correct` (typically use `single_correct`)

---

## 🧠 AI Extraction Prompts

### Key Prompt Features

The extraction function uses Claude Vision with specialized prompts for:

#### 1. **Mathematical Notation Handling**
All math is converted to proper LaTeX:
```
❌ "lim x->0 sin(x)/x"
✅ "Find $\lim_{x \to 0} \frac{\sin x}{x}$"

❌ "H2O, x^2, 3/4"
✅ "H$_2$O, x$^2$, $\frac{3}{4}$"
```

#### 2. **Course-Specific Guidance**
The prompt now includes:
```
"For ${subject}: ${dbChapters mapped for that subject}"
"Course type: ${exam type}"
```

#### 3. **Difficulty Assessment**
- **Easy**: Direct formula application, definition-based
- **Medium**: 2-3 steps, combination of concepts
- **Hard**: Multi-step derivation, advanced concepts

#### 4. **Subject Detection**
```
JEE/NEET (11-12 grade):
- Physics, Chemistry, Mathematics, Biology (NEET)

Foundation courses (6-10 grade):
- Mathematics, Science, General Science, Biology, Mental Ability, English
```

---

## 🔍 Database Schema

### Key Tables

#### `batches` Table
```sql
exam_type: 'jee' | 'neet' | 'foundation'
grade: INTEGER (6-12)
slug: 'jee-2026', '9th-foundation', etc.
```

#### `chapters` Table
```sql
chapter_name: TEXT
subject: TEXT
batch_id: UUID (optional, for batch-specific chapters)
```

#### `topics` Table
```sql
topic_name: TEXT
chapter_id: UUID (FK to chapters)
```

#### `questions` Table
```sql
exam: TEXT ('JEE', 'NEET', 'MHT-CET', 'Foundation-6', etc.)
subject: TEXT
chapter: TEXT
chapter_id: UUID (FK to chapters)
topic: TEXT
topic_id: UUID (FK to topics, nullable)
difficulty: 'Easy' | 'Medium' | 'Hard'
```

#### `extracted_questions_queue` Table
```sql
status: 'pending' | 'approved' | 'rejected'
parsed_question: JSONB (contains extracted data)
source_file: TEXT (PDF filename)
page_number: INTEGER
```

---

## 🤖 NLP-Powered Topic Auto-Assignment

### How It Works

When reviewing extracted questions, the system can auto-assign topics using NLP:

1. **Question Text Analysis**: Uses semantic similarity to match extracted questions with database chapters/topics
2. **Keyword Extraction**: Identifies key terms in the question
3. **Confidence Scoring**: Provides confidence level for each assignment
4. **Bulk Processing**: Apply auto-assignment to multiple questions at once

### Assignment Methods
- **Auto**: High-confidence automatic assignment (>80% similarity)
- **Suggested**: Medium-confidence suggestions (50-80% similarity)
- **Manual**: No match found, requires manual selection

---

## 📊 Filtering & Searching

### In PDFQuestionExtractor
- **Course Type**: Select extraction context (JEE, NEET, Foundation-9, etc.)
- **Subject**: Narrows down chapter selection
- **Chapter**: Pre-select where questions belong (optional)
- **Page Range**: Extract specific pages only

### In ExtractionReviewQueue
- **Status Filter**: Pending / Approved / Rejected
- **Book Filter**: Filter by PDF source file
- **Subject Filter**: Filter by detected subject

### In QuestionManager
- **Search**: Full-text search in question text
- **Subject**: Filter by subject
- **Difficulty**: Easy / Medium / Hard
- **Course Type**: JEE / NEET / MHT-CET / Foundation-6 through 10

---

## ⚙️ Configuration & Dependencies

### Required Database Tables
✅ All existing tables support new course types
✅ No migration required for Foundation course support

### Required Supabase Functions
- `extract-pdf-questions`: Already updated with multi-course support

### UI Components Updated
- ✅ PDFQuestionExtractor.tsx
- ✅ QuestionManager.tsx
- ✅ ExtractionReviewQueue.tsx (uses dynamic values)

### API Integration
- **Claude Vision API**: For PDF image processing
- **Supabase Storage**: For PDF file management
- **Supabase Database**: For question storage

---

## 📝 Best Practices

### For PDF Upload
1. ✅ Use clear, high-quality PDFs
2. ✅ Pre-select correct course type for better AI guidance
3. ✅ Specify subject if known (improves accuracy)
4. ✅ Extract in batches of 50-100 pages for faster processing
5. ✅ Review extracted questions before approval

### For 9th Foundation Specifically
1. Foundation content is slightly different from JEE/NEET
2. Include "Mental Ability" questions if present
3. Science questions may cover Physics + Chemistry together
4. Difficulty is typically Easy to Medium for Foundation level
5. Topics are broader, may not exactly match JEE chapter structure

### Data Quality
1. ✅ Check mathematical notation (must be LaTeX)
2. ✅ Verify all 4 options are distinct
3. ✅ Ensure explanation makes sense
4. ✅ Check for duplicates with existing questions
5. ✅ Use topic auto-assignment as a starting point, verify manually

---

## 🐛 Troubleshooting

### Issue: Questions not extracting from PDF
**Solution**: 
- PDF might be image-based (scanned). System uses OCR on images
- Try a native PDF (PDF with text) instead
- Ensure PDF quality is good

### Issue: Wrong course type being inferred
**Solution**:
- Explicitly select course type in PDFQuestionExtractor
- Select specific subject to guide AI
- Add chapter hint if known

### Issue: Mathematical notation looks wrong
**Solution**:
- Click "Edit" in ExtractionReviewQueue
- Manually fix LaTeX formatting
- Example: `$x^2 + 2x + 1$` not `x^2 + 2x + 1`

### Issue: Topics not auto-assigning correctly
**Solution**:
- Verify chapters exist in database for that course
- Check spelling of chapter names
- Try manual assignment if confidence is low

### Issue: Duplicate detection failing
**Solution**:
- Ensure question text is not too short (<20 characters)
- Check similar questions aren't across different PDFs
- Manual review is recommended for similar questions

---

## 🎓 Adding Questions for Specific Foundation Courses

### Example: 9th Foundation Mathematics

**Step 1: Prepare PDF**
- Ensure you have a 9th grade Math textbook or question bank
- Should cover topics like:
  - Linear Equations
  - Polynomials
  - Coordinate Geometry
  - Statistics
  - etc.

**Step 2: Configure Extraction**
```
Course Type: Foundation-9
Subject: Mathematics
Chapter: (auto-detect or select from list)
Pages: (full range or specific)
```

**Step 3: Review Extracted Questions**
- Check that chapters are mapped correctly to 9th grade level
- Verify difficulty levels (mostly Easy/Medium)
- Edit any incorrect mathematics formatting

**Step 4: Approve & Store**
- Review 10-20% of questions manually
- Use auto-assignment for rest
- Bulk approve if quality is good

**Result**: Questions available in 9th Foundation batch, searchable by students

---

## 📚 Related Documentation

- [Batch System Implementation](./BATCH_IMPLEMENTATION_COMPLETE.md)
- [NLP Auto-Assignment Guide](./NLP_AUTO_ASSIGNMENT_GUIDE.md)
- [Batch Deployment Guide](./BATCH_DEPLOYMENT_GUIDE.md)
- [Quick Deploy Guide](./QUICK_DEPLOY.md)

---

## 📞 Support

For issues with PDF extraction or course setup:
1. Check extraction logs in PDFQuestionExtractor UI
2. Review ExtractionReviewQueue for processing errors
3. Verify database tables have required chapters/topics
4. Check Supabase function logs for extract-pdf-questions

---

**Last Updated**: February 3, 2026  
**Version**: 2.0 (Multi-Course Support)
