#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the migration file
const migrationPath = path.join(__dirname, 'supabase/migrations/20260203000000_batch_system.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

console.log('Migration file loaded successfully');
console.log('SQL Preview (first 500 chars):');
console.log(migrationSQL.substring(0, 500));
console.log('\n✅ Migration file is ready to be deployed.');
console.log('\nTo deploy this migration:');
console.log('1. Go to: https://app.supabase.com/project/_/sql');
console.log('2. Click "New Query"');
console.log('3. Paste the entire SQL content from supabase/migrations/20260203000000_batch_system.sql');
console.log('4. Click "Run" to execute');
console.log('\nAlternatively, use Supabase CLI:');
console.log('  npm install -g supabase');
console.log('  supabase link --project-ref zbclponzlwulmltwkjga');
console.log('  supabase db push');
