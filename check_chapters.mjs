import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bqvjkpfnfptaeqnhwfjk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdmprcGZuZnB0YWVxbmh3ZmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5MjA5OTAsImV4cCI6MjA1NDQ5Njk5MH0.jrSjNFzJBPcQkMM7541cdJMsVX_A9rULxXzWXTvYSpg'
);

async function checkChapters() {
  // Get all batches first
  const { data: batches, error: batchErr } = await supabase
    .from('batches')
    .select('id, name, exam_type, grade');
  
  if (batchErr) {
    console.log('Batch error:', batchErr.message);
    return;
  }
  
  console.log('=== All Batches ===');
  batches?.forEach(b => console.log(`${b.id}: ${b.name} (${b.exam_type} - Grade ${b.grade})`));
  
  const f9Batch = batches?.find(b => b.exam_type === 'Foundation' && b.grade === 9);
  console.log('\nFoundation-9 Batch:', f9Batch);
  
  // Get all chapters
  const { data: chapters, error: chapErr } = await supabase
    .from('chapters')
    .select('id, chapter_number, chapter_name, subject, batch_id')
    .order('subject')
    .order('chapter_number');
  
  if (chapErr) {
    console.log('Chapter error:', chapErr.message);
    return;
  }
  
  // Split by batch_id
  const jeeChapters = chapters?.filter(c => c.batch_id === null);
  const f9Chapters = chapters?.filter(c => c.batch_id === f9Batch?.id);
  
  console.log('\n=== JEE/NEET Chapters (batch_id = null) ===');
  console.log('Total:', jeeChapters?.length);
  jeeChapters?.forEach(c => {
    console.log(`[${c.chapter_number}] ${c.subject}: ${c.chapter_name} (ID: ${c.id})`);
  });
  
  console.log('\n=== Foundation-9 Chapters ===');
  console.log('Total:', f9Chapters?.length);
  f9Chapters?.forEach(c => {
    console.log(`[${c.chapter_number}] ${c.subject}: ${c.chapter_name} (ID: ${c.id})`);
  });
}

checkChapters();
