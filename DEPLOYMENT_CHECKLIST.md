# ⚡ QUICK DEPLOYMENT CHECKLIST

**सबकुछ तैयार है! बस अभी ये करना बाकी है:**

---

## 📋 BEFORE YOU START

- [ ] Open Supabase Dashboard: https://app.supabase.com
- [ ] Have browser and editor side-by-side
- [ ] Keep this checklist open

---

## 1️⃣ GET API KEYS (5 MINUTES)

### Gemini API Key
```
Step 1: Go to https://makersuite.google.com/app/apikey
Step 2: Click "Create API Key"
Step 3: Select your project
Step 4: Copy the API Key
Step 5: Save it somewhere safe (you'll need it next)
```

**Got it?** ✓ `_________________` (paste key here to remember)

### Razorpay Key Secret
```
Step 1: Go to https://dashboard.razorpay.com
Step 2: Go to Settings (bottom left)
Step 3: Click API Keys
Step 4: Copy the "Key Secret" (NOT Key ID)
Step 5: Save it
```

**Got it?** ✓ `_________________` (paste key here to remember)

---

## 2️⃣ ADD SECRETS TO SUPABASE (5 MINUTES)

### Open Supabase Dashboard

Link: https://app.supabase.com/project/ngduavjaiqyiqjzelfpl

### Navigate to Secrets

```
Left Menu → Settings (bottom) → Secrets (tab)
```

### Add Secret 1: GEMINI_API_KEY

```
[ ] Click "New secret" button
[ ] Name: GEMINI_API_KEY
[ ] Value: <Paste your Gemini API key from Step 1>
[ ] Click "Save"
[ ] Wait for confirmation message
```

**Status:** ✓

### Add Secret 2: RAZORPAY_KEY_SECRET

```
[ ] Click "New secret" button (again)
[ ] Name: RAZORPAY_KEY_SECRET
[ ] Value: <Paste your Razorpay Key Secret from Step 1>
[ ] Click "Save"
[ ] Wait for confirmation message
```

**Status:** ✓

---

## 3️⃣ DEPLOY ALL 10 FUNCTIONS (10 MINUTES)

### Open Functions in Supabase

Link: https://app.supabase.com/project/ngduavjaiqyiqjzelfpl/functions

### Function Deployment Process

For each function below:

```
1. Click "Create a new function" or "Deploy new"
2. Name: <Use the function name below>
3. Go to supabase/functions/<name>/index.ts in VS Code
4. Copy all the code (Ctrl+A, Ctrl+C)
5. Paste in Supabase editor
6. Click "Deploy"
7. Wait for "Deployment successful" message
```

### Deploy These 10 Functions

#### 1. jeenie ✓
- [ ] Copied code from supabase/functions/jeenie/index.ts
- [ ] Created function with name: jeenie
- [ ] Pasted code
- [ ] Clicked Deploy
- [ ] Got success message

#### 2. text-to-speech ✓ (NOW USES GEMINI!)
- [ ] Copied code from supabase/functions/text-to-speech/index.ts
- [ ] Created function with name: text-to-speech
- [ ] Pasted code (✨ Updated to use GEMINI instead of OpenAI!)
- [ ] Clicked Deploy
- [ ] Got success message

#### 3. voice-to-text ✓
- [ ] Copied code from supabase/functions/voice-to-text/index.ts
- [ ] Created function with name: voice-to-text
- [ ] Pasted code
- [ ] Clicked Deploy
- [ ] Got success message

#### 4. calculate-topic-mastery ✓
- [ ] Copied code from supabase/functions/calculate-topic-mastery/index.ts
- [ ] Created function with name: calculate-topic-mastery
- [ ] Pasted code
- [ ] Clicked Deploy
- [ ] Got success message

#### 5. generate-study-plan ✓
- [ ] Copied code from supabase/functions/generate-study-plan/index.ts
- [ ] Created function with name: generate-study-plan
- [ ] Pasted code
- [ ] Clicked Deploy
- [ ] Got success message

#### 6. create-razorpay-order ✓
- [ ] Copied code from supabase/functions/create-razorpay-order/index.ts
- [ ] Created function with name: create-razorpay-order
- [ ] Pasted code
- [ ] Clicked Deploy
- [ ] Got success message

#### 7. verify-payment ✓
- [ ] Copied code from supabase/functions/verify-payment/index.ts
- [ ] Created function with name: verify-payment
- [ ] Pasted code
- [ ] Clicked Deploy
- [ ] Got success message

#### 8. create-batch-order ✓
- [ ] Copied code from supabase/functions/create-batch-order/index.ts
- [ ] Created function with name: create-batch-order
- [ ] Pasted code
- [ ] Clicked Deploy
- [ ] Got success message

#### 9. sync-batch-payment ✓
- [ ] Copied code from supabase/functions/sync-batch-payment/index.ts
- [ ] Created function with name: sync-batch-payment
- [ ] Pasted code
- [ ] Clicked Deploy
- [ ] Got success message

