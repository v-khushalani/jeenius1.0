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

async function applyMigration() {
  console.log('Attempting to create chapters and topics via API...\n');

  try {
    // 1. Create/get JEE batch
    console.log('Step 1: Getting JEE batch...');
    let { data: batches } = await supabase
      .from('batches')
      .select('id')
      .eq('exam_type', 'jee')
      .eq('grade', 12)
      .limit(1);

    let jeeBatchId = batches?.[0]?.id;
    
    if (!jeeBatchId) {
      console.log('  JEE batch not found - trying to create one...');
      const { data, error } = await supabase
        .from('batches')
        .insert([{
          name: 'JEE Main + Advanced',
          exam_type: 'jee',
          grade: 12
        }])
        .select();
      
      if (error) throw error;
      jeeBatchId = data[0].id;
    }
    console.log(`  ✓ JEE batch ID: ${jeeBatchId}\n`);

    // 2. Create chapters
    console.log('Step 2: Creating chapters...');
    const chapters = [
      { batch_id: jeeBatchId, subject: 'Chemistry', chapter_name: 'Chemical Bonding', chapter_number: 4 },
      { batch_id: jeeBatchId, subject: 'Chemistry', chapter_name: 'p-Block Elements', chapter_number: 6 }
    ];

    const chapterIds = {};
    for (const ch of chapters) {
      const { data, error } = await supabase
        .from('chapters')
        .insert([ch])
        .select();
      
      if (error) {
        console.error(`  ❌ Error creating ${ch.chapter_name}:`, error.message);
        throw error;
      }
      chapterIds[ch.chapter_name] = data[0].id;
      console.log(`  ✓ ${ch.chapter_name}`);
    }

    // 3. Create topics
    console.log('\nStep 3: Creating topics...');
    const topics = [
      { chapter_id: chapterIds['Chemical Bonding'], topic_name: 'Valence Bond Theory (VBT)', order_index: 1 },
      { chapter_id: chapterIds['Chemical Bonding'], topic_name: 'Molecular Orbital Theory (MOT)', order_index: 2 },
      { chapter_id: chapterIds['p-Block Elements'], topic_name: 'Group 17 Elements', order_index: 1 },
      { chapter_id: chapterIds['p-Block Elements'], topic_name: 'Group 18 Elements', order_index: 2 }
    ];

    const topicIds = {};
    for (const tp of topics) {
      const { data, error } = await supabase
        .from('topics')
        .insert([tp])
        .select();
      
      if (error) {
        console.error(`  ❌ Error creating ${tp.topic_name}:`, error.message);
        throw error;
      }
      topicIds[tp.topic_name] = data[0].id;
      console.log(`  ✓ ${tp.topic_name}`);
    }

    // 4. Sync questions
    console.log('\nStep 4: Syncing questions to chapters and topics...');
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id, chapter, topic');

    if (qError) throw qError;

    let syncCount = 0;
    for (const q of questions) {
      const chapterId = chapterIds[q.chapter];
      const topicId = topicIds[q.topic];

      if (chapterId && topicId) {
        const { error: updateError } = await supabase
          .from('questions')
          .update({ chapter_id: chapterId, topic_id: topicId })
          .eq('id', q.id);

        if (updateError) {
          console.error(`  ❌ Error syncing question:`, updateError.message);
        } else {
          syncCount++;
        }
      }
    }
    console.log(`  ✓ Synced ${syncCount} questions\n`);

    // 5. Verify
    console.log('Step 5: Verifying...');
    const { data: verifyChapters } = await supabase.from('chapters').select('id');
    const { data: verifyTopics } = await supabase.from('topics').select('id');
    const { data: verifyQuestions } = await supabase
      .from('questions')
      .select('id, chapter_id, topic_id');

    const withChapter = verifyQuestions.filter(q => q.chapter_id).length;
    const withTopic = verifyQuestions.filter(q => q.topic_id).length;
    const fullLink = verifyQuestions.filter(q => q.chapter_id && q.topic_id).length;

    console.log(`  Chapters created: ${verifyChapters.length}`);
    console.log(`  Topics created: ${verifyTopics.length}`);
    console.log(`  Questions with chapter_id: ${withChapter}/${verifyQuestions.length}`);
    console.log(`  Questions with topic_id: ${withTopic}/${verifyQuestions.length}`);
    console.log(`  Questions fully linked: ${fullLink}/${verifyQuestions.length}`);

    if (fullLink === verifyQuestions.length) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Some questions not fully linked');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
  }
}

applyMigration();
