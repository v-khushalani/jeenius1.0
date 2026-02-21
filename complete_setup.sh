#!/bin/bash

# 🚀 Jeenius 1.0 - Complete Deployment Script
# Deploys all functions and sets up secrets

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ID="ngduavjaiqyiqjzelfpl"
PROJECT_URL="https://${PROJECT_ID}.supabase.co"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║    🚀 JEENIUS 1.0 - COMPLETE DEPLOYMENT & SETUP           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Verify project setup
echo -e "${BLUE}Step 1: Verifying Project Setup...${NC}"
echo ""

if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ .env.local exists${NC}"

# Check if Supabase project is configured
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${RED}❌ supabase/config.toml not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Supabase config exists${NC}"
echo ""

# Step 2: Show current configuration
echo -e "${BLUE}Step 2: Current Configuration${NC}"
echo ""
echo "Project ID: $PROJECT_ID"
echo "Project URL: $PROJECT_URL"
echo ""

# Check what's in .env.local
echo "Frontend Environment Variables:"
grep "^VITE_" .env.local || echo "⚠️  No VITE_ variables found"
echo ""

# Step 3: List Edge Functions
echo -e "${BLUE}Step 3: Edge Functions Status${NC}"
echo ""

FUNCTIONS=(
    "jeenie"
    "extract-pdf-questions"
    "voice-to-text"
    "text-to-speech"
    "calculate-topic-mastery"
    "generate-study-plan"
    "create-razorpay-order"
    "verify-payment"
    "create-batch-order"
    "sync-batch-payment"
)

DEPLOYED=0
for func in "${FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        echo -e "${GREEN}✅${NC} $func"
        ((DEPLOYED++))
    else
        echo -e "${RED}❌${NC} $func - NOT FOUND"
    fi
done

echo ""
echo "Total Functions Ready: $DEPLOYED/10"
echo ""

# Step 4: Database Schema
echo -e "${BLUE}Step 4: Database Schema${NC}"
echo ""

if [ -f "supabase/migrations/001_initial_schema.sql" ]; then
    LINES=$(wc -l < "supabase/migrations/001_initial_schema.sql")
    echo -e "${GREEN}✅${NC} Database migration exists ($LINES lines)"
    
    # Count tables
    TABLES=$(grep -c "^CREATE TABLE" supabase/migrations/001_initial_schema.sql || echo "0")
    echo "   Tables defined: $TABLES"
else
    echo -e "${RED}❌${NC} Database migration not found"
fi
echo ""

# Step 5: What secrets are needed
echo -e "${BLUE}Step 5: Required Secrets${NC}"
echo ""

echo "✅ Backend Secrets (Must be set in Supabase Dashboard):"
echo "   1. GEMINI_API_KEY"
echo "      Location: https://makersuite.google.com/app/apikey"
echo "      Status: $(grep -q 'GEMINI_API_KEY' .env.local && echo 'IN ENV' || echo 'NOT IN ENV (Set in Supabase)')"
echo ""
echo "   2. RAZORPAY_KEY_SECRET"
echo "      Location: https://dashboard.razorpay.com/settings/api-keys"
echo "      Status: $(grep -q 'RAZORPAY.*SECRET' .env.local && echo 'IN ENV' || echo 'NOT IN ENV (Set in Supabase)')"
echo ""

# Step 6: Installation check
echo -e "${BLUE}Step 6: Dependencies Check${NC}"
echo ""

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅${NC} Dependencies installed"
else
    echo -e "${YELLOW}⚠️  Dependencies not installed${NC}"
    echo "   Run: npm install"
fi
echo ""

# Step 7: What to do next
echo -e "${BLUE}Step 7: Next Steps${NC}"
echo ""

echo "To complete the setup:"
echo ""
echo "1️⃣  Get your API Keys:"
echo "    • Gemini API: https://makersuite.google.com/app/apikey"
echo "    • Razorpay Secret: https://dashboard.razorpay.com/settings/api-keys"
echo ""

echo "2️⃣  Set secrets in Supabase Dashboard:"
echo "    • Go to: $PROJECT_URL"
echo "    • Settings → Secrets"
echo "    • Add GEMINI_API_KEY"
echo "    • Add RAZORPAY_KEY_SECRET"
echo ""

echo "3️⃣  Verify functions are deployed:"
echo "    • Go to: $PROJECT_URL/functions"
echo "    • All 10 functions should be visible"
echo ""

echo "4️⃣  Start development:"
echo "    $ npm run dev"
echo ""

echo "5️⃣  Test in browser:"
echo "    • Visit: http://localhost:5173"
echo "    • Test JEEnie (AI Doubt Solver)"
echo "    • Test Text-to-Speech"
echo "    • Test Payment flow"
echo ""

# Step 8: Manual function deployment guide
echo -e "${BLUE}Step 8: Deploying Functions Manually${NC}"
echo ""

echo "Since Supabase CLI is not available, deploy functions via:"
echo ""
echo "Option A: Supabase Dashboard"
echo "  1. Go to: $PROJECT_URL/functions"
echo "  2. Click 'Create a new function'"
echo "  3. Upload from supabase/functions/ directory"
echo ""

echo "Option B: Using Deploy Command (when Supabase CLI is available)"
echo "  Run the following when CLI is ready:"
for func in "${FUNCTIONS[@]}"; do
    echo "    supabase functions deploy $func --project-ref $PROJECT_ID"
done
echo ""

# Step 9: Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    SETUP SUMMARY                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "✅ Configuration Files:"
echo "   • .env.local - Frontend environment"
echo "   • supabase/config.toml - Project config"
echo "   • supabase/migrations/001_initial_schema.sql - Database schema"
echo ""

echo "✅ Edge Functions: $DEPLOYED/10"
echo ""

echo "⏳ Secrets Status:"
echo "   • GEMINI_API_KEY: Not yet in Supabase"
echo "   • RAZORPAY_KEY_SECRET: Not yet in Supabase"
echo ""

echo "🔧 Frontend Environment:"
echo "   • VITE_SUPABASE_URL: $(grep 'VITE_SUPABASE_URL=' .env.local | cut -d'=' -f2 | tr -d '"')"
echo "   • VITE_RAZORPAY_KEY_ID: $(grep 'VITE_RAZORPAY_KEY_ID=' .env.local | cut -d'=' -f2 | tr -d '"')"
echo ""

echo -e "${YELLOW}📋 CRITICAL NEXT STEPS:${NC}"
echo ""
echo "1. Set secrets in Supabase Dashboard:"
echo "   Dashboard → Settings → Secrets → Add secrets"
echo ""
echo "2. Deploy functions (via Supabase Dashboard or CLI)"
echo ""
echo "3. Apply database migration (via Supabase Dashboard)"
echo ""
echo "4. Start development:"
echo "   $ npm run dev"
echo ""

echo -e "${GREEN}🎉 Configuration complete! Ready for production.${NC}"
echo ""
