# 🎯 BATCH FILTERING IMPLEMENTATION PLAN

## Status: Ready for Implementation
- ✅ Audit completed and documented
- ✅ Batch utility functions added to contentAccess.ts
- ✅ Architecture decision: Using **Option B** (chapters-based intermediary)
- ⏳ Ready to implement batch filtering across 5 pages/components

---

## 📋 Implementation Overview

### What Needs to Change
Every student-facing page that loads chapters/questions must:
1. Get their current batch from `user_batch_subscriptions`
2. Get ONLY the subjects available in that batch (from `batch_subjects`)
3. Filter chapters to ONLY those subjects
4. Filter questions to ONLY match the batch's exam_type
5. Validate subscription is active and not expired

### New Utility Functions Available (in contentAccess.ts)
- `getCurrentBatch(userId)` - Get user's active batch
- `hasBatchAccess(userId, batchId)` - Check batch access
- `getUserBatchSubscriptions(userId)` - Get all user's batches
- `getBatchSubjects(batchId)` - Get subjects in a batch

---

## 🔧 Implementation Plan (5 Major Tasks)

### TASK 1: Update StudyNowPage.tsx
**File**: `src/pages/StudyNowPage.tsx`
**Scope**: Lines 129-300+ (fetchSubjects, subject selection, chapter loading)

**Changes Required**:
```typescript
// OLD: Only exam filtering
const { data: allQuestions } = await supabase
  .from('questions')
  .select('subject, difficulty')
  .eq('exam', targetExam);

// NEW: Add batch filtering
const currentBatch = await getCurrentBatch(user.id);
if (!currentBatch) {
  // User has no active batch subscription
  navigate('/batches'); // Redirect to batch selection
  return;
}

// Get ONLY subjects in user's batch
const allowedSubjects = await getBatchSubjects(currentBatch.batch_id);

// Filter chapters to only those subjects
const { data: chaptersData } = await supabase
  .from('chapters')
  .select('id, chapter_name, ...')
  .eq('subject', subject)
  .in('subject', allowedSubjects)  // ← NEW: Batch filtering
  .order('chapter_number');

// Questions filtered by batch's exam_type
const { data: allQuestions } = await supabase
  .from('questions')
  .select('subject, difficulty')
  .eq('exam', currentBatch.batch.exam_type)  // ← NEW: Use batch's exam_type
  .in('subject', allowedSubjects);  // ← NEW: Batch filtering
```

**Estimated Changes**: 
- Add batch loading in `initializePage()`
- Update `fetchSubjects()` to get batch context
- Add subject filtering based on batch
- Update question filtering

---

### TASK 2: Update TestPage.tsx
**File**: `src/pages/TestPage.tsx`
**Scope**: Lines 60-270 (fetchSubjectsAndChapters, handleStartTest)

**Changes Required**:
```typescript
// In fetchSubjectsAndChapters():
const currentBatch = await getCurrentBatch(user.id);
if (!currentBatch) {
  navigate('/batches');
  return;
}

const allowedSubjects = await getBatchSubjects(currentBatch.batch_id);

// Filter chapters
const { data: chaptersData } = await supabase
  .from('chapters')
  .select('id, subject, chapter_name, ...')
  .in('subject', allowedSubjects)  // ← NEW: Batch filtering
  .order('chapter_number');

// In handleStartTest() - Full mock test:
const targetExam = currentBatch.batch.exam_type;  // ← Use batch exam_type
const allowedSubjects = await getBatchSubjects(currentBatch.batch_id);

let query = supabase
  .from('questions')
  .select('*')
  .eq('exam', targetExam)
  .in('subject', allowedSubjects);  // ← NEW: Batch filtering
```

**Estimated Changes**:
- Add batch loading on page init
- Update chapters query to filter by batch subjects
- Update test question queries to use batch subjects and exam_type

---

### TASK 3: Update useQuestions.tsx Hook
**File**: `src/hooks/useQuestions.tsx`
**Scope**: Lines 100-200 (getRandomQuestions function)

**Changes Required**:
```typescript
// Add batchId parameter
const getRandomQuestions = async (
  subject?: string | null, 
  topic?: string | null, 
  difficulty?: number | null,
  count: number = 10,
  batchId?: string  // ← NEW: Add batch parameter
) => {
  // Get batch info
  const batch = batchId 
    ? (some way to fetch batch data)
    : null;

  const targetExam = batch?.batch.exam_type || profileData?.target_exam || 'JEE';
  const allowedSubjects = batchId 
    ? await getBatchSubjects(batchId)
    : null;

  let query = supabase
    .from('questions')
    .select('*')
    .eq('exam', targetExam);

  // Apply subject filter
  if (subject) {
    // Verify subject is in allowed subjects if batch is specified
    if (allowedSubjects && !allowedSubjects.includes(subject)) {
      setError('Subject not available in your batch');
      return [];
    }
    query = query.eq('subject', subject);
  }

  if (allowedSubjects && !subject) {
    // If no specific subject, filter by batch's subjects
    query = query.in('subject', allowedSubjects);
  }

  // Rest of filtering (topic, difficulty, etc.)
  ...
};
```

**Estimated Changes**:
- Add optional `batchId` parameter to function
- Add `batchSubjects` parameter to return value
- Update question query to filter by allowed subjects
- Handle case where specific subject not in batch's subjects

---

### TASK 4: Update PracticeSession.tsx
**File**: `src/components/PracticeSession.tsx`
**Scope**: Lines 15-40 (loadQuestions function)

