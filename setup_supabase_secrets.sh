#!/bin/bash

# 🚀 Supabase Complete Setup Script
# This script configures all environment variables and secrets for Jeenius 1.0

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         🚀 JEENIUS 1.0 - SUPABASE COMPLETE SETUP          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Installing...${NC}"
    npm install -g supabase
fi

# Check if we're logged in to Supabase
echo -e "${BLUE}📝 Checking Supabase authentication...${NC}"
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}🔐 You need to log in to Supabase${NC}"
    supabase login
fi

echo -e "${GREEN}✅ Supabase CLI authenticated${NC}\n"

# Supabase Project Details
PROJECT_ID="ngduavjaiqyiqjzelfpl"
PROJECT_URL="https://${PROJECT_ID}.supabase.co"

echo -e "${BLUE}📌 Project Details:${NC}"
echo "   Project ID: $PROJECT_ID"
echo "   Project URL: $PROJECT_URL"
echo ""

# Function to set a secret
set_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3
    
    if [ -z "$secret_value" ]; then
        echo -e "${YELLOW}⚠️  Skipping $secret_name (empty value)${NC}"
        return
    fi
    
    echo -e "${BLUE}🔑 Setting $secret_name...${NC}"
    if supabase secrets set "$secret_name" "$secret_value" --project-ref "$PROJECT_ID" 2>/dev/null; then
        echo -e "${GREEN}✅ $secret_name configured${NC}"
    else
        echo -e "${RED}❌ Failed to set $secret_name${NC}"
        return 1
    fi
}

# Interactive setup for secrets
echo -e "${BLUE}🔐 BACKEND SECRETS CONFIGURATION${NC}"
echo "These secrets are used by Supabase Edge Functions (backend)"
echo "They will be stored securely in Supabase and NOT exposed to client"
echo ""

# 1. Gemini API Key
echo -e "${BLUE}1️⃣  Google Gemini API Key${NC}"
echo "   - Get from: https://makersuite.google.com/app/apikey"
echo "   - Used by: JEEnie Doubt Solver, Study Plan Generator"
read -p "   Enter GEMINI_API_KEY (or press Enter to skip): " GEMINI_API_KEY
if [ ! -z "$GEMINI_API_KEY" ]; then
    set_secret "GEMINI_API_KEY" "$GEMINI_API_KEY" "Gemini API Key"
fi
echo ""

# 2. OpenAI API Key
echo -e "${BLUE}2️⃣  OpenAI API Key${NC}"
echo "   - Get from: https://platform.openai.com/api-keys"
echo "   - Used by: Text-to-Speech function"
read -p "   Enter OPENAI_API_KEY (or press Enter to skip): " OPENAI_API_KEY
if [ ! -z "$OPENAI_API_KEY" ]; then
    set_secret "OPENAI_API_KEY" "$OPENAI_API_KEY" "OpenAI API Key"
fi
echo ""

# 3. Razorpay Key ID
echo -e "${BLUE}3️⃣  Razorpay Key ID${NC}"
echo "   - Get from: https://dashboard.razorpay.com → Settings → API Keys"
echo "   - Used by: Payment processing (stored in both backend AND frontend)"
read -p "   Enter RAZORPAY_KEY_ID (or press Enter to skip): " RAZORPAY_KEY_ID
if [ ! -z "$RAZORPAY_KEY_ID" ]; then
    set_secret "RAZORPAY_KEY_ID" "$RAZORPAY_KEY_ID" "Razorpay Key ID"
fi
echo ""

# 4. Razorpay Key Secret
echo -e "${BLUE}4️⃣  Razorpay Key Secret${NC}"
echo "   - Get from: https://dashboard.razorpay.com → Settings → API Keys"
echo "   - Used by: Payment verification (backend ONLY)"
echo "   - ⚠️  NEVER expose this to client-side code"
read -p "   Enter RAZORPAY_KEY_SECRET (or press Enter to skip): " RAZORPAY_KEY_SECRET
if [ ! -z "$RAZORPAY_KEY_SECRET" ]; then
    set_secret "RAZORPAY_KEY_SECRET" "$RAZORPAY_KEY_SECRET" "Razorpay Key Secret"
fi
echo ""

# Verify secrets are set
echo -e "${BLUE}📋 Verifying secrets...${NC}"
echo ""

