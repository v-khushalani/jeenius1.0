# 🚀 Supabase Complete Setup Guide

This guide walks you through setting up all required Supabase functions, secrets, and configurations for the Jeenius 1.0 application.

## ✅ Current Supabase Project
- **Project ID**: `ngduavjaiqyiqjzelfpl`
- **URL**: `https://ngduavjaiqyiqjzelfpl.supabase.co`
- **Region**: (From Project Settings)

## 📋 Required Environment Variables

### Backend (Supabase Edge Functions)
These need to be set in Supabase Project Settings → Secrets:

```bash
# Supabase Configuration
SUPABASE_URL = "https://ngduavjaiqyiqjzelfpl.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "YOUR_SERVICE_ROLE_KEY_HERE"

# Gemini AI API (for JEEnie Doubt Solver & Study Plan Generation)
GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"

# OpenAI API (for Text-to-Speech)
OPENAI_API_KEY = "YOUR_OPENAI_API_KEY_HERE"

# Razorpay Payment Gateway
RAZORPAY_KEY_ID = "YOUR_RAZORPAY_KEY_ID_HERE"
RAZORPAY_KEY_SECRET = "YOUR_RAZORPAY_KEY_SECRET_HERE"
```

### Frontend (.env.local or .env.production)
```bash
# Supabase Client Configuration
VITE_SUPABASE_URL="https://ngduavjaiqyiqjzelfpl.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_ANON_KEY_HERE"

# Razorpay (Only Key ID, NOT Secret - exposed to client)
VITE_RAZORPAY_KEY_ID="YOUR_RAZORPAY_KEY_ID_HERE"
```

---

## 🔐 Step-by-Step Setup Instructions

### 1️⃣ Get Your Supabase Credentials

