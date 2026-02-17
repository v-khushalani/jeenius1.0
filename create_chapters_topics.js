import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envContent = fs.readFileSync('.env.production', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  let [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    let value = valueParts.join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key.trim()] = value;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function setupChaptersAndTopics() {
  console.log('Finding or creating JEE batches...\n');

  // Get or find JEE batches
  const { data: batches } = await supabase.from('batches').select('*').ilike('name', '%JEE%').or('exam_type.eq.jee');
  
  let jeeBatch = batches?.find(b => b.exam_type === 'jee');
  
  if (!jeeBatch) {
    console.log('Creating JEE batch...');
    // Create JEE batch if it doesn't exist
    const { data, error } = await supabase.from('batches').insert([{
      name: 'JEE Main & Advanced',
      exam_type: 'jee',
      grade: 12
    }]).select();
    
    if (error) {
      console.error('Error creating JEE batch:', error);
      return;
    }
    jeeBatch = data[0];
  }

  console.log(`Using JEE batch: ${jeeBatch.name} (ID: ${jeeBatch.id})\n`);

  // Create chapters
  const chapters = [
    { subject: 'Chemistry', chapter_name: 'Chemical Bonding', chapter_number: 4, batch_id: jeeBatch.id },
    { subject: 'Chemistry', chapter_name: 'p-Block Elements', chapter_number: 6, batch_id: jeeBatch.id }
  ];

  console.log('Creating chapters...');
  const chapterMap = {};
  
  for (const ch of chapters) {
    const { data, error } = await supabase
      .from('chapters')
      .insert([ch])
      .select();
    
    if (error) {
      console.error(`Error creating chapter ${ch.chapter_name}:`, error);
      return;
    }
    
    chapterMap[ch.chapter_name] = data[0].id;
    console.log(`  ✓ ${ch.subject} / ${ch.chapter_name}`);
  }

  // Create topics
  const topics = [
    { chapter_id: chapterMap['Chemical Bonding'], topic_name: 'Valence Bond Theory (VBT)', order_index: 1 },
    { chapter_id: chapterMap['Chemical Bonding'], topic_name: 'Molecular Orbital Theory (MOT)', order_index: 2 },
    { chapter_id: chapterMap['p-Block Elements'], topic_name: 'Group 17 Elements', order_index: 1 },
    { chapter_id: chapterMap['p-Block Elements'], topic_name: 'Group 18 Elements', order_index: 2 }
  ];

  console.log('\nCreating topics...');
  const topicMap = {};
  
  for (const tp of topics) {
    const { data, error } = await supabase
      .from('topics')
      .insert([tp])
      .select();
    
    if (error) {
      console.error(`Error creating topic ${tp.topic_name}:`, error);
      return;
    }
    
    topicMap[tp.topic_name] = data[0].id;
    console.log(`  ✓ ${tp.topic_name}`);
  }

  // Now sync questions with these chapters and topics
  console.log('\nSyncing questions with chapters and topics...');
  
  const { data: questions } = await supabase
    .from('questions')
    .select('id, chapter, topic');

  let syncCount = 0;
  for (const q of questions) {
    const chapterId = chapterMap[q.chapter];
    const topicId = topicMap[q.topic];
    
    if (chapterId && topicId) {
      const { error } = await supabase
        .from('questions')
        .update({ chapter_id: chapterId, topic_id: topicId })
        .eq('id', q.id);
      
      if (error) {
        console.error(`Error updating question ${q.id}:`, error);
      } else {
        syncCount++;
      }
    }
  }

  console.log(`  ✓ Synced ${syncCount} questions\n`);

  // Verify
  const { data: verifyChapters } = await supabase.from('chapters').select('count');
  const { data: verifyTopics } = await supabase.from('topics').select('count');
  const { data: verifyQuestions } = await supabase
    .from('questions')
    .select('id, chapter_id, topic_id');

  const questionsWithLinks = verifyQuestions.filter(q => q.chapter_id && q.topic_id).length;

  console.log('=== VERIFICATION ===');
  console.log(`Chapters: ${verifyChapters?.length || 0}`);
  console.log(`Topics: ${verifyTopics?.length || 0}`);
  console.log(`Questions with chapter_id: ${verifyQuestions.filter(q => q.chapter_id).length}/${verifyQuestions.length}`);
  console.log(`Questions with topic_id: ${verifyQuestions.filter(q => q.topic_id).length}/${verifyQuestions.length}`);
  console.log(`Questions fully linked: ${questionsWithLinks}/${verifyQuestions.length}`);
}

setupChaptersAndTopics();