#### 10. extract-pdf-questions ✓
- [ ] Copied code from supabase/functions/extract-pdf-questions/index.ts
- [ ] Created function with name: extract-pdf-questions
- [ ] Pasted code
- [ ] Clicked Deploy
- [ ] Got success message

**All 10 Deployed?** ✓

---

## 4️⃣ CREATE DATABASE TABLES (5 MINUTES)

### Open SQL Editor in Supabase

Link: https://app.supabase.com/project/ngduavjaiqyiqjzelfpl/sql

### Create New Query

```
[ ] Click "New query" or "+"
[ ] Blank query
```

### Copy & Paste Schema

```
Step 1: Open file: supabase/migrations/001_initial_schema.sql
Step 2: Select all (Ctrl+A)
Step 3: Copy (Ctrl+C)
Step 4: Go to Supabase SQL Editor
Step 5: Click in the editor area
Step 6: Paste (Ctrl+V)
Step 7: Click "Run" (or Ctrl+Enter)
Step 8: Wait for success message
```

**Database Ready?** ✓

---

## 5️⃣ TEST YOUR SETUP (5 MINUTES)

### Install Dependencies

```bash
npm install
```

**Done?** ✓

### Start Development Server

```bash
npm run dev
```

**Running?** ✓ (Should see: "Local: http://localhost:5173")

### Open in Browser

```
http://localhost:5173
```

**Loaded?** ✓

### Test JEEnie (AI Doubt Solver)

```
1. Find "JEEnie" or "Ask AI" section
2. Type: "What is photosynthesis?"
3. Should get response using Gemini ✅
```

**Working?** ✓

### Test Text-to-Speech (Now with Gemini!)

```
1. Find "Text-to-Speech" section
2. Enter any text
3. Should generate audio using Gemini ✅
```

**Working?** ✓

### Check Browser Console (F12)

```
Should NOT see any red errors ✅
Should see "Supabase connected" or similar ✅
```

**Clean?** ✓

---

## ✅ COMPLETION CHECKLIST

### Secrets
- [ ] GEMINI_API_KEY added
- [ ] RAZORPAY_KEY_SECRET added

### Functions (All 10)
- [ ] jeenie deployed
- [ ] text-to-speech deployed (Gemini version!)
- [ ] voice-to-text deployed
- [ ] calculate-topic-mastery deployed
- [ ] generate-study-plan deployed
- [ ] create-razorpay-order deployed
- [ ] verify-payment deployed
- [ ] create-batch-order deployed
- [ ] sync-batch-payment deployed
- [ ] extract-pdf-questions deployed

### Database
- [ ] Schema migration executed
- [ ] All tables created in Supabase

### Testing
- [ ] npm install successful
- [ ] npm run dev starts
- [ ] App loads at localhost:5173
- [ ] JEEnie responds
- [ ] Text-to-Speech works
- [ ] No console errors

---

## 🎉 YOU'RE DONE!

If all checkmarks are ✓, then:

✅ **Your Jeenius 1.0 is PRODUCTION READY!**

You can now:
- Deploy to production
- Share with users
- Add more questions
- Enable payments

---

## 📞 IF SOMETHING FAILS

### "GEMINI_API_KEY not configured"
- Check: Did you add it to Supabase Secrets?
- Fix: Go to Settings → Secrets → Verify it's there

### "Function not found"
- Check: Is it deployed in Functions section?
- Fix: Go to Functions → Verify all 10 are there

### "Cannot connect to database"
- Check: Did you run the SQL migration?
- Fix: Go to SQL Editor → Run the migration again

### "Blank page in browser"
- Check: Are there errors in browser console (F12)?
- Fix: Check the errors and follow the fix instructions

---

## 💡 PRO TIPS

✨ **Save time:**
- Keep all browser tabs open (Supabase, VS Code, Browser)
- Copy code from editor to Supabase side-by-side
- Don't close terminal while testing

✨ **Stay organized:**
- Check off each step as you complete it
- Take screenshots of successful deployments
- Save API keys securely

✨ **Debug faster:**
- Check browser console (F12) first
- Check Supabase function logs
- Verify secrets are definitely set

---

## 🏁 SUMMARY

| Task | Time | Done |
|------|------|------|
| Get API Keys | 5 min | [ ] |
| Add Secrets | 5 min | [ ] |
| Deploy Functions | 10 min | [ ] |
| Database Setup | 5 min | [ ] |
| Test & Verify | 5 min | [ ] |
| **TOTAL** | **30 min** | [ ] DONE! |

---

**GOOD LUCK! YOU'VE GOT THIS!** 🚀

Start with Step 1: Get your Gemini API key!

---

*Created: February 21, 2026*  
*Project: Jeenius 1.0*  
*Status: Ready for Deployment*