**Changes Required**:
```typescript
// OLD: No batch context
const loadQuestions = useCallback(async () => {
  const questionsData = await getRandomQuestions(null, null, null, 10);
  setQuestions(questionsData);
}, [getRandomQuestions]);

// NEW: Pass batch context
const loadQuestions = useCallback(async () => {
  const currentBatch = await getCurrentBatch(user?.id);
  if (!currentBatch) {
    toast.error('You need to select a batch first');
    navigate('/batches');
    return;
  }
  
  // Pass batch_id to question fetching
  const questionsData = await getRandomQuestions(
    null, null, null, 10,
    currentBatch.batch_id  // ← NEW: Batch filtering
  );
  setQuestions(questionsData);
}, [getRandomQuestions, user?.id, navigate]);
```

**Estimated Changes**:
- Add batch loading in useEffect
- Pass batch_id to getRandomQuestions
- Add error handling for users without active batch

---

### TASK 5: Update EnhancedDashboard.tsx Analytics
**File**: `src/pages/EnhancedDashboard.tsx`
**Scope**: Analytics/statistics queries

**Changes Required**:
```typescript
// Analytics should calculate stats ONLY for current batch's content
// Example - accuracy calculation:

// OLD: All questions for exam type
const { data: userAttempts } = await supabase
  .from('question_attempts')
  .select('*, questions!inner(subject)')
  .eq('user_id', userId);

// NEW: Only questions in user's batch
const currentBatch = await getCurrentBatch(userId);
const allowedSubjects = await getBatchSubjects(currentBatch.batch_id);

const { data: userAttempts } = await supabase
  .from('question_attempts')
  .select('*, questions!inner(subject, exam)')
  .eq('user_id', userId)
  .eq('questions.exam', currentBatch.batch.exam_type)
  .in('questions.subject', allowedSubjects);
```

**Estimated Changes**:
- Add batch context to analytics loading
- Filter all statistics queries by batch
- Update progress/mastery calculations to use batch questions only

---

## 🔒 Security Considerations

### RLS (Row Level Security) Policies Needed

```sql
-- Allow users to see questions from their batch only
CREATE POLICY "Users can see batch questions"
ON questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_batch_subscriptions ubs
    JOIN batch_subjects bs ON ubs.batch_id = bs.batch_id
    WHERE ubs.user_id = auth.uid()
      AND ubs.status = 'active'
      AND ubs.expires_at > NOW()
      AND bs.subject = questions.subject
      AND questions.exam = (
        SELECT exam_type FROM batches WHERE id = ubs.batch_id
      )
  )
);

-- Allow users to see chapters from their batch subjects
CREATE POLICY "Users can see batch chapters"
ON chapters FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_batch_subscriptions ubs
    JOIN batch_subjects bs ON ubs.batch_id = bs.batch_id
    WHERE ubs.user_id = auth.uid()
      AND ubs.status = 'active'
      AND ubs.expires_at > NOW()
      AND bs.subject = chapters.subject
  )
);
```

---

## 📊 Testing Strategy

### Test Cases for Batch Filtering

1. **User with no batch subscription**
   - Should redirect to `/batches`
   - Should not load chapters/questions

2. **User with 1 active batch (Foundation-9)**
   - Should see ONLY Foundation-9 subjects
   - Should see ONLY chapters in Foundation-9 subjects
   - Should NOT see Foundation-10 or JEE content

3. **User with expired batch**
   - Should redirect to `/batches`
   - Should not access content

4. **User with multiple batches**
   - Should use the MOST RECENT active batch
   - Should be able to switch batches

5. **Cross-batch isolation**
   - User A (7th Scholarship) should NOT see 8th Scholarship questions
   - User B (JEE) should NOT see NEET questions
   - Even if they have same exam_type

---

## ✅ Deployment Checklist

### Before Going Live

- [ ] All 5 files updated with batch filtering
- [ ] No TypeScript compilation errors
- [ ] Manual testing of batch isolation
- [ ] Verify expired subscriptions blocked
- [ ] Test with multiple batches assigned
- [ ] Check API doesn't leak cross-batch data
- [ ] RLS policies deployed
- [ ] Document for admins/support team
- [ ] User communication (no content loss, just batch isolation)

---

## 🚀 Estimated Timeline

| Task | Estimated Time | Status |
|------|---|---|
| StudyNowPage update | 30 min | ⏳ |
| TestPage update | 30 min | ⏳ |
| useQuestions hook update | 20 min | ⏳ |
| PracticeSession update | 15 min | ⏳ |
| EnhancedDashboard update | 20 min | ⏳ |
| RLS policies | 15 min | ⏳ |
| Testing & fixes | 30 min | ⏳ |
| **TOTAL** | **~2.5 hours** | ⏳ |

---

## 🔄 Rollback Plan

If issues arise:
1. Revert all 5 files from git
2. Keep batch system operational but remove filtering
3. Users still have batch access but see all curriculum
4. No data loss or broken functionality

---

## 📝 Notes

- **Decision**: Using chapters-based intermediary (Option B) to avoid schema changes
- **Risk Level**: Medium - Major refactoring but no database migrations
- **User Impact**: Positive - Better content organization by batch
- **Backwards Compatibility**: ✅ Existing premium users still work
- **Premium Subscribers**: Still have full access to all content

---

**Next Step**: Begin Task 1 - Update StudyNowPage.tsx
**Owner**: Engineering Team
**Target Date**: February 4, 2025
