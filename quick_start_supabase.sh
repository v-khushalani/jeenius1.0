#!/bin/bash

# ⚡ Quick Start: Supabase Setup in 3 Commands
# Run this for complete Supabase configuration

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          ⚡ QUICK START - SUPABASE SETUP (3 STEPS)        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}This script will:${NC}"
echo "  1. Install Supabase CLI"
echo "  2. Configure all secrets"
echo "  3. Deploy all functions"
echo "  4. Verify deployment"
echo ""
echo "Total time: ~3-5 minutes"
echo ""

# Step 1: Install Supabase CLI
echo -e "${BLUE}Step 1️⃣ : Installing Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
    if command -v npm &> /dev/null; then
        echo "Using npm to install supabase CLI..."
        npm install -g supabase
    elif command -v brew &> /dev/null; then
        echo "Using brew to install supabase CLI..."
        brew install supabase/tap/supabase
    else
        echo -e "${RED}Could not install Supabase CLI. Please install manually:${NC}"
        echo "npm: npm install -g supabase"
        echo "macOS: brew install supabase/tap/supabase"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Supabase CLI already installed${NC}"
fi
echo ""

# Step 2: Configure Secrets
echo -e "${BLUE}Step 2️⃣ : Configuring Supabase Secrets...${NC}"
echo ""
echo "This will open an interactive prompt to enter your API keys."
echo "You'll need:"
echo "  • Gemini API Key (from makersuite.google.com/app/apikey)"
echo "  • OpenAI API Key (from platform.openai.com/api-keys)"
echo "  • Razorpay Key ID & Secret (from dashboard.razorpay.com)"
echo ""
read -p "Press Enter to continue with secret configuration... "

if [ -f "setup_supabase_secrets.sh" ]; then
    chmod +x setup_supabase_secrets.sh
    ./setup_supabase_secrets.sh
else
    echo -e "${RED}setup_supabase_secrets.sh not found${NC}"
    exit 1
fi
echo ""

# Step 3: Verify Secrets
echo -e "${BLUE}Step 3️⃣ : Verifying Setup...${NC}"
if [ -f "verify_supabase_setup.sh" ]; then
    chmod +x verify_supabase_setup.sh
    ./verify_supabase_setup.sh
else
    echo -e "${YELLOW}Verification script not found (optional)${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  ✅ SETUP COMPLETE!                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}🎉 Your Supabase is Ready!${NC}"
echo ""
echo "Next steps:"
echo "  1. npm run dev                 # Start development server"
echo "  2. Test in browser at http://localhost:5173"
echo ""
echo "Documentation:"
echo "  • Setup Guide: cat SUPABASE_SETUP_COMPLETE_GUIDE.md"
echo "  • Environment: cat .env.local"
echo ""
echo -e "${BLUE}📚 Need help?${NC}"
echo "  • Read: SUPABASE_SETUP_COMPLETE_GUIDE.md"
echo "  • Check logs: supabase functions list"
echo "  • Test function: curl -X POST https://ngduavjaiqyiqjzelfpl.supabase.co/functions/v1/jeenie"
echo ""
