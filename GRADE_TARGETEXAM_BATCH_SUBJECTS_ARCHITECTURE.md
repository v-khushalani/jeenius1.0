# 🔗 Grade → Target_Exam → Batch → Subjects: Complete Architecture

**Date**: February 4, 2026  
**Status**: ✅ Fully Implemented & Integrated  
**Build Status**: ✅ Passing (0 TypeScript errors, 0 Build errors)

---

## 1️⃣ Architecture Overview

The system links four interconnected fields to determine what content a student sees:

```
┌─────────────┐
│   Grade     │  (6-10 or 11-12)
│             │  ↓
│  9, "9th"   │  parseGrade() → numeric value
└─────────────┘  
        ↓
┌─────────────────────┐
│  Target_Exam        │  (Foundation-9, JEE, NEET, etc.)
│                     │  ↓
│  profile.target_exam│  determines exam type
└─────────────────────┘
        ↓
┌──────────────────────────┐
│   Batch                  │  (9th-foundation, jee-2026, etc.)
│                          │  ↓
│ From batches table       │  links to batch_subjects table
└──────────────────────────┘
        ↓
┌──────────────────────────┐
│   Subjects               │  (Physics, Chemistry, etc.)
│                          │  ↓
│ From batch_subjects table│  shown in UI
└──────────────────────────┘
```

---

## 2️⃣ Data Flow: Step by Step

### Student Sets Profile
```sql
UPDATE profiles 
SET grade = 9, target_exam = 'Foundation-9'
WHERE id = user_id;
```

### System Determines Batch
```typescript
// In batchConfig.ts
const batch = await getBatchForStudent(userId, 9, 'Foundation-9');
// Returns: {
//   id: "batch-uuid",
//   name: "9th Foundation",
//   exam_type: "Foundation",
//   subjects: ["Physics", "Chemistry", "Mathematics", "Biology", "Science", "English"]
// }
```

### Filter Subjects for Student
```typescript
// Allowed by target_exam (Foundation-9 allows all PCMB)
const allowed = getAllowedSubjects('Foundation-9');
// → ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Science', 'English']

// Available in batch_subjects table for 9th-foundation
const batchSubjects = batch.subjects;
// → ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Science', 'English']

// Final filtered list (intersection)
const shown = getFilteredSubjects('Foundation-9', batchSubjects);
// → ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Science', 'English']
```

### Student Sees Content
```
STUDY NOW PAGE:
- Subjects section shows: Physics, Chemistry, Math, Biology, Science, English
- Chapters: Only 9th-foundation batch's chapters
- Questions: Only exam='Foundation-9' questions

TEST PAGE:
- Same subject filtering
- Same chapter filtering
```

---

## 3️⃣ Configuration: Subject Rules by Target_Exam

### **Grade 6-10: Foundation Track**
```
Target_Exam: "Foundation-6" → Subjects: Physics, Chemistry, Math, Biology, Science, English
Target_Exam: "Foundation-7" → Subjects: Physics, Chemistry, Math, Biology, Science, English
Target_Exam: "Foundation-8" → Subjects: Physics, Chemistry, Math, Biology, Science, English
Target_Exam: "Foundation-9" → Subjects: Physics, Chemistry, Math, Biology, Science, English
Target_Exam: "Foundation-10" → Subjects: Physics, Chemistry, Math, Biology, Science, English
```

**Database**:
- 5 batches in `batches` table (9th-foundation, 10th-foundation, etc.)
- Each linked to 6 subjects in `batch_subjects` table
- Chapters linked by `batch_id` in `chapters` table
- Questions filtered by `exam='Foundation-9'` in `questions` table

---

### **Grade 11-12: Competitive Exams**

#### JEE Preparation
```
Target_Exam: "JEE" or "JEE Main" or "JEE Advanced"
Subjects: Physics, Chemistry, Mathematics (PCM)
Batch: jee-2026 (grade 11 or 12)
```

**Database**:
- 1 batch: `jee-2026` (exam_type='JEE', grade=11, 2 with same for grade 12)
- 3 subjects in `batch_subjects`
- Questions filtered by `exam='JEE'`

