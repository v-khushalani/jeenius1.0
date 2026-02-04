# 🔍 BATCH FILTERING AUDIT - CRITICAL FINDINGS

## Executive Summary
**Status**: ⚠️ **CRITICAL ISSUE IDENTIFIED**

After comprehensive code audit, students are **NOT** currently segregated by their purchased batch. Instead, all curriculum content (subjects, chapters, questions, tests, analytics) is filtered ONLY by `target_exam` (e.g., "JEE", "NEET", "Foundation-9").

**Impact**: A student with "7th Scholarship" batch can currently access "7th Foundation" or "8th Scholarship" questions/chapters if they have the same target exam.

---

## 🎯 Architecture Overview

### Current Question Filtering (EXAM-BASED)
```
Questions Table Structure:
├── exam: "JEE", "NEET", "Foundation-6", "Foundation-7", ..., "Foundation-10"
├── subject: "Physics", "Chemistry", "Mathematics", "Biology"
├── chapter: "Mechanics", "Waves", etc.
├── topic: "Newton's Laws", "Oscillations", etc.
└── difficulty: "Easy", "Medium", "Hard"

**NO batch_id column exists on questions table**
```

### Batch System (NEWLY ADDED)
```
user_batch_subscriptions (links students to batches):
├── user_id → auth.users.id
├── batch_id → batches.id
├── status: 'active', 'expired', 'cancelled'
└── expires_at: Subscription expiration date

batches (batch metadata):
├── id, name, grade (6-12)
├── exam_type: 'Foundation', 'Scholarship', 'Homi Bhabha', 'JEE', 'NEET', 'Olympiad'
└── price, offer_price, validity_days

batch_subjects (defines what subjects are in each batch):
├── batch_id → batches.id
└── subject: "Physics", "Chemistry", etc.
```

### Problem: Disconnect
- ✅ Questions organized by `exam` type only
- ✅ Batches have explicit `exam_type` 
- ✅ `user_batch_subscriptions` tracks student batch access
- ❌ **No connection between questions and batch_id**
- ❌ **No verification that student purchased the batch before accessing**

---

## 📋 Current State - File by File

### 1. **StudyNowPage.tsx** (Lines 129-300)
**Function**: `fetchSubjects()` - Loads subjects and chapters for study

**Current Logic**:
```typescript
const targetExam = profileData?.target_exam || 'JEE';

// Fetches ALL chapters for the subject (no batch filtering)
const { data: chaptersData } = await supabase
  .from('chapters')
  .select('id, chapter_name, chapter_number, ...')
  .eq('subject', subject)
  .order('chapter_number', { ascending: true });

// Fetches ALL questions for the exam type (no batch filtering)
const { data: allQuestions } = await supabase
  .from('questions')
  .select('subject, difficulty')
  .eq('exam', targetExam);  // ← ONLY exam filter
```

**Missing**: No check for `user_batch_subscriptions` or batch access

**Issue**: Student can see chapters from ANY batch with same exam type

---

### 2. **TestPage.tsx** (Lines 60-270)
**Function**: `fetchSubjectsAndChapters()` and `handleStartTest()`

**Current Logic**:
```typescript
const targetExam = profile?.target_exam || 'JEE';

// Fetches chapters without batch context
const { data: chaptersData } = await supabase
  .from('chapters')
  .select('id, subject, chapter_name, chapter_number')
  .order('chapter_number');

// Questions pulled from ALL exams matching type
let query = supabase.from('questions')
  .select('*')
  .eq('exam', targetExam);  // ← ONLY exam filter
```

**Missing**: No batch subscription validation

**Issue**: Full mock tests include questions from ALL batches with same exam type

---

### 3. **useQuestions.tsx Hook** (Lines 120-200)
**Function**: `getRandomQuestions()` - Core question fetching for practice

**Current Logic**:
```typescript
const targetExam = profileData?.target_exam || 'JEE';

let query = supabase
  .from('questions')
  .select('*')
  .eq('exam', targetExam);  // ← ONLY exam filter

// Apply subject/topic/difficulty filters, but NO batch filter
if (subject) query = query.eq('subject', subject);
if (topic) query = query.eq('topic', topic);
```

**Missing**: No batch subscription validation or filtering

**Issue**: Practice sessions serve questions from ANY batch with same exam type

---

### 4. **PracticeSession.tsx** (Lines 15-40)
**Function**: Uses `useQuestions.getRandomQuestions()` with no parameters

**Current Logic**:
```typescript
const questionsData = await getRandomQuestions(
  null, null, null, 10  // ← No batch context passed
);
```

**Missing**: No batch filtering before calling hook

**Issue**: Inherits unfiltered questions from useQuestions hook

---

### 5. **EnhancedDashboard.tsx** (Needs verification)
**Expected Issue**: Analytics likely filtered by `target_exam` only, not batch

---

### 6. **ExtractionReviewQueue.tsx** (Needs verification)
**Expected Issue**: Admin review queue not segregated by batch

---

## 🔑 Key Questions Answered

### Q: How do batches differ if they have the same exam_type?
**A**: They can have different:
- **Grade levels**: 7th Foundation vs 8th Foundation
- **Subject availability**: Via `batch_subjects` table
- **Pricing**: Different offer prices
- **Validity**: Different expiration dates

But questions are NOT batch-specific - they're only exam-specific.

### Q: Example - 7th Scholarship vs 7th Foundation Students
**A**: Currently:
- Both students have `target_exam` = "Foundation"
- Both students see ALL "Foundation" chapters
- Both students access ALL "Foundation" questions
- **WRONG**: They should see ONLY their batch's curriculum

