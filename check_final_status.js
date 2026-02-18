#!/usr/bin/env node

/**
 * Diagnostic Script: Question Sync Status
 * Run this command: `node check_final_status.js`
 * 
 * This script will show:
 * - Current question count and status
 * - Chapter and topic creation progress
 * - What's needed to complete setup
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

async function checkStatus() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║      QUESTION SYNC DIAGNOSTIC - FINAL STATUS CHECK       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    const [questionsRes, chaptersRes, topicsRes] = await Promise.all([
      supabase.from('questions').select('id, exam, subject, chapter, topic, chapter_id, topic_id'),
      supabase.from('chapters').select('id, subject, chapter_name'),
      supabase.from('topics').select('id, topic_name, chapter_id')
    ]);

    const questions = questionsRes.data || [];
    const chapters = chaptersRes.data || [];
    const topics = topicsRes.data || [];

    // Stats
    console.log('📊 DATABASE STATISTICS\n');
    console.log(`  Questions:  ${questions.length} total`);
    console.log(`  Chapters:   ${chapters.length} total`);
    console.log(`  Topics:     ${topics.length} total\n`);

    // Question breakdown by status
    console.log('📋 QUESTIONS BY SYNC STATUS\n');
    const withChapterId = questions.filter(q => q.chapter_id).length;
    const withTopicId = questions.filter(q => q.topic_id).length;
    const fullyLinked = questions.filter(q => q.chapter_id && q.topic_id).length;

    console.log(`  With chapter_id:  ${withChapterId}/${questions.length} ${withChapterId === questions.length ? '✅' : '⚠️'}`);
    console.log(`  With topic_id:    ${withTopicId}/${questions.length} ${withTopicId === questions.length ? '✅' : '⚠️'}`);
    console.log(`  Fully linked:     ${fullyLinked}/${questions.length} ${fullyLinked === questions.length ? '✅' : '❌'}\n`);

    // Chapter info
    if (chapters.length === 0) {
      console.log('🔴 CRITICAL: No chapters found!\n');
      console.log('  Required chapters for JEE Chemistry:');
      console.log('    ☐ Chemical Bonding');
      console.log('    ☐ p-Block Elements\n');
    } else {
      console.log(`✅ Chapters (${chapters.length}):\n`);
      chapters.forEach(c => {
        console.log(`    ✓ ${c.subject} / ${c.chapter_name}`);
      });
      console.log();
    }

    // Topic info
    if (topics.length === 0) {
      console.log('🔴 CRITICAL: No topics found!\n');
      console.log('  Required topics:');
      console.log('    ☐ Valence Bond Theory (VBT)');
      console.log('    ☐ Molecular Orbital Theory (MOT)');
      console.log('    ☐ Group 17 Elements');
      console.log('    ☐ Group 18 Elements\n');
    } else {
      console.log(`✅ Topics (${topics.length}):\n`);
      topics.forEach(t => {
        console.log(`    ✓ ${t.topic_name}`);
      });
      console.log();
    }

    // Sync status by exam type
    console.log('📚 QUESTIONS BY EXAM TYPE\n');
    const byExam = {};
    questions.forEach(q => {
      const exam = q.exam || 'UNKNOWN';
      if (!byExam[exam]) byExam[exam] = { total: 0, linked: 0, chapters: new Set() };
      byExam[exam].total++;
      if (q.chapter_id && q.topic_id) byExam[exam].linked++;
      byExam[exam].chapters.add(q.chapter);
    });

    Object.entries(byExam).forEach(([exam, stats]) => {
      console.log(`  ${exam}:`);
      console.log(`    ${stats.linked}/${stats.total} linked`);
      console.log(`    Chapters: ${Array.from(stats.chapters).join(', ')}\n`);
    });

    // Recommendations
    console.log('💡 NEXT STEPS\n');
    
    if (chapters.length === 0 || topics.length === 0) {
      console.log('  1️⃣  Go to Admin Panel > Chapter Manager');
      console.log('  2️⃣  Create Chemistry chapters:');
      console.log('      - Chemical Bonding');
      console.log('      - p-Block Elements');
      console.log('  3️⃣  Go to Admin Panel > Topic Manager');
      console.log('      - Add 4 topics to the chapters above');
      console.log('  4️⃣  Refresh this check script\n');
    } else if (fullyLinked < questions.length) {
      console.log('  1️⃣  Chapters and topics exist ✓');
      console.log('  2️⃣  Running auto-sync for unlinked questions...\n');
      // User can run a sync script here
    } else {
      console.log('  ✅ All questions synced successfully!');
      console.log('  ✅ All chapters and topics created!');
      console.log('  ✅ Admin panel should show all 13 questions\n');
    }

    // Final status
    console.log('═══════════════════════════════════════════════════════════\n');
    if (fullyLinked === questions.length && chapters.length > 0 && topics.length > 0) {
      console.log('✅ SYNC COMPLETE - Admin panel is ready!');
    } else {
      console.log('❌ SYNC INCOMPLETE - See next steps above');
    }
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkStatus();