#### NEET Preparation
```
Target_Exam: "NEET"
Subjects: Physics, Chemistry, Biology (PCB)
Batch: neet-2026 (grade 11 or 12)
```

**Database**:
- 1 batch: `neet-2026` (exam_type='NEET', grade=11 or 12)
- 3 subjects in `batch_subjects`
- Questions filtered by `exam='NEET'`

---

### **Special Programs**

#### 7th Scholarship
```
Grade: 7
Target_Exam: "Scholarship" (custom)
Subjects: Mathematics, Science, Mental Ability, English
Batch: 7th-scholarship
```

#### 6th Homi Bhabha
```
Grade: 6
Target_Exam: "Homi Bhabha" (custom)
Subjects: Science, Mathematics
Batch: 6th-homi-bhabha
```

---

## 4️⃣ Code Implementation: All Three Linked

### **Entry Point: studyNowPage.tsx**

```typescript
// 1️⃣ Load profile
useEffect(() => {
  loadProfile(); // Gets grade, target_exam, batch_id
}, []);

// 2️⃣ When any of these change, reload subjects
useEffect(() => {
  if (profile?.target_exam || profile?.grade || profile?.batch_id) {
    fetchSubjects();
  }
}, [profile?.target_exam, profile?.grade, profile?.batch_id]); // ← Dependencies!

// 3️⃣ Fetch logic
const fetchSubjects = async () => {
  const targetExam = profile?.target_exam || 'JEE';
  let userGrade = parseGrade(profile?.grade || 12);

  // Get batch info with subjects
  const batch = await getBatchForStudent(userId, userGrade, targetExam);
  
  // Filter subjects
  const allowed = getAllowedSubjects(targetExam);
  const shown = getFilteredSubjects(targetExam, batch.subjects);
  
  setSubjects(shown);
};
```

### **Batch Configuration: batchConfig.ts**

```typescript
/**
 * Get batch for student
 * Links: grade → batch → subjects
 */
export const getBatchForStudent = async (
  userId, grade, targetExam
): Promise<BatchInfo | null> => {
  const parsedGrade = parseGrade(grade);
  
  if (isFoundationGrade(parsedGrade)) {
    // Grades 6-10: Find batch by grade
    const gradeToUse = extractGradeFromExamType(targetExam) || parsedGrade;
    const batch = await supabase
      .from('batches')
      .select(`
        id, name, slug, grade, exam_type,
        batch_subjects (subject)
      `)
      .eq('grade', gradeToUse)
      .eq('exam_type', 'Foundation')
      .single();
    
    return {
      id: batch.id,
      subjects: batch.batch_subjects.map(bs => bs.subject)
    };
  } else {
    // Grades 11-12: Find batch by exam type
    const examType = targetExam.includes('NEET') ? 'NEET' : 'JEE';
    const batch = await supabase
      .from('batches')
      .select(`...`)
      .eq('exam_type', examType)
      .single();
    
    return { ... };
  }
};

/**
 * Filter subjects
 * Intersection of allowed (by target_exam) and available (by batch)
 */
export const getFilteredSubjects = (
  targetExam: string,
  batchSubjects: string[]
): string[] => {
  const allowed = getAllowedSubjects(targetExam);
  return batchSubjects.filter(s => allowed.includes(s));
};
```

---

## 5️⃣ Database Schema: How It All Connects

### **profiles table** (Student Data)
```sql
CREATE TABLE profiles (
  id UUID,
  grade INTEGER,              -- 6, 7, 8, 9, 10, 11, 12
  target_exam TEXT,           -- "Foundation-9", "JEE", "NEET"
  batch_id UUID,              -- Optional: explicit batch selection
  FOREIGN KEY (batch_id) REFERENCES batches(id)
);
```

### **batches table** (Courses)
```sql
CREATE TABLE batches (
  id UUID,
  name TEXT,                  -- "9th Foundation", "JEE 2026"
  grade INTEGER,              -- Filters by grade
  exam_type TEXT,             -- "Foundation", "JEE", "NEET"
  -- Subjects defined separately in batch_subjects
);

-- Example rows:
-- (uuid1, "9th Foundation", 9, "Foundation")
-- (uuid2, "10th Foundation", 10, "Foundation")
-- (uuid3, "JEE 2026", 11, "JEE")
-- (uuid4, "NEET 2026", 11, "NEET")
```

