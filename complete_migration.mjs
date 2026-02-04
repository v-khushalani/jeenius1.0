import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zbclponzlwulmltwkjga.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiY2xwb256bHd1bG1sdHdramdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMTM2OTYsImV4cCI6MjA3Njc4OTY5Nn0.uifGRs6sXTnKKczrLvKLv9mJ-ROPn1eGMM1ewEZQAb0'
);

async function runMigration() {
  try {
    console.log('📝 Complete migration for 9th Foundation batch...\n');

    // Get the batch
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('id')
      .eq('slug', '9th-foundation')
      .single();

    if (batchError || !batch) {
      console.error('❌ Cannot find 9th-foundation batch');
      return false;
    }

    const batchId = batch.id;
    console.log(`✓ Found batch: ${batchId}\n`);

    // Step 1: Delete old subjects for this batch
    console.log('Step 1: Removing old subjects...');
    const { error: deleteSubjectsError } = await supabase
      .from('batch_subjects')
      .delete()
      .eq('batch_id', batchId);

    if (deleteSubjectsError) {
      console.error('  ❌ Error deleting old subjects:', deleteSubjectsError.message);
      return false;
    }
    console.log('  ✓ Old subjects removed');

    // Step 2: Delete old chapters for this batch
    console.log('\nStep 2: Removing old chapters...');
    const { error: deleteChaptersError } = await supabase
      .from('chapters')
      .delete()
      .eq('batch_id', batchId);

    if (deleteChaptersError) {
      console.error('  ❌ Error deleting old chapters:', deleteChaptersError.message);
      return false;
    }
    console.log('  ✓ Old chapters removed');

    // Step 3: Add PCMB subjects
    console.log('\nStep 3: Adding PCMB subjects (Physics, Chemistry, Mathematics, Biology)...');
    const subjects = [
      { subject: 'Physics', display_order: 1 },
      { subject: 'Chemistry', display_order: 2 },
      { subject: 'Mathematics', display_order: 3 },
      { subject: 'Biology', display_order: 4 }
    ];

    const { error: subjectsError } = await supabase
      .from('batch_subjects')
      .insert(subjects.map(s => ({ ...s, batch_id: batchId })));

    if (subjectsError) {
      console.error('  ❌ Error adding subjects:', subjectsError.message);
      return false;
    }
    console.log(`  ✓ Added ${subjects.length} subjects`);

    // Step 4: Add all 28 chapters
    console.log('\nStep 4: Adding 28 chapters...');
    
    const chapters = [
      // Physics (6)
      { subject: 'Physics', chapter_name: 'Motion', chapter_number: 1 },
      { subject: 'Physics', chapter_name: 'Force and Laws of Motion', chapter_number: 2 },
      { subject: 'Physics', chapter_name: 'Gravitation', chapter_number: 3 },
      { subject: 'Physics', chapter_name: 'Pressure', chapter_number: 4 },
      { subject: 'Physics', chapter_name: 'Work and Energy', chapter_number: 5 },
      { subject: 'Physics', chapter_name: 'Sound', chapter_number: 6 },
      // Chemistry (4)
      { subject: 'Chemistry', chapter_name: 'Matter in Our Surroundings', chapter_number: 1 },
      { subject: 'Chemistry', chapter_name: 'Is Matter Around Us Pure?', chapter_number: 2 },
      { subject: 'Chemistry', chapter_name: 'Atoms and Molecules', chapter_number: 3 },
      { subject: 'Chemistry', chapter_name: 'Structure of the Atom', chapter_number: 4 },
      // Biology (6)
      { subject: 'Biology', chapter_name: 'Cell - The Fundamental Unit of Life', chapter_number: 1 },
      { subject: 'Biology', chapter_name: 'Tissues', chapter_number: 2 },
      { subject: 'Biology', chapter_name: 'Improvement in Food Resources', chapter_number: 3 },
      { subject: 'Biology', chapter_name: 'Diversity in Living Organisms', chapter_number: 4 },
      { subject: 'Biology', chapter_name: 'Why Do We Fall Ill?', chapter_number: 5 },
      { subject: 'Biology', chapter_name: 'Natural Resources', chapter_number: 6 },
      // Mathematics (12)
      { subject: 'Mathematics', chapter_name: 'Number Systems', chapter_number: 1 },
      { subject: 'Mathematics', chapter_name: 'Polynomials', chapter_number: 2 },
      { subject: 'Mathematics', chapter_name: 'Coordinate Geometry', chapter_number: 3 },
      { subject: 'Mathematics', chapter_name: 'Linear Equations in Two Variables', chapter_number: 4 },
      { subject: 'Mathematics', chapter_name: 'Introduction to Euclid\'s Geometry', chapter_number: 5 },
      { subject: 'Mathematics', chapter_name: 'Lines and Angles', chapter_number: 6 },
      { subject: 'Mathematics', chapter_name: 'Triangles', chapter_number: 7 },
      { subject: 'Mathematics', chapter_name: 'Quadrilaterals', chapter_number: 8 },
      { subject: 'Mathematics', chapter_name: 'Circles', chapter_number: 9 },
      { subject: 'Mathematics', chapter_name: 'Heron\'s Formula', chapter_number: 10 },
      { subject: 'Mathematics', chapter_name: 'Surface Areas and Volumes', chapter_number: 11 },
      { subject: 'Mathematics', chapter_name: 'Statistics', chapter_number: 12 }
    ];

    const { error: chaptersError } = await supabase
      .from('chapters')
      .insert(chapters.map(ch => ({ ...ch, batch_id: batchId })));

    if (chaptersError) {
      console.error('  ❌ Error adding chapters:', chaptersError.message);
      return false;
    }
    console.log(`  ✓ Added ${chapters.length} chapters`);

    // Step 5: Verify
    console.log('\nStep 5: Verifying...');
    const { data: finalSubjects } = await supabase
      .from('batch_subjects')
      .select('subject')
      .eq('batch_id', batchId);

    const { data: finalChapters } = await supabase
      .from('chapters')
      .select('subject, chapter_number')
      .eq('batch_id', batchId)
      .order('subject, chapter_number');

    console.log(`  ✓ Subjects: ${finalSubjects?.map(s => s.subject).join(', ')}`);
    
    // Count by subject
    const countBySubject = {};
    finalChapters?.forEach(ch => {
      countBySubject[ch.subject] = (countBySubject[ch.subject] || 0) + 1;
    });
    
    console.log(`  ✓ Chapters by subject:`);
    Object.entries(countBySubject).forEach(([subj, count]) => {
      console.log(`    - ${subj}: ${count}`);
    });

    console.log('\n✅ Migration completed successfully!\n');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

const success = await runMigration();
process.exit(success ? 0 : 1);