### Q: Why wasn't batch filtering implemented initially?
**A**: The batch system was added to admin/shop features (pricing, management), but the question database structure wasn't modified. Questions use `exam` field as the primary classifier, not `batch_id`.

---

## ✅ What's Working (Correctly)

1. ✅ **Batch purchase system**: Students can buy batches and get access tracked
2. ✅ **BatchExplorer**: Shows correct batches for student's exam type
3. ✅ **Offer prices**: Displaying with discount correctly
4. ✅ **Exam type filtering**: Foundation-6, Foundation-9, JEE, NEET properly separated by exam
5. ✅ **Difficulty/subject filtering**: Working within exam types

---

## ❌ What Needs Fixing

### CRITICAL (Must Fix Before Deployment)

1. **StudyNowPage** - Must validate batch subscription before loading chapters
2. **TestPage** - Must validate batch subscription before loading tests  
3. **useQuestions** - Must add batch_id parameter and filter by it
4. **PracticeSession** - Must pass batch context to question fetching
5. **EnhancedDashboard** - Analytics must be batch-specific

### ARCHITECTURAL DECISION NEEDED

Two options to establish question ↔ batch relationship:

#### **Option A: Add batch_id to questions table** (Recommended)
```sql
ALTER TABLE questions ADD COLUMN batch_id UUID REFERENCES batches(id);

-- Then update questions with batch_id based on exam type
UPDATE questions q
SET batch_id = b.id
FROM batches b
WHERE q.exam = b.exam_type AND q.grade = b.grade;
```
**Pros**: Direct relationship, efficient queries, clear ownership
**Cons**: Need to migrate/update all existing questions

#### **Option B: Use chapters as intermediary** (Current implicit approach)
```typescript
// Get batch's subjects → Get chapters for those subjects → Get questions for those chapters
const batchSubjects = await supabase
  .from('batch_subjects')
  .select('subject')
  .eq('batch_id', batchId);

const chapters = await supabase
  .from('chapters')
  .select('id')
  .in('subject', subjects);

const questions = await supabase
  .from('questions')
  .select('*')
  .in('chapter_id', chapters.map(c => c.id))
  .eq('exam', targetExam);
```
**Pros**: No schema changes, uses existing relationships
**Cons**: Complex queries, multiple joins, harder to maintain

---

## 📊 Filtering Flow Diagram

### Current (BROKEN)
```
User Login
    ↓
Load Profile (target_exam = "Foundation-9")
    ↓
StudyNowPage
├─→ Fetch ALL chapters with subject = "Physics" (no batch check)
├─→ Fetch ALL questions with exam = "Foundation-9" (no batch check)
└─→ Student sees questions from ANY "Foundation-9" batch
```

### Required (CORRECT)
```
User Login
    ↓
Load Profile (target_exam = "Foundation-9")
    ↓
Get Current Batch from user_batch_subscriptions
    ↓
StudyNowPage
├─→ Fetch ONLY chapters in current batch's subjects
├─→ Fetch ONLY questions for current batch
├─→ Validate batch access (active subscription & not expired)
└─→ Student sees ONLY their batch's questions
```

---

## 🛠️ Implementation Checklist

### Phase 1: Add Batch Context to Content Fetch
- [ ] Create `getCurrentBatch()` utility function
- [ ] Update StudyNowPage to fetch current batch
- [ ] Update TestPage to fetch current batch
- [ ] Update useQuestions to accept batch_id parameter

### Phase 2: Implement Batch-Specific Filtering
- [ ] StudyNowPage: Filter chapters by batch_subjects
- [ ] TestPage: Filter chapters & questions by batch
- [ ] PracticeSession: Pass batch context to useQuestions
- [ ] EnhancedDashboard: Filter analytics by batch

### Phase 3: Add Validation & Security
- [ ] Add batch subscription validation before loading content
- [ ] Check if subscription is still active (not expired)
- [ ] Add RLS policies to restrict batch-specific content access
- [ ] Verify users can't access other batches' questions via API

### Phase 4: Testing & Deployment
- [ ] Test with multiple batch subscriptions
- [ ] Test with expired subscriptions
- [ ] Test subject/chapter filtering per batch
- [ ] Test analytics isolation
- [ ] Verify no cross-batch data leakage

---

## 📝 Summary Stats

| Component | Filtered by Exam | Filtered by Batch | ✅/❌ |
|-----------|-----------------|-------------------|------|
| StudyNowPage chapters | ✅ | ❌ | ❌ |
| StudyNowPage subjects | ✅ | ❌ | ❌ |
| TestPage chapters | ✅ | ❌ | ❌ |
| TestPage questions | ✅ | ❌ | ❌ |
| PracticeSession questions | ✅ | ❌ | ❌ |
| useQuestions hook | ✅ | ❌ | ❌ |
| EnhancedDashboard | ✅ | ❌ | ❌ |
| ExtractionReviewQueue | ? | ❌ | ❌ |

**Total**: 0 out of 8 components have proper batch filtering

---

## 🎯 Next Steps

1. **IMMEDIATELY**: Determine architecture choice (Option A vs B above)
2. **HIGH PRIORITY**: Implement batch validation on StudyNowPage & TestPage
3. **HIGH PRIORITY**: Update useQuestions hook to support batch filtering
4. **CRITICAL**: Add subscription expiry validation
5. **SECURITY**: Implement RLS policies to prevent API bypass
6. **TESTING**: Comprehensive batch isolation testing before production

---

**Audit Date**: February 4, 2025
**Severity**: 🔴 CRITICAL - Students not properly isolated by batch
**Risk**: Data breach / Unauthorized access to premium content