### **batch_subjects table** (Subject Mapping)
```sql
CREATE TABLE batch_subjects (
  id UUID,
  batch_id UUID,              -- Links to batches
  subject TEXT,               -- "Physics", "Chemistry", etc.
  display_order INTEGER,
  FOREIGN KEY (batch_id) REFERENCES batches(id)
);

-- Example rows for 9th-foundation batch:
-- (uuid1, batch_uuid1, "Physics", 1)
-- (uuid2, batch_uuid1, "Chemistry", 2)
-- (uuid3, batch_uuid1, "Mathematics", 3)
-- (uuid4, batch_uuid1, "Biology", 4)
-- (uuid5, batch_uuid1, "Science", 5)
-- (uuid6, batch_uuid1, "English", 6)
```

### **chapters table** (Content)
```sql
CREATE TABLE chapters (
  id UUID,
  batch_id UUID,              -- ← Filters by batch!
  subject TEXT,
  chapter_name TEXT,
  FOREIGN KEY (batch_id) REFERENCES batches(id)
);

-- 9th Foundation students ONLY see chapters.batch_id = 9th-foundation-uuid
```

### **questions table** (Practice Questions)
```sql
CREATE TABLE questions (
  id UUID,
  exam TEXT,                  -- ← Filters by target_exam!
  subject TEXT,
  chapter TEXT,
  -- NOT batch_id - questions are exam-wide, not batch-specific
);

-- All "Foundation-9" questions available to any 9th student
-- All "JEE" questions available to any JEE student
```

---

## 6️⃣ Real-World Scenarios

### **Scenario 1: 9th Grader in Foundation Batch**
```
Profile:
├─ grade: 9 (student's class)
├─ target_exam: "Foundation-9" (chosen track)
└─ batch_id: 9th-foundation (from database)

System determines:
├─ Batch: 9th-foundation
├─ Subjects allowed: Physics, Chemistry, Math, Biology, Science, English
├─ Subjects available in batch: Physics, Chemistry, Math, Biology, Science, English
└─ Subjects shown: [Physics, Chemistry, Math, Biology, Science, English]

Chapters shown:
├─ Only from batches.batch_id = 9th-foundation
├─ Not from 10th or 11th batch

Questions shown:
├─ Only exam = "Foundation-9"
├─ Not exam = "Foundation-10" or "JEE"
```

### **Scenario 2: 11th Grader Preparing for JEE**
```
Profile:
├─ grade: 11
├─ target_exam: "JEE"
└─ batch_id: jee-2026

System determines:
├─ Batch: jee-2026
├─ Subjects allowed: Physics, Chemistry, Mathematics (PCM only)
├─ Subjects available in batch: Physics, Chemistry, Mathematics
└─ Subjects shown: [Physics, Chemistry, Mathematics]

Chapters shown:
├─ Only from batches.batch_id = jee-2026
├─ Not from NEET or Foundation batches

Questions shown:
├─ Only exam = "JEE"
├─ Not exam = "NEET" or "Foundation-11"
```

### **Scenario 3: Student Changes Goal from JEE to NEET**
```
BEFORE:
├─ grade: 11, target_exam: "JEE"
└─ Shows: Physics, Chemistry, Mathematics

Student updates profile:
├─ grade: 11, target_exam: "NEET" ← Changed!

AFTER (automatic):
1. useEffect detects profile?.target_exam change
2. Calls fetchSubjects()
3. Batch changes: jee-2026 → neet-2026
4. Subjects filter: [Physics, Chemistry, Math] → [Physics, Chemistry, Biology]
5. UI updates immediately
```

---

## 7️⃣ Key Files & Functions

