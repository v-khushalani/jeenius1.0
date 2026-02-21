#!/bin/bash

# 🔍 Supabase Functions Verification Script
# Checks if all Edge Functions are properly configured with required secrets

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🔍 JEENIUS 1.0 - SUPABASE FUNCTIONS VERIFICATION      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

PROJECT_ID="ngduavjaiqyiqjzelfpl"
FUNCTIONS_DIR="supabase/functions"

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Install with: npm install -g supabase${NC}"
    exit 1
fi

# Get list of secrets
echo -e "${BLUE}📋 Checking Supabase Secrets...${NC}"
SECRETS=$(supabase secrets list --project-ref "$PROJECT_ID" 2>/dev/null || echo "")
echo ""

# Define functions and their requirements
declare -A FUNCTIONS=(
    ["jeenie"]="GEMINI_API_KEY"
    ["extract-pdf-questions"]="SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY"
    ["voice-to-text"]="(none)"
    ["text-to-speech"]="OPENAI_API_KEY"
    ["calculate-topic-mastery"]="SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY"
    ["generate-study-plan"]="GEMINI_API_KEY,SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY"
    ["create-razorpay-order"]="RAZORPAY_KEY_ID,RAZORPAY_KEY_SECRET,SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY"
    ["verify-payment"]="RAZORPAY_KEY_SECRET,SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY"
    ["create-batch-order"]="SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY"
    ["sync-batch-payment"]="RAZORPAY_KEY_SECRET,SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY"
)

echo -e "${BLUE}🚀 Functions Verification:${NC}"
echo ""

MISSING_SECRETS=0
CONFIGURED_FUNCTIONS=0

for func in "${!FUNCTIONS[@]}"; do
    REQUIRED="${FUNCTIONS[$func]}"
    FUNC_PATH="$FUNCTIONS_DIR/$func"
    
    if [ ! -d "$FUNC_PATH" ]; then
        echo -e "${YELLOW}⚠️  Function not found: $func${NC}"
        continue
    fi
    
    echo -e "${BLUE}📌 $func${NC}"
    echo "   Required: $REQUIRED"
    
    if [ "$REQUIRED" = "(none)" ]; then
        echo -e "   ${GREEN}✅ No configuration needed${NC}"
        ((CONFIGURED_FUNCTIONS++))
    else
        # Check each required secret
        IFS=',' read -ra REQS <<< "$REQUIRED"
        ALL_PRESENT=true
        
        for req in "${REQS[@]}"; do
            req=$(echo "$req" | xargs)  # trim whitespace
            
            if [ "$req" = "SUPABASE_URL" ] || [ "$req" = "SUPABASE_SERVICE_ROLE_KEY" ]; then
                # These are default Supabase env vars, always available
                echo -e "      ${GREEN}✅${NC} $req (built-in)"
            else
                # Check if secret is set
                if echo "$SECRETS" | grep -q "^$req "; then
                    echo -e "      ${GREEN}✅${NC} $req"
                else
                    echo -e "      ${RED}❌${NC} $req (NOT SET)"
                    ALL_PRESENT=false
                    ((MISSING_SECRETS++))
                fi
            fi
        done
        
        if [ "$ALL_PRESENT" = true ]; then
            echo -e "   ${GREEN}✅ Function ready${NC}"
            ((CONFIGURED_FUNCTIONS++))
        else
            echo -e "   ${YELLOW}⚠️  Missing secrets${NC}"
        fi
    fi
    echo ""
done

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      SUMMARY REPORT                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

TOTAL_FUNCTIONS=${#FUNCTIONS[@]}

echo "Total Functions: $TOTAL_FUNCTIONS"
echo "Configured: $CONFIGURED_FUNCTIONS"
echo "Missing Secrets: $MISSING_SECRETS"
echo ""

if [ "$MISSING_SECRETS" -eq 0 ]; then
    echo -e "${GREEN}🎉 All functions are properly configured!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some secrets are missing. Use setup_supabase_secrets.sh to configure them.${NC}"
    echo ""
    echo "Quick fix commands:"
    
    if echo "$SECRETS" | grep -qv "GEMINI_API_KEY"; then
        echo "   supabase secrets set GEMINI_API_KEY 'your_key' --project-ref $PROJECT_ID"
    fi
    
    if echo "$SECRETS" | grep -qv "OPENAI_API_KEY"; then
        echo "   supabase secrets set OPENAI_API_KEY 'your_key' --project-ref $PROJECT_ID"
    fi
    
    if echo "$SECRETS" | grep -qv "RAZORPAY_KEY_ID"; then
        echo "   supabase secrets set RAZORPAY_KEY_ID 'your_key' --project-ref $PROJECT_ID"
    fi
    
    if echo "$SECRETS" | grep -qv "RAZORPAY_KEY_SECRET"; then
        echo "   supabase secrets set RAZORPAY_KEY_SECRET 'your_key' --project-ref $PROJECT_ID"
    fi
    
    exit 1
fi
