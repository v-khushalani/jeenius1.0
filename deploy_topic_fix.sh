#!/bin/bash
# ==============================================================================
# DEPLOY FIX: Remove topic_id validation trigger
# ==============================================================================
# 
# This script deploys the migration that fixes the "Invalid question: topic_id is required" error
#
# WHAT IT DOES:
# 1. Drops any database triggers that validate topic_id
# 2. Removes CHECK constraints on topic columns
# 3. Makes topic and topic_id columns nullable
# 4. Fixes the foreign key constraint
# 
# USAGE:
# 1. Make sure you have the Supabase CLI installed
# 2. Run: ./deploy_topic_fix.sh
#
# OR manually apply via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of: supabase/migrations/20260206_remove_topic_validation_trigger.sql
# 3. Execute the SQL
# ==============================================================================

echo "=============================================="
echo "Deploying topic_id validation fix..."
echo "=============================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "MANUAL DEPLOYMENT REQUIRED:"
    echo "1. Go to your Supabase Dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Copy the contents of: supabase/migrations/20260206_remove_topic_validation_trigger.sql"
    echo "4. Paste and run the SQL"
    echo ""
    exit 1
fi

# Check if linked to a project
if ! supabase db remote list &> /dev/null; then
    echo "⚠️  Not linked to a Supabase project"
    echo "Run: supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    echo "MANUAL DEPLOYMENT ALTERNATIVE:"
    echo "1. Go to your Supabase Dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Copy the contents of: supabase/migrations/20260206_remove_topic_validation_trigger.sql"
    echo "4. Paste and run the SQL"
    exit 1
fi

# Push migrations
echo "Pushing migrations to Supabase..."
supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "=============================================="
    echo "✅ Migration deployed successfully!"
    echo "=============================================="
    echo ""
    echo "The 'Invalid question: topic_id is required' error should now be fixed."
    echo ""
    echo "Test by:"
    echo "1. Going to the Extraction Review Queue"
    echo "2. Selecting a Foundation-9 question"
    echo "3. Clicking Push to push it to the database"
    echo ""
else
    echo ""
    echo "❌ Migration failed!"
    echo ""
    echo "MANUAL DEPLOYMENT:"
    echo "1. Go to your Supabase Dashboard SQL Editor"
    echo "2. Copy the contents of: supabase/migrations/20260206_remove_topic_validation_trigger.sql"
    echo "3. Paste and run the SQL"
    exit 1
fi
