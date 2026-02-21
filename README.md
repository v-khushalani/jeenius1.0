# 🚀 Jeenius 1.0 - Complete AI Learning Platform

A comprehensive, AI-powered learning platform for JEE/NEET aspirants with intelligent study planning, adaptive learning, and gamification.

## ✨ Key Features

- 🤖 **JEEnie AI Mentor**: AI-powered doubt solver using Google Gemini
- 📚 **Adaptive Learning**: Personalized study plans based on performance
- 🎮 **Gamification**: Points, badges, and leaderboards
- 🔊 **Text-to-Speech & Voice**: Accessible learning
- 📊 **Analytics Dashboard**: Track progress and mastery
- 💳 **Payment Integration**: Razorpay for subscriptions
- 👥 **Batch Management**: Group learning support

## 🛠️ Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: Google Gemini API + OpenAI (Text-to-Speech)
- **Payments**: Razorpay
- **Authentication**: Supabase Auth

## 🚀 Quick Start (5 Minutes)

### Prerequisites

- Node.js 16+ and npm
- Supabase CLI: `npm install -g supabase`
- Active accounts for: Google (Gemini), OpenAI, Razorpay

### Step 1: Clone & Install

```bash
# Clone repository
git clone <repo-url>
cd jeenius1.0

# Install dependencies
npm install
```

### Step 2: Setup Supabase (Complete Configuration)

```bash
# Quick setup script (recommended - fully interactive)
chmod +x quick_start_supabase.sh
./quick_start_supabase.sh

# OR manual setup with individual scripts:
# 1. Configure secrets
chmod +x setup_supabase_secrets.sh
./setup_supabase_secrets.sh

# 2. Deploy functions
chmod +x deploy_supabase.sh
./deploy_supabase.sh

# 3. Verify setup
chmod +x verify_supabase_setup.sh
./verify_supabase_setup.sh
```

### Step 3: Environment Configuration

Create `.env.local` (or copy from `.env.example`):

```bash
# Supabase Client
VITE_SUPABASE_URL="https://ngduavjaiqyiqjzelfpl.supabase.co"
VITE_SUPABASE_ANON_KEY="your_anon_key_here"

# Razorpay (Public Key)
VITE_RAZORPAY_KEY_ID="your_razorpay_key_id"
```

**Note**: Backend secrets (API keys) are configured via Supabase Dashboard → Secrets

### Step 4: Database Setup

The database schema is automatically created. To manually apply migrations:

```bash
# Via Supabase CLI
supabase db execute supabase/migrations/001_initial_schema.sql

# OR via Supabase Dashboard → SQL Editor
# Copy contents of supabase/migrations/001_initial_schema.sql
```

### Step 5: Start Development

```bash
npm run dev
```

Visit `http://localhost:5173`

---

## 📋 Supabase Configuration Details

### Required Secrets

All backend secrets are stored in **Supabase Settings → Secrets** (NOT in code):

