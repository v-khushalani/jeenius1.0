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

async function checkQuestions() {
  const { data, error } = await supabase
    .from('questions')
    .select('id, exam, subject, chapter, topic, question, chapter_id, topic_id')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total questions:', data.length);
  console.log('\nDetailed check for null/missing fields:\n');
  
  data.forEach((q, idx) => {
    const nullFields = [];
    if (!q.question) nullFields.push('question');
    if (!q.subject) nullFields.push('subject');
    if (!q.chapter) nullFields.push('chapter');
    if (!q.topic) nullFields.push('topic');
    if (!q.exam) nullFields.push('exam');
    if (!q.chapter_id) nullFields.push('chapter_id');
    if (!q.topic_id) nullFields.push('topic_id');
    
    const status = nullFields.length > 0 ? `⚠️  MISSING [${nullFields.join(', ')}]` : '✓ Complete';
    console.log(`Q${idx + 1}: ${q.subject} | ${q.chapter} | ${q.topic || 'no-topic'} | ${status}`);
  });

  console.log('\n  Summary:');
  console.log(`  exam='JEE': ${data.filter(q => q.exam === 'JEE').length}`);
  console.log(`  exam='NEET': ${data.filter(q => q.exam === 'NEET').length}`);
  console.log(`  subject='Chemistry': ${data.filter(q => q.subject === 'Chemistry').length}`);
  console.log(`  Has chapter_id: ${data.filter(q => q.chapter_id).length}`);
  console.log(`  Has topic_id: ${data.filter(q => q.topic_id).length}`);
  console.log(`  Has topic field: ${data.filter(q => q.topic).length}`);
}

checkQuestions();
