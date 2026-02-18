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

async function check() {
  // Check all data tables
  const { data: batches } = await supabase.from('batches').select('*');
  const { data: chapters } = await supabase.from('chapters').select('*');
  const { data: topics } = await supabase.from('topics').select('*');
  const { data: questions } = await supabase.from('questions').select('id, exam, subject, chapter, topic');

  console.log('=== DATABASE STATE ===\n');
  console.log(`Batches: ${batches?.length || 0}`);
  batches?.slice(0, 3).forEach(b => {
    console.log(`  - ${b.name} (${b.exam_type}, Grade ${b.grade})`);
  });

  console.log(`\nChapters: ${chapters?.length || 0}`);
  chapters?.slice(0, 3).forEach(c => {
    console.log(`  - ${c.subject} / ${c.chapter_name} (ID: ${c.id})`);
  });

  console.log(`\nTopics: ${topics?.length || 0}`);
  topics?.slice(0, 3).forEach(t => {
    console.log(`  - Topic: ${t.topic_name} (chapter_id: ${t.chapter_id})`);
  });

  console.log(`\nQuestions: ${questions?.length || 0}`);
  const questionNeedsChapter = questions?.map(q => `${q.subject}/${q.chapter}`).filter((v, i, a) => a.indexOf(v) === i);
  console.log('Unique question chapters needed:');
  questionNeedsChapter?.forEach(qc => {
    console.log(`  - ${qc}`);
  });

  const uniqueTopics = questions?.map(q => `${q.chapter}/${q.topic}`).filter((v, i, a) => a.indexOf(v) === i);
  console.log('\nUnique question topics needed:');
  uniqueTopics?.forEach(qt => {
    console.log(`  - ${qt}`);
  });
}

check();
