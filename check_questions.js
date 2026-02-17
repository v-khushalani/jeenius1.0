import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Load .env.production
const envContent = fs.readFileSync('.env.production', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    let value = valueParts.join('=').trim();
    // Remove quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env variables:', { url: !!supabaseUrl, key: !!supabaseKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuestions() {
  const { data, error } = await supabase
    .from('questions')
    .select('id, exam, subject, chapter, difficulty, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total questions:', data.length);
  console.log('\nQuestions by exam type:');
  const grouped = {};
  data.forEach(q => {
    const exam = q.exam || 'NULL';
    if (!grouped[exam]) grouped[exam] = [];
    grouped[exam].push(q);
  });

  Object.entries(grouped).forEach(([exam, questions]) => {
    console.log(`\n${exam}: ${questions.length} questions`);
    questions.forEach(q => {
      console.log(`  - ${q.id.substring(0, 8)}... | ${q.subject} | ${q.chapter} | ${q.difficulty}`);
    });
  });
}

checkQuestions();
