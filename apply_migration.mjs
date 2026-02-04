import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('📝 Applying migration for 9th Foundation chapters...\n');

    // 1. Ensure 9th Foundation batch exists
    console.log('Step 1: Checking/creating 9th-foundation batch...');
    const { data: existingBatch } = await supabase
      .from('batches')
      .select('id, name, slug')
      .eq('slug', '9th-foundation')
      .single();

    let batchId;
    if (existingBatch) {
      console.log(`  ✓ Batch exists: ${existingBatch.name}`);
      batchId = existingBatch.id;
    } else {
      const { data: newBatch, error: batchError } = await supabase
        .from('batches')
        .insert({
          name: '9th Foundation',
          slug: '9th-foundation',
          exam_type: 'Foundation',
          grade: 9,
          description: 'Class 9 NCERT Curriculum - Physics, Chemistry, Mathematics, Biology',
          display_order: 23,
          is_active: true
        })
        .select()
        .single();

      if (batchError) {
        console.error('  ❌ Error creating batch:', batchError.message);
        return false;
      }
      console.log(`  ✓ Created batch: ${newBatch.name}`);
      batchId = newBatch.id;
    }

    // 2. Add batch subjects (PCMB)
    console.log('\nStep 2: Adding subjects (Physics, Chemistry, Mathematics, Biology)...');
    const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
    const { error: subjectError } = await supabase
      .from('batch_subjects')
      .upsert(
        subjects.map((subject, index) => ({
          batch_id: batchId,
          subject,
          display_order: index + 1
        })),
        { onConflict: 'batch_id,subject' }
      );

    if (subjectError) {
      console.error('  ❌ Error adding subjects:', subjectError.message);
      return false;
    }
    console.log(`  ✓ Added ${subjects.length} subjects`);

    // 3. Add Physics chapters
    console.log('\nStep 3: Adding Physics chapters (6)...');
    const physicsChapters = [
      'Motion',
      'Force and Laws of Motion',
      'Gravitation',
      'Pressure',
      'Work and Energy',
      'Sound'
    ];

    const { error: physicsError } = await supabase
      .from('chapters')
      .upsert(
        physicsChapters.map((chapter, index) => ({
          batch_id: batchId,
          subject: 'Physics',
          chapter_name: chapter,
          chapter_number: index + 1
        })),
        { onConflict: 'batch_id,subject,chapter_name' }
      );

    if (physicsError) {
      console.error('  ❌ Error adding Physics chapters:', physicsError.message);
      return false;
    }
    console.log(`  ✓ Added ${physicsChapters.length} Physics chapters`);

    // 4. Add Chemistry chapters
    console.log('\nStep 4: Adding Chemistry chapters (4)...');
    const chemistryChapters = [
      'Matter in Our Surroundings',
      'Is Matter Around Us Pure?',
      'Atoms and Molecules',
      'Structure of the Atom'
    ];

    const { error: chemError } = await supabase
      .from('chapters')
      .upsert(
        chemistryChapters.map((chapter, index) => ({
          batch_id: batchId,
          subject: 'Chemistry',
          chapter_name: chapter,
          chapter_number: index + 1
        })),
        { onConflict: 'batch_id,subject,chapter_name' }
      );

    if (chemError) {
      console.error('  ❌ Error adding Chemistry chapters:', chemError.message);
      return false;
    }
    console.log(`  ✓ Added ${chemistryChapters.length} Chemistry chapters`);

    // 5. Add Biology chapters
    console.log('\nStep 5: Adding Biology chapters (6)...');
    const biologyChapters = [
      'Cell - The Fundamental Unit of Life',
      'Tissues',
      'Improvement in Food Resources',
      'Diversity in Living Organisms',
      'Why Do We Fall Ill?',
      'Natural Resources'
    ];

    const { error: bioError } = await supabase
      .from('chapters')
      .upsert(
        biologyChapters.map((chapter, index) => ({
          batch_id: batchId,
          subject: 'Biology',
          chapter_name: chapter,
          chapter_number: index + 1
        })),
        { onConflict: 'batch_id,subject,chapter_name' }
      );

    if (bioError) {
      console.error('  ❌ Error adding Biology chapters:', bioError.message);
      return false;
    }
    console.log(`  ✓ Added ${biologyChapters.length} Biology chapters`);

    // 6. Add Mathematics chapters
    console.log('\nStep 6: Adding Mathematics chapters (12)...');
    const mathChapters = [
      'Number Systems',
      'Polynomials',
      'Coordinate Geometry',
      'Linear Equations in Two Variables',
      'Introduction to Euclid\'s Geometry',
      'Lines and Angles',
      'Triangles',
      'Quadrilaterals',
      'Circles',
      'Heron\'s Formula',
      'Surface Areas and Volumes',
      'Statistics'
    ];

    const { error: mathError } = await supabase
      .from('chapters')
      .upsert(
        mathChapters.map((chapter, index) => ({
          batch_id: batchId,
          subject: 'Mathematics',
          chapter_name: chapter,
          chapter_number: index + 1
        })),
        { onConflict: 'batch_id,subject,chapter_name' }
      );

    if (mathError) {
      console.error('  ❌ Error adding Mathematics chapters:', mathError.message);
      return false;
    }
    console.log(`  ✓ Added ${mathChapters.length} Mathematics chapters`);

    console.log('\n✅ Migration applied successfully!\n');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

const success = await applyMigration();
process.exit(success ? 0 : 1);