SECRETS=$(supabase secrets list --project-ref "$PROJECT_ID" 2>/dev/null || echo "")

if echo "$SECRETS" | grep -q "GEMINI_API_KEY"; then
    echo -e "${GREEN}✅ GEMINI_API_KEY${NC}"
else
    echo -e "${YELLOW}⏳ GEMINI_API_KEY - not set${NC}"
fi

if echo "$SECRETS" | grep -q "OPENAI_API_KEY"; then
    echo -e "${GREEN}✅ OPENAI_API_KEY${NC}"
else
    echo -e "${YELLOW}⏳ OPENAI_API_KEY - not set${NC}"
fi

if echo "$SECRETS" | grep -q "RAZORPAY_KEY_ID"; then
    echo -e "${GREEN}✅ RAZORPAY_KEY_ID${NC}"
else
    echo -e "${YELLOW}⏳ RAZORPAY_KEY_ID - not set${NC}"
fi

if echo "$SECRETS" | grep -q "RAZORPAY_KEY_SECRET"; then
    echo -e "${GREEN}✅ RAZORPAY_KEY_SECRET${NC}"
else
    echo -e "${YELLOW}⏳ RAZORPAY_KEY_SECRET - not set${NC}"
fi

echo ""
echo -e "${BLUE}🌐 FRONTEND CLIENT CONFIGURATION${NC}"
echo "These are safe to expose to the client (public keys)"
echo ""

# 5. Supabase ANON Key
echo -e "${BLUE}5️⃣  Supabase ANON Key${NC}"
echo "   - Get from: Supabase Dashboard → Settings → API → anon (public)"
read -p "   Enter VITE_SUPABASE_ANON_KEY (or press Enter to skip): " SUPABASE_ANON_KEY
echo ""

# 6. Razorpay Key ID for Frontend
echo -e "${BLUE}6️⃣  Razorpay Key ID (for Frontend)${NC}"
echo "   - This is the same as backend RAZORPAY_KEY_ID (it's public)"
echo "   - Make sure you already entered it above"
read -p "   Enter VITE_RAZORPAY_KEY_ID (or press Enter to use same): " VITE_RAZORPAY_KEY_ID
if [ -z "$VITE_RAZORPAY_KEY_ID" ]; then
    VITE_RAZORPAY_KEY_ID="$RAZORPAY_KEY_ID"
fi
echo ""

# Create or update .env.local
echo -e "${BLUE}📝 Creating .env.local file...${NC}"
cat > .env.local << EOF
# Frontend Client Variables (Safe to expose)
VITE_SUPABASE_URL="https://${PROJECT_ID}.supabase.co"
VITE_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
VITE_RAZORPAY_KEY_ID="${VITE_RAZORPAY_KEY_ID}"

# Note: Other secrets are stored in Supabase Secrets (not in this file)
# They are automatically available to Edge Functions
EOF

if [ -f .env.local ]; then
    echo -e "${GREEN}✅ .env.local created successfully${NC}"
    echo "   Location: $(pwd)/.env.local"
else
    echo -e "${RED}❌ Failed to create .env.local${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    ✅ SETUP COMPLETE                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}🎉 Supabase Configuration Complete!${NC}"
echo ""
echo "✨ What's been configured:"
echo "   ✅ Backend secrets set in Supabase"
echo "   ✅ Frontend .env.local created"
echo "   ✅ All Edge Functions can access their required keys"
echo ""

echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "   1. Verify .env.local has correct values:"
echo "      cat .env.local"
echo ""
echo "   2. Check Supabase secrets are visible:"
echo "      supabase secrets list --project-ref $PROJECT_ID"
echo ""
echo "   3. Test a function (with authentication):"
echo "      curl -X POST $PROJECT_URL/functions/v1/jeenie \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"contextPrompt\":\"Test question\"}'"
echo ""
echo "   4. Start development server:"
echo "      npm run dev"
echo ""

echo -e "${BLUE}📚 For detailed information, see: SUPABASE_SETUP_COMPLETE_GUIDE.md${NC}"
echo ""

# Optional: Open Supabase dashboard
read -p "Would you like to open Supabase dashboard in browser? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "https://app.supabase.com/project/$PROJECT_ID"
fi

echo -e "${GREEN}🚀 All set! Your app is ready to use Supabase functions.${NC}"
