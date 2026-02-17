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

async function syncQuestions() {
  console.log('Fetching chapters and topics...');
  
  const { data: chapters, error: chapError } = await supabase
    .from('chapters')
    .select('id, subject, chapter_name');
    
  const { data: topics, error: topError } = await supabase
    .from('topics')
    .select('id, chapter_id, topic_name');
    
  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('id, exam, subject, chapter, topic')
    .order('created_at', { ascending: false });

  if (chapError || topError ||  qError) {
    console.error('Fetch errors:', { chapError, topError, qError });
    return;
  }

  console.log(`Found ${chapters.length} chapters, ${topics.length} topics, ${questions.length} questions\n`);

  // For each question, find matching chapter_id and topic_id
  const updates = [];
  
  for (const q of questions) {
    const chapter = chapters.find(c => 
      c.chapter_name === q.chapter && c.subject === q.subject
    );
    
    if (!chapter) {
      console.log(`⚠️  Q${questions.indexOf(q) + 1}: No chapter match for "${q.subject} | ${q.chapter}"`);
      continue;
    }
    
    const topic = q.topic ? topics.find(t => 
      t.chapter_id === chapter.id && t.topic_name === q.topic
    ) : null;
    
    updates.push({
      id: q.id,
      chapter_id: chapter.id,
      topic_id: topic?.id || null,
      status: topic ? '✓' : '⚠️ (topic not found)'
    });
  }

  console.log('\nUpdates to apply:');
  updates.forEach(u => {
    console.log(`  ${u.status} Q ID: ${u.id.substring(0, 8)}... → chapter_id: ${u.chapter_id.substring(0, 8)}..., topic_id: ${u.topic_id ? u.topic_id.substring(0, 8) + '...' : 'NULL'}`);
  });

  // Apply updates
  console.log(`\nApplying ${updates.length} updates... `);
  
  let successCount = 0;
  for (const update of updates) {
    const { error } = await supabase
      .from('questions')
      .update({
        chapter_id: update.chapter_id,
        topic_id: update.topic_id
      })
      .eq('id', update.id);
      
    if (error) {
      console.error(`  ❌ Failed to update Q ${update.id.substring(0, 8)}: ${error.message}`);
    } else {
      successCount++;
    }
  }

  console.log(`\n✓ Successfully synced ${successCount}/${updates.length} questions`);
  console.log('\nVerifying...');
  
  const { data: verified } = await supabase
    .from('questions')
    .select('id, chapter_id, topic_id')
    .order('created_at', { ascending: false });
    
  const complete = verified.filter(q => q.chapter_id).length;
  const withTopics = verified.filter(q => q.topic_id).length;
  
  console.log(`  Questions with chapter_id: ${complete}/${verified.length}`);
  console.log(`  Questions with topic_id: ${withTopics}/${verified.length}`);
}

syncQuestions();
