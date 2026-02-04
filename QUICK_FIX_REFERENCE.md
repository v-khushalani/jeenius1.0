# Quick Fix Reference - 9th Foundation Batch Issue

## Problem
9th Foundation students see 11th/12th grade chapters instead of 9th grade chapters.

## Root Cause
- 9th-foundation batch exists in database but has 0 chapters
- Batch has old subjects (Science, Mental Ability) instead of PCMB

## Solution Status
✅ **CODE**: 100% complete and tested (build passing)
⏳ **DATABASE**: Migration created, awaiting application

## What Changed in Code

### src/utils/batchConfig.ts

**Before:**
```typescript
'Foundation-9': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Science', 'English']
```

**After:**
```typescript
'Foundation-9': ['Physics', 'Chemistry', 'Mathematics', 'Biology']
```

**Plus:** Enhanced `getExamTypeForGrade()` to make grades 6-10 always Foundation (not selectable).

## Files to Apply

### Option A: Via Supabase Dashboard (EASIEST)
1. Open https://app.supabase.com
2. Select project `zbclponzlwulmltwkjga`
3. Go to **SQL Editor**
4. Copy & paste: [`supabase/migrations/20260204_add_foundation_9_chapters.sql`](supabase/migrations/20260204_add_foundation_9_chapters.sql)
5. Click **Execute**

### Option B: Via Service Role Key
```bash
cd /workspaces/jeenius1.0
# Need: SUPABASE_SERVICE_ROLE_KEY from admin
SUPABASE_SERVICE_ROLE_KEY="..." node complete_migration.mjs
```

## Migration Will:
- Update 9th-foundation batch subjects → PCMB
- Add 28 chapters:
  - Physics: 6
  - Chemistry: 4
  - Biology: 6
  - Mathematics: 12

## After Migration - Expected Behavior

| Grade | Exam Type | Subjects | Can Select JEE/NEET? |
|-------|-----------|----------|-----|
| 9 | Foundation | PCMB | ❌ No (auto Foundation) |
| 10 | Foundation | PCMB | ❌ No (auto Foundation) |
| 11 | JEE/NEET | PCM/PCB | ✅ Yes |
| 12 | JEE/NEET | PCM/PCB | ✅ Yes |

## Quick Verification

**Before Migration:**
- 9th student sees: 11th/12th chapters, old subjects (Science, etc.)

**After Migration:**
- 9th student sees: 9th chapters only, PCMB subjects
- Chapter 1 Physics: "Motion" (not "Kinematics" from 11th)

## Build Status
✅ PASSING - `npm run build` (2524 modules, 7.48s)

## Support
See `MIGRATION_STATUS.md` for complete guide and testing checklist.