| Secret | Source | Used By |
|--------|--------|---------|
| `GEMINI_API_KEY` | [makersuite.google.com](https://makersuite.google.com/app/apikey) | JEEnie, Study Planner |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com/api-keys) | Text-to-Speech |
| `RAZORPAY_KEY_ID` | [razorpay.com](https://dashboard.razorpay.com) | Payments |
| `RAZORPAY_KEY_SECRET` | [razorpay.com](https://dashboard.razorpay.com) | Payment Verification |

### Edge Functions

10 powerful Supabase Edge Functions handle backend logic:

1. **jeenie** - AI Doubt Solver
2. **extract-pdf-questions** - PDF Question Extraction
3. **voice-to-text** - Audio to Text Conversion
4. **text-to-speech** - Text to Speech (OpenAI)
5. **calculate-topic-mastery** - Mastery Calculation
6. **generate-study-plan** - AI Study Planning
7. **create-razorpay-order** - Payment Orders
8. **verify-payment** - Payment Verification
9. **create-batch-order** - Batch Payment Orders
10. **sync-batch-payment** - Batch Payment Sync

### Database Schema

Key tables:
- `user_profiles` - Extended user info
- `chapters` - Course chapters
- `topics` - Topics within chapters
- `questions` - Practice questions
- `question_attempts` - User attempts
- `study_sessions` - Study tracking
- `payments` - Payment records
- `subscriptions` - Active subscriptions
- `batches` - Group learning batches
- `batch_enrollments` - Batch enrollments

---

## 🧪 Testing the Setup

### Test JEEnie Function

```bash
curl -X POST https://ngduavjaiqyiqjzelfpl.supabase.co/functions/v1/jeenie \
  -H "Content-Type: application/json" \
  -d '{"contextPrompt":"What is Newton'\''s first law?"}'
```

### Verify All Secrets

```bash
supabase secrets list --project-ref ngduavjaiqyiqjzelfpl
```

### Check Function Status

```bash
supabase functions list --project-ref ngduavjaiqyiqjzelfpl
```

---

## 📁 Project Structure

```
jeenius1.0/
├── src/
│   ├── components/          # React components
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── integrations/
│   │   └── supabase/       # Supabase client & types
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript types
├── supabase/
│   ├── functions/          # Edge functions (backend)
│   ├── migrations/         # Database migrations
│   └── config.toml         # Supabase config
├── public/                 # Static assets
├── SUPABASE_SETUP_COMPLETE_GUIDE.md  # Detailed setup
├── setup_supabase_secrets.sh          # Secret configuration
├── verify_supabase_setup.sh           # Verification script
├── deploy_supabase.sh                 # Deployment script
└── quick_start_supabase.sh            # Quick start
```

---

## 🔧 Available Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run build:dev        # Build in dev mode
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run typecheck        # Check TypeScript
npm run check            # Lint + TypeCheck

# Supabase
supabase start           # Start local Supabase
supabase login           # Authenticate with Supabase
supabase deploy function # Deploy edge functions
supabase secrets list    # View configured secrets
```

---

## 🚀 Deployment Checklist

- [ ] All secrets configured in Supabase
- [ ] Database schema applied (migrations run)
- [ ] All Edge Functions deployed
- [ ] `.env.local` created with client keys
- [ ] API quotas verified (Gemini, OpenAI)
- [ ] Razorpay credentials verified (production, not test)
- [ ] Tested core functions:
  - [ ] JEEnie (requires GEMINI_API_KEY)
  - [ ] Text-to-Speech (requires OPENAI_API_KEY)
  - [ ] Payment creation (requires RAZORPAY keys)
- [ ] CORS configured if needed
- [ ] RLS (Row Level Security) policies active
- [ ] Monitoring & error logging enabled

---

## 🐛 Troubleshooting

### "API_KEY_MISSING_BACKEND" Error

The function couldn't find the API key in Supabase Secrets.

**Solution**:
```bash
# Set the secret
supabase secrets set GEMINI_API_KEY "your_key" --project-ref ngduavjaiqyiqjzelfpl

# Verify
supabase secrets list --project-ref ngduavjaiqyiqjzelfpl
```

### Razorpay Payment Fails

Ensure you're using **production credentials**, not test credentials.

**Check**:
1. Login to Razorpay Dashboard
2. Go to Settings → API Keys
3. Use actual Key ID and Secret (not keys for test mode)

### CORS Errors

Functions have CORS headers configured. If still seeing errors:

1. Check browser console for actual error message
2. Verify function is deployed: `supabase functions list`
3. Check function logs: Supabase Dashboard → Functions → Logs

### Database Connection Issues

**Check**:
```bash
# Verify migrations applied
supabase db list-tables

# Check table structure
supabase db execute "SELECT tablename FROM pg_tables WHERE schemaname='public';"
```

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Google Gemini API](https://ai.google.dev)
- [OpenAI API](https://platform.openai.com/docs)
- [Razorpay Integration](https://razorpay.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

## 🤝 Support

For issues:

1. **Check Logs**:
   - Supabase Dashboard → Functions → Logs
   - Browser Console (F12)
   - Terminal output

2. **Verify Configuration**:
   - All secrets set: `supabase secrets list`
   - Functions deployed: `supabase functions list`
   - Database ready: Check tables in Supabase SQL Editor

3. **Test Manually**:
   ```bash
   curl -X POST https://ngduavjaiqyiqjzelfpl.supabase.co/functions/v1/jeenie \
     -H "Content-Type: application/json" \
     -d '{"contextPrompt":"Test"}'
   ```

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file

---

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Video tutorials integration
- [ ] Collaborative features
- [ ] Pronunciation checker
- [ ] Real-time whiteboard
- [ ] AI-generated mock tests
- [ ] Parent monitoring dashboard

---

**Last Updated**: February 21, 2026  
**Status**: ✅ Production Ready  
**Maintainer**: Jeenius Team

For detailed Supabase setup instructions, see: [SUPABASE_SETUP_COMPLETE_GUIDE.md](SUPABASE_SETUP_COMPLETE_GUIDE.md)
