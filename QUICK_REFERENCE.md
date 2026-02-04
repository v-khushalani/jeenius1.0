# ⚡ Quick Reference: Grade ↔ Target_Exam ↔ Batch ↔ Subjects

---

## 📋 What This Does

Links 4 student fields so content automatically updates when any field changes.

```
Grade 9 + Foundation-9 → Shows 9th batch chapters
Change to Grade 10 → Shows 10th batch chapters
Change to JEE → Shows JEE batch chapters
Change to NEET → Shows NEET batch chapters (all automatic!)
```

---

## 🔑 Key Concepts

| Field | Values | Controls |
|-------|--------|----------|
| **Grade** | 6-12 | Foundation (6-10) vs Competitive (11-12) |
| **Target_Exam** | JEE, NEET, F-9, etc. | Which subjects are allowed |
| **Batch** | From database | Actual content (chapters, subjects) |
| **Subjects** | Physics, Chemistry, etc. | What's shown in UI |

---

## 🔄 The Flow

```
Grade 9 + "Foundation-9"
    ↓ (parseGrade)
Is Foundation? Yes
    ↓ (getBatchForStudent)
Find batch: 9th-foundation
    ↓ (get batch_subjects)
Get subjects: [P, C, M, B, S, E]
    ↓ (filter allowed vs available)
Show subjects: [Physics, Chemistry, Math, Biology, Science, English]
```

---

## 📁 Files to Know

| File | Purpose |
|------|---------|
| `batchConfig.ts` | All batch/subject logic |
| `StudyNowPage.tsx` | Main study interface (updated) |
| `TestPage.tsx` | Test creation (updated) |

---

## 🔧 Important Functions

```typescript
// Get batch with subjects
const batch = await getBatchForStudent(userId, grade, exam);

// Get allowed subjects for exam
const allowed = getAllowedSubjects('Foundation-9');
// → ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Science', 'English']

// Filter to show only available subjects
const shown = getFilteredSubjects('Foundation-9', batch.subjects);
```

---

## 📊 Subject Rules

| Exam | Subjects |
|------|----------|
| Foundation (6-10) | Physics, Chemistry, Math, Biology, Science, English |
| JEE (11-12) | Physics, Chemistry, Mathematics |
| NEET (11-12) | Physics, Chemistry, Biology |
| Scholarship | Math, Science, Mental Ability, English |

---

## ✅ useEffect Dependencies

```typescript
// Watch these 3 fields - auto-reload when any change
useEffect(() => {
  fetchSubjects();
}, [profile?.target_exam, profile?.grade, profile?.batch_id]);
```

---

## 🐛 Debug It

Open console and look for:
```
BATCH_CONFIG [fetchSubjects]
  grade: 9
  targetExam: "Foundation-9"
  batchFound: true
  subjects: ["Physics", "Chemistry", ...]
```

---

## 🚀 Add New Exam Type

1. Add to `SUBJECT_CONFIG` in batchConfig.ts:
```typescript
'My-Exam': ['Physics', 'Chemistry', 'Math']
```
2. Create batch in database
3. Map subjects in batch_subjects
4. Done! ✨

---

## 📝 Student Changes Goal

```
BEFORE: grade=11, target="JEE"
  Shown: Physics, Chemistry, Mathematics

CHANGE: target="NEET"

AFTER: grade=11, target="NEET"
  Shown: Physics, Chemistry, Biology
  
Time: <1 second (auto-update!)
```

---

## 📚 Full Documentation

- `GRADE_TARGETEXAM_BATCH_SUBJECTS_ARCHITECTURE.md` - Deep dive
- `VISUAL_FLOW_GUIDE.md` - Diagrams and flows
- `GRADE_BATCH_IMPLEMENTATION_SUMMARY.md` - Summary

---

## ✨ Status

✅ Build passing  
✅ 0 TypeScript errors  
✅ 0 ESLint blocking errors  
✅ Production ready  