| File | Key Functions | Purpose |
|------|--------|---------|
| `src/utils/batchConfig.ts` | `getBatchForStudent()` | Link grade+targetExam to batch |
| | `getFilteredSubjects()` | Intersection of allowed & available |
| | `getAllowedSubjects()` | Get subjects for exam type |
| | `getBatchDependencies()` | useEffect deps array |
| `src/pages/StudyNowPage.tsx` | `fetchSubjects()` | Load batch + filter subjects |
| | `useEffect [...deps]` | Reload when grade/exam/batch change |
| `src/pages/TestPage.tsx` | `fetchSubjectsAndChapters()` | Same logic for tests |
| | `useEffect [...deps]` | Reload when dependencies change |
| `src/utils/gradeParser.ts` | `parseGrade()` | String "9" → number 9 |
| | `extractGradeFromExamType()` | "Foundation-9" → 9 |

---

## 8️⃣ Dependency Tracking

### **Study Now Page**
```typescript
useEffect(() => {
  fetchSubjects();
}, [profile?.target_exam, profile?.grade, profile?.batch_id]);
//  ↑ These 3 trigger refresh ↑
```

**Triggers refetch when**:
- ✅ Grade changes (6→7, 10→11, etc.)
- ✅ Target exam changes (JEE→NEET)
- ✅ Batch explicitly changes
- ❌ Other profile fields change (name, email, etc.)

### **Test Page**
```typescript
useEffect(() => {
  fetchSubjectsAndChapters();
}, [profile?.target_exam, profile?.grade, profile?.batch_id]);
//  ↑ Same dependencies ↑
```

---

## 9️⃣ Quality Assurance

### ✅ Build Status
```bash
$ npm run build
✓ 2523 modules transformed
✓ built in 7.16s
```

### ✅ TypeScript Check
```bash
$ npx tsc --noEmit
(no output = zero errors)
```

### ✅ ESLint
```bash
$ npm run lint
✖ 21 problems (0 errors, 21 warnings)
// Only React Hook dependency warnings, no actual errors
```

### ✅ Verification Logs
Comprehensive logging added to debug batch assignment:
```typescript
logBatchConfig('fetchSubjects', userId, grade, targetExam, batch);
// Output: BATCH_CONFIG [fetchSubjects]
//   ├─ userId: user-123
//   ├─ grade: 9
//   ├─ targetExam: "Foundation-9"
//   ├─ batchFound: true
//   ├─ batchId: batch-uuid
//   ├─ batchName: "9th Foundation"
//   ├─ subjectCount: 6
//   └─ subjects: [Physics, Chemistry, Math, Biology, Science, English]
```

---

## 🔟 Testing Checklist

### Manual Testing
- [ ] Set grade 9, target_exam Foundation-9 → See 9th subjects only
- [ ] Set grade 11, target_exam JEE → See PCM subjects only
- [ ] Set grade 11, target_exam NEET → See PCB subjects only
- [ ] Change grade from 9 to 10 → Subjects update automatically
- [ ] Change target_exam from JEE to NEET → Subjects update automatically
- [ ] Load chapters for 9th Foundation → See only 9th batch chapters
- [ ] Load chapters for JEE → See JEE batch chapters (no batch_id filter)

### Console Logs (DevTools)
```
BATCH_CONFIG [fetchSubjects] - Check batch is found
LoadChapters debug - Check batch_id filtering works
Profile changed, reloading subjects - Verify dependency updates
```

---

## 1️⃣1️⃣ Migration & Deployment

### Prerequisites
- ✅ `batches` table with sample data
- ✅ `batch_subjects` table with subject mappings
- ✅ `chapters` table with `batch_id` column
- ✅ `questions` table with `exam` column (not batch_id)
- ✅ `profiles` table with `grade`, `target_exam`, `batch_id` columns

### Deployment Steps
```bash
1. npm run build          # Verify build passes
2. npx tsc --noEmit      # Zero TypeScript errors
3. npm run lint          # No blocking lints
4. Deploy dist/ folder
5. Monitor console logs for BATCH_CONFIG messages
```

---

## Summary

The system now properly links:
- **Grade** → Determines if Foundation (6-10) or Competitive (11-12)
- **Target_Exam** → Determines subject restrictions (PCM, PCB, PCMB, etc.)
- **Batch** → Provides actual subjects from database
- **Subjects** → Shown in UI (intersection of allowed & available)

All three fields are tracked in `useEffect` dependencies, ensuring automatic updates when students change their goals.

