import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zbclponzlwulmltwkjga.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiY2xwb256bHd1bG1sdHdramdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMTM2OTYsImV4cCI6MjA3Njc4OTY5Nn0.uifGRs6sXTnKKczrLvKLv9mJ-ROPn1eGMM1ewEZQAb0'
);

// Check batch
const { data: batch } = await supabase.from('batches').select('*').eq('slug', '9th-foundation').single();
console.log('Batch:', batch);

// Check subjects
const { data: subjects } = await supabase.from('batch_subjects').select('*').eq('batch_id', batch?.id);
console.log('\nSubjects:', subjects);

// Check chapters
const { data: chapters } = await supabase.from('chapters').select('*').eq('batch_id', batch?.id);
console.log('\nChapters count:', chapters?.length);
if (chapters && chapters.length > 0) {
  console.log('Sample chapters:', chapters.slice(0, 3));
}
