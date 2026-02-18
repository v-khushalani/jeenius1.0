#!/usr/bin/env node

/**
 * AUTOMATIC SETUP - Calls Postgres function to setup chapters and topics
 * Run: npm run setup:chapters
 */

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

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║      AUTOMATIC SETUP: Creating Chapters and Topics        ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function setupChapters() {
  try {
    console.log('🚀 Calling setup function...\n');

    // Call the Postgres function
    const { data, error } = await supabase.rpc('setup_jee_chapters_and_topics');

    if (error) {
      console.error('❌ Error:', error.message);
      if (error.message.includes('does not exist')) {
        console.error('\n⚠️  Function not found. Migration may not have been applied yet.');
        console.error('   Steps to apply migration:');
        console.error('   1. Go to Supabase Dashboard');
        console.error('   2. Go to SQL Editor');
        console.error('   3. Create new query and paste content of:');
        console.error('      supabase/migrations/20260217_create_setup_function.sql');
        console.error('   4. Run the query');
        console.error('   5. Then run this script again\n');
      }
      return;
    }

    if (!data?.success) {
      console.error('❌ Setup failed:', data?.error);
      return;
    }

    console.log('✅ Setup completed successfully!\n');
    console.log('📊 Results:');
    console.log(`  ✓ JEE Batch ID: ${data.jee_batch_id.substring(0, 8)}...`);
    console.log(`  ✓ Chemical Bonding Chapter: ${data.cb_chapter_id.substring(0, 8)}...`);
    console.log(`  ✓ p-Block Elements Chapter: ${data.pb_chapter_id.substring(0, 8)}...`);
    console.log(`  ✓ Questions synchronized: ${data.questions_synced}\n`);

    // Verify
    console.log('🔍 Verifying setup...\n');
    const { data: chapters } = await supabase.from('chapters').select('count');
    const { data: topics } = await supabase.from('topics').select('count');
    const { data: questions } = await supabase
      .from('questions')
      .select('id, chapter_id, topic_id');

    const linkedQuestions = questions.filter(q => q.chapter_id && q.topic_id).length;

    console.log(`  Chapters created: ${chapters?.length || 0}`);
    console.log(`  Topics created: ${topics?.length || 0}`);
    console.log(`  Questions linked: ${linkedQuestions}/${questions.length}\n`);

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('🎉 All done! Your questions are now properly organized!\n');
    console.log('Next steps:');
    console.log('  1. Refresh your admin panel');
    console.log('  2. Go to Question Manager');
    console.log('  3. All 13 questions should now appear\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupChapters();