**Location**: [Supabase Dashboard](https://app.supabase.com)

1. Go to your project: `ngduavjaiqyiqjzelfpl`
2. Navigate to: **Settings** → **API**
3. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **anon (public)** → `VITE_SUPABASE_ANON_KEY`
   - **service_role (secret)** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ KEEP SECRET

### 2️⃣ Set Up Gemini API Key

**Steps**:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **"Create API Key"**
3. Copy the API key
4. Set as `GEMINI_API_KEY` in Supabase Secrets

**Used By**:
- `jeenie` function (JEEnie Doubt Solver)
- `generate-study-plan` function (AI Study Planning)

### 3️⃣ Set Up OpenAI API Key

**Steps**:
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click **"Create new secret key"**
3. Copy the key
4. Set as `OPENAI_API_KEY` in Supabase Secrets

**Used By**:
- `text-to-speech` function (High-quality audio)

### 4️⃣ Set Up Razorpay Credentials

**Steps**:
1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to **Settings** → **API Keys**
3. Copy:
   - **Key ID** → `RAZORPAY_KEY_ID` (safe for client-side)
   - **Key Secret** → `RAZORPAY_KEY_SECRET` (backend only)

**Used By**:
- `create-razorpay-order` function
- `verify-payment` function
- `create-batch-order` function
- `sync-batch-payment` function

---

## 🔧 Setting Secrets in Supabase

### Via Supabase Dashboard (Recommended for Small Setups)

1. Go to Supabase Project → **Settings** → **Secrets**
2. Click **"New secret"** for each:
   - `GEMINI_API_KEY`
   - `OPENAI_API_KEY`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`

### Via Supabase CLI (VCS-Friendly)

1. **Install Supabase CLI** (if not already done):
   ```bash
   brew install supabase/tap/supabase  # macOS
   # or
   npm install -g supabase  # npm
   ```

2. **Create `.env.local` file** in workspace root:
   ```bash
   cp .env.example .env.local  # Use provided template
   ```

3. **Authenticate with Supabase**:
   ```bash
   supabase login
   # Follow the browser prompt
   ```

4. **Set secrets** (one by one):
   ```bash
   supabase secrets set GEMINI_API_KEY="your_key_here"
   supabase secrets set OPENAI_API_KEY="your_key_here"
   supabase secrets set RAZORPAY_KEY_ID="your_key_here"
   supabase secrets set RAZORPAY_KEY_SECRET="your_key_here"
   ```

5. **Verify secrets are set**:
   ```bash
   supabase secrets list
   ```

---

## 📱 Supabase Edge Functions Overview

### 1. **jeenie** (`functions/jeenie/index.ts`)
- **Purpose**: JEEnie AI Doubt Solver
- **Requires**: `GEMINI_API_KEY`
- **Endpoint**: `POST /functions/v1/jeenie`
- **Input**: `{ contextPrompt: string, conversationHistory?: string }`

### 2. **extract-pdf-questions** (`functions/extract-pdf-questions/index.ts`)
- **Purpose**: Extract questions from PDF files
- **Requires**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Endpoint**: `POST /functions/v1/extract-pdf-questions`

### 3. **voice-to-text** (`functions/voice-to-text/index.ts`)
- **Purpose**: Convert voice/audio to text
- **Requires**: None (basic function)
- **Endpoint**: `POST /functions/v1/voice-to-text`
- **Input**: `{ audio: base64 }`

### 4. **text-to-speech** (`functions/text-to-speech/index.ts`)
- **Purpose**: Convert text to spoken audio
- **Requires**: `OPENAI_API_KEY`
- **Endpoint**: `POST /functions/v1/text-to-speech`
- **Input**: `{ text: string, voice?: string }`

### 5. **calculate-topic-mastery** (`functions/calculate-topic-mastery/index.ts`)
- **Purpose**: Calculate student's mastery in a topic
- **Requires**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Endpoint**: `POST /functions/v1/calculate-topic-mastery`

### 6. **generate-study-plan** (`functions/generate-study-plan/index.ts`)
- **Purpose**: Generate personalized study plan
- **Requires**: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Endpoint**: `POST /functions/v1/generate-study-plan`

### 7. **create-razorpay-order** (`functions/create-razorpay-order/index.ts`)
- **Purpose**: Create payment orders for subscriptions
- **Requires**: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Endpoint**: `POST /functions/v1/create-razorpay-order`

### 8. **verify-payment** (`functions/verify-payment/index.ts`)
- **Purpose**: Verify & confirm Razorpay payments
- **Requires**: `RAZORPAY_KEY_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Endpoint**: `POST /functions/v1/verify-payment`

### 9. **create-batch-order** (`functions/create-batch-order/index.ts`)
- **Purpose**: Create orders for batch enrollments
- **Requires**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Endpoint**: `POST /functions/v1/create-batch-order`

### 10. **sync-batch-payment** (`functions/sync-batch-payment/index.ts`)
- **Purpose**: Sync batch payment status
- **Requires**: `RAZORPAY_KEY_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Endpoint**: `POST /functions/v1/sync-batch-payment`

---

## ✨ Local Development Setup

### 1. Create `.env.local`
```bash
# Copy from .env.example
cp .env.example .env.local
```

### 2. Fill in the values
```bash
VITE_SUPABASE_URL=https://ngduavjaiqyiqjzelfpl.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 3. Run Supabase locally (optional)
```bash
supabase start
```

### 4. Start development server
```bash
npm run dev
```

---

## 🚀 Deployment Checklist

- [ ] All secrets set in Supabase Dashboard
- [ ] GEMINI_API_KEY is valid and has quota
- [ ] OPENAI_API_KEY is valid and has credits
- [ ] RAZORPAY credentials are from production (not test)
- [ ] Database tables exist (see migrations)
- [ ] RLS (Row Level Security) policies configured
- [ ] CORS allowed for all required domains
- [ ] Functions have proper error logging
- [ ] Rate limiting configured (optional)
- [ ] Monitoring/alerts setup

---

## 🔍 Testing Each Function

### Test JEEnie Doubt Solver
```bash
curl -X POST https://ngduavjaiqyiqjzelfpl.supabase.co/functions/v1/jeenie \
  -H "Content-Type: application/json" \
  -d '{"contextPrompt":"What is Newton'\''s first law?"}'
```

### Test Text-to-Speech
```bash
curl -X POST https://ngduavjaiqyiqjzelfpl.supabase.co/functions/v1/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello, this is a test","voice":"nova"}'
```

### Test with Authentication
```bash
curl -X POST https://ngduavjaiqyiqjzelfpl.supabase.co/functions/v1/calculate-topic-mastery \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"subject":"Physics","chapter":"Motion","topic":"Velocity"}'
```

---

## 🐛 Troubleshooting

### Function Returns 500 Error
1. Check Supabase function logs: Dashboard → Functions → View Logs
2. Ensure environment variable is set
3. Check variable name for typos

### "API_KEY_MISSING_BACKEND" Error
- Missing GEMINI_API_KEY in Supabase Secrets
- Solution: Set it via Dashboard or CLI

### Razorpay Payment Fails
- Check if credentials are production (not test)
- Verify signature verification logic

### Cross-Origin (CORS) Error
- Already handled in functions with CORS headers
- If issue persists, check Browser Console logs

---

## 📚 Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Gemini API Docs](https://ai.google.dev/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Razorpay Integration Guide](https://razorpay.com/docs/)

---

## 📞 Support

For issues:
1. Check Supabase logs: **Settings** → **Logs**
2. Review function code in `/supabase/functions/`
3. Test API manually with curl
4. Check environment variables are set correctly

---

**Last Updated**: February 21, 2026  
**Status**: ✅ Ready for Production Setup
