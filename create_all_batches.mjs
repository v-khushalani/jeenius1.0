import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env.local');

// Load environment variables from .env.local
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const envLines = envContent.split('\n');
    
    envLines.forEach(line => {
      const match = line.match(/^VITE_SUPABASE_URL="(.+)"/) || line.match(/^VITE_SUPABASE_URL=(.+)$/);
      if (match) supabaseUrl = match[1].replace(/^"|"$/g, '');
      
      const keyMatch = line.match(/^VITE_SUPABASE_ANON_KEY="(.+)"/) || line.match(/^VITE_SUPABASE_ANON_KEY=(.+)$/);
      if (keyMatch) supabaseServiceKey = keyMatch[1].replace(/^"|"$/g, '');
    });
  } catch (e) {
    console.error('Failed to read .env.local');
  }
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAllBatches() {
  try {
    console.log('🚀 Creating all batches for JEEnius...\n');

    // First, try to apply the migration if needed
    console.log('Step 1: Ensuring create_default_batches function exists...');
    const { error: funcError } = await supabase
      .rpc('create_default_batches', {}, { head: true });

    if (funcError && funcError.message.includes('does not exist')) {
      console.log('  → Function not found, applying migration...');
      
      // Read and execute the migration SQL
      const fs = await import('fs').then(m => m.promises);
      const migrationPath = path.join(__dirname, 'supabase/migrations/20260221_create_default_batches_function.sql');
      const migrationSQL = await fs.readFile(migrationPath, 'utf-8');
      
      const { error: migrationError } = await supabase.rpc('execute_sql', { 
        sql: migrationSQL 
      });

      if (migrationError && !migrationError.message.includes('already exists')) {
        console.error('  ❌ Error applying migration:', migrationError.message);
        console.log('\n⚠️  Please manually apply the migration:');
        console.log('   supabase/migrations/20260221_create_default_batches_function.sql');
      } else {
        console.log('  ✓ Migration applied successfully');
      }
    } else {
      console.log('  ✓ Function already exists');
    }

    // Call the SQL function to create all batches
    console.log('\nStep 2: Creating batches...');
    const { data, error } = await supabase
      .rpc('create_default_batches')
      .select('*');

    if (error) {
      console.error('❌ Error calling function:', error.message);
      console.log('\n⚠️  If you see "function does not exist", please:');
      console.log('1. Go to Supabase Dashboard → SQL Editor');
      console.log('2. Create a new query and paste the contents of:');
      console.log('   supabase/migrations/20260221_create_default_batches_function.sql');
      console.log('3. Run the query');
      console.log('4. Then run this script again');
      return false;
    }

    if (!data || data.length === 0) {
      console.error('❌ No results from function');
      return false;
    }

    let totalCreated = 0;
    let totalSkipped = 0;

    console.log('\nResults:');
    for (const result of data) {
      const status = result.status === 'CREATED' ? '✓' : '⊘';
      console.log(`  ${status} Grade ${result.grade_level} - ${result.exam_type}: ${result.status}`);
      
      if (result.status === 'CREATED') {
        totalCreated++;
      } else if (result.status === 'SKIPPED') {
        totalSkipped++;
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Batch creation complete!`);
    console.log(`   Created: ${totalCreated}`);
    console.log(`   Already Existed: ${totalSkipped}`);
    console.log(`${'='.repeat(50)}`);

    return true;
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

createAllBatches().then(success => {
  if (success) {
    console.log('\n✨ All batches ready for students!');
    process.exit(0);
  } else {
    process.exit(1);
  }
});
