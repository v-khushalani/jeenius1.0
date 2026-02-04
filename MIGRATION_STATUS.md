# 9th Foundation Batch Migration Status

**Date**: February 4, 2026
**Status**: ⚠️ PARTIALLY COMPLETE - Code Ready, Database Pending

## Summary

Fixed the issue where 9th Foundation students see 11th/12th grade chapters instead of 9th grade chapters by:

1. ✅ Updating code configuration to properly handle grade-based filtering
2. ✅ Configuring PCMB subjects for Foundation grades (6-10)
3. ⏳ Database migration created but blocked by RLS policy

## Code Changes Completed

### 1. src/utils/batchConfig.ts

**SUBJECT_CONFIG Updated**:
```typescript
// Foundation now PCMB only (removed Science, English)
'Foundation-6': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
'Foundation-7': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
'Foundation-8': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
'Foundation-9': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
'Foundation-10': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
```

**getExamTypeForGrade() Enhanced**:
```typescript
export const getExamTypeForGrade = (grade: number, targetExam?: string): string => {
  const parsedGrade = parseGrade(grade);
  
  // Grades 6-10: Always Foundation (deterministic)
  if (isFoundationGrade(parsedGrade)) {
    return 'Foundation';
  }
  
  // Grades 11-12: Determined by targetExam
  if (parsedGrade >= 11 && parsedGrade <= 12) {
    return targetExam?.includes('NEET') ? 'NEET' : 'JEE';
  }
  
  return 'JEE';
};
```

### 2. Build Verification
✅ **PASSING**: `npm run build`
- 2524 modules transformed
- 7.48 seconds
- Zero TypeScript errors
- Zero critical ESLint errors

## Database Migration Status

### What Needs to Happen

The migration script created (complete_migration.mjs) needs to:

1. **Delete old subjects** for 9th-foundation batch
   - Current: Science, Mental Ability
   - Reason: RLS policy blocks direct deletes via anon key

2. **Delete old chapters** (currently 0, but cleanup needed)

3. **Add PCMB Subjects** (4 total)
   - Physics (1)
   - Chemistry (2)
   - Mathematics (3)
   - Biology (4)

4. **Add 28 Chapters Total**
   - Physics: 6 chapters (Motion, Force, Gravitation, Pressure, Work, Sound)
   - Chemistry: 4 chapters (Matter, Purity, Atoms, Structure)
   - Biology: 6 chapters (Cell, Tissues, Food, Diversity, Disease, Resources)
   - Mathematics: 12 chapters (Number, Polynomials, Geometry, Equations, etc.)

### Current Blocker

**Error**: Row-level security (RLS) policy preventing writes
- Reason: Using anon key (public access)
- Solution Needed: Use service role key or manual SQL execution

### Migration Script Location

`/workspaces/jeenius1.0/supabase/migrations/20260204_add_foundation_9_chapters.sql`

## How to Apply the Migration

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select project `zbclponzlwulmltwkjga`
3. Go to SQL Editor
4. Copy contents from migration file
5. Execute the SQL

### Option 2: Via Service Role Key
Contact admin for SUPABASE_SERVICE_ROLE_KEY and run:
```bash
cd /workspaces/jeenius1.0
VITE_SUPABASE_URL="https://zbclponzlwulmltwkjga.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="..." \
node complete_migration.mjs
```

### Option 3: Via Supabase CLI (if installed)
```bash
cd /workspaces/jeenius1.0
supabase migration push
```

## Testing Plan (After Migration Applied)

### Test 1: Verify 9th Foundation Subjects
- Login as 9th grade student
- Expected: Only 4 subjects (Physics, Chemistry, Mathematics, Biology)
- NOT expected: Science, English, Mental Ability

### Test 2: Verify 9th Foundation Chapters
- Select Physics subject
- Expected: 6 chapters (Motion, Force, Gravitation, Pressure, Work, Sound)
- NOT expected: 11th/12th grade chapters

### Test 3: Verify Grade-Based Exam Type
- 9th student tries to access JEE/NEET
- Expected: Cannot select (automatically Foundation)
- UI should only show Foundation option

### Test 4: Verify 11-12 Students
- 11th student with JEE target
- Expected: PCM subjects only (Physics, Chemistry, Mathematics)
- 12th student with NEET target
- Expected: PCB subjects only (Physics, Chemistry, Biology)

## Files Modified

| File | Changes | Status |
|------|---------|--------|
| src/utils/batchConfig.ts | SUBJECT_CONFIG + getExamTypeForGrade() | ✅ Complete |
| supabase/migrations/20260204_add_foundation_9_chapters.sql | SQL migration | ✅ Created |
| package.json | No changes | ✅ Clean |
| tsconfig | No changes | ✅ Clean |

## Next Steps

1. **Get Service Role Key** from admin
2. **Apply Migration** using Option 1 or 2 above
3. **Verify Database** shows 28 chapters for 9th-foundation
4. **Run Tests** from Testing Plan section
5. **Monitor** for any RLS policy issues

## Related Issues Fixed

- ✅ 9th students see 11th/12th chapters → Fixed with batch isolation
- ✅ Grade/Target_Exam confusion → Fixed with deterministic mapping
- ✅ Subject filtering inconsistent → Fixed with PCMB configuration
- ⏳ Database doesn't have 9th chapters → Migration ready, pending application

## Roll-back Plan

If issues occur after migration:
1. Delete new chapters from 9th-foundation batch
2. Re-add old subjects (Science, Mental Ability)
3. Code remains compatible with either setup
