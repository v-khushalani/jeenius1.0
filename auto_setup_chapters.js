#!/usr/bin/env node

/**
 * AUTO-SETUP SCRIPT: Create Chapters, Topics, and Sync Questions
 * Run: node auto_setup_chapters.js
 * 
 * This script:
 * 1. Creates 2 JEE Chemistry chapters
 * 2. Creates 4 topics under those chapters
 * 3. Automatically syncs all 13 questions
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

// Try to get service role key from Supabase CLI config
let serviceRoleKey = env.SUPABASE_SERVICE_ROLE || env.SERVICE_ROLE_KEY;

// If not available, we'll use anon key but explain the limitation
const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║         AUTO-SETUP: Chapters & Topics Creation            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Use service role if available, otherwise admin verification
const supabase = serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey)
  : createClient(supabaseUrl, anonKey);

async function autoSetup() {
  try {
    console.log('📦 Step 1: Verifying JEE batch exists...\n');
    
    const { data: batches } = await supabase
      .from('batches')
      .select('id')
      .eq('exam_type', 'jee')
      .limit(1);

    let jeeBatchId = batches?.[0]?.id;
    
    if (!jeeBatchId) {
      console.log('Creating JEE batch...');
      const { data, error } = await supabase
        .from('batches')
        .insert([{
          name: 'JEE Main + Advanced',
          exam_type: 'jee',
          grade: 12
        }])
        .select();
      
      if (error) {
        console.error('Failed to create batch:', error.message);
        if (error.message.includes('row-level security')) {
          console.error('\n❌ RLS Policy Error: Need to use service role key');
          console.error('   Please apply migration via Supabase dashboard SQL editor');
          return;
        }
        throw error;
      }
      jeeBatchId = data[0].id;
    }
    
    console.log(`✅ JEE Batch: ${jeeBatchId}\n`);

    // Step 2: Create Chapters
    console.log('📚 Step 2: Creating chapters...\n');

    const chapters = [
      { batch_id: jeeBatchId, subject: 'Chemistry', chapter_name: 'Chemical Bonding', chapter_number: 4 },
      { batch_id: jeeBatchId, subject: 'Chemistry', chapter_name: 'p-Block Elements', chapter_number: 6 }
    ];

    const chapterIds = {};
    for (const ch of chapters) {
      try {
        const { data, error } = await supabase
          .from('chapters')
          .insert([ch])
          .select();
        
        if (error) {
          if (error.message.includes('row-level security')) {
            console.error(`⚠️  Cannot create ${ch.chapter_name} - RLS Policy blocked`);
            console.error('   You need to use Supabase Service Role Key\n');
            return;
          }
          throw error;
        }
        chapterIds[ch.chapter_name] = data[0].id;
        console.log(`  ✅ ${ch.chapter_name} (ID: ${data[0].id.substring(0, 8)}...)`);
      } catch (error) {
        console.error(`  ❌ Error:`, error.message);
        return;
      }
    }

    console.log();

    // Step 3: Create Topics
    console.log('🏷️  Step 3: Creating topics...\n');

    const topics = [
      { chapter_id: chapterIds['Chemical Bonding'], topic_name: 'Valence Bond Theory (VBT)', order_index: 1 },
      { chapter_id: chapterIds['Chemical Bonding'], topic_name: 'Molecular Orbital Theory (MOT)', order_index: 2 },
      { chapter_id: chapterIds['p-Block Elements'], topic_name: 'Group 17 Elements', order_index: 1 },
      { chapter_id: chapterIds['p-Block Elements'], topic_name: 'Group 18 Elements', order_index: 2 }
    ];

    for (const tp of topics) {
      try {
        const { data, error } = await supabase
          .from('topics')
          .insert([tp])
          .select();
        
        if (error) throw error;
        console.log(`  ✅ ${tp.topic_name}`);
      } catch (error) {
        console.error(`  ❌ Error:`, error.message);
        if (error.message.includes('row-level security')) {
          return;
        }
      }
    }

    console.log();

    // Step 4: Sync Questions
    console.log('🔗 Step 4: Syncing questions...\n');

    const { data: questions } = await supabase
      .from('questions')
      .select('id, chapter, topic');

    let syncCount = 0;
    for (const q of questions) {
      const chapterId = chapterIds[q.chapter];
      const topicId = Object.values(topics).find(t => t.chapter_id === chapterId && t.topic_name === q.topic)?.chapter_id;
      
      if (chapterId) {
        const topicData = topics.find(t => t.chapter_id === chapterId && t.topic_name === q.topic);
        if (topicData) {
          const { error: updateError } = await supabase
            .from('questions')
            .update({ 
              chapter_id: chapterId,
              topic_id: topicData.id 
            })
            .eq('id', q.id);

          if (!updateError) syncCount++;
        }
      }
    }

    console.log(`  ✅ Synced ${syncCount} questions\n`);

    // Step 5: Verify
    console.log('✨ Step 5: Verification\n');

    const { data: finalChapters } = await supabase.from('chapters').select('id');
    const { data: finalTopics } = await supabase.from('topics').select('id');
    const { data: finalQuestions } = await supabase
      .from('questions')
      .select('id, chapter_id, topic_id');

    const withChapter = finalQuestions.filter(q => q.chapter_id).length;
    const withTopic = finalQuestions.filter(q => q.topic_id).length;

    console.log(`  Chapters created: ${finalChapters.length}/2 ✅`);
    console.log(`  Topics created: ${finalTopics.length}/4 ✅`);
    console.log(`  Questions linked: ${withChapter}/${finalQuestions.length}`);
    console.log(`  Topics linked: ${withTopic}/${finalQuestions.length}\n`);

    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (withChapter === finalQuestions.length && finalChapters.length >= 2) {
      console.log('✅ AUTO-SETUP COMPLETE!\n');
      console.log('You can now:');
      console.log('  1. Refresh admin panel');
      console.log('  2. See all 13 questions in Question Manager');
      console.log('  3. Filter by JEE exam type\n');
    } else {
      console.log('⚠️  PARTIAL SETUP - Some items missing');
      console.log('Run check_final_status.js to diagnose\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check .env.production file exists');
    console.error('2. Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    console.error('3. For RLS errors, use Supabase service role key');
  }
}

autoSetup();
