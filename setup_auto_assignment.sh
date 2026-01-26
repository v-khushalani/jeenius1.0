#!/bin/bash

# Quick Setup Script for NLP Auto-Assignment System
# Run this after pulling the changes

echo "🚀 Setting up NLP Auto-Assignment System..."
echo ""

# Step 1: Apply database migration
echo "📦 Step 1: Applying database migration..."
echo "Run: supabase db push"
echo ""

# Step 2: Restart dev server
echo "🔄 Step 2: Restart development server..."
echo "Run: bun run dev"
echo ""

# Step 3: Access admin panel
echo "🎯 Step 3: Access the auto-assignment feature..."
echo "Navigate to: http://localhost:5173/admin/auto-assign"
echo ""

# Step 4: Test the system
echo "🧪 Step 4: Test the system..."
echo "1. Upload a PDF with questions (Admin → PDF Extractor)"
echo "2. Go to Auto-Assignment tab"
echo "3. Click 'Auto-Assign All'"
echo "4. Review results in Review Queue"
echo ""

echo "✅ Setup complete! Check NLP_AUTO_ASSIGNMENT_GUIDE.md for detailed documentation."
echo ""

# Display key features
echo "🎯 Key Features:"
echo "  ✅ Keyword extraction with stop-word filtering"
echo "  ✅ TF-IDF + Cosine similarity matching"
echo "  ✅ Jaccard similarity for keyword overlap"
echo "  ✅ Confidence-based auto/suggested/manual assignment"
echo "  ✅ Bulk processing for hundreds of questions"
echo "  ✅ Real-time statistics and performance metrics"
echo "  ✅ Pre-populated keywords for Physics, Chemistry, Math"
echo ""

echo "📊 Confidence Thresholds:"
echo "  ≥75%  → Auto-assign (high confidence)"
echo "  50-75% → Suggest (review recommended)"
echo "  <50%  → Manual (low confidence)"
echo ""

echo "🎓 Algorithm:"
echo "  1. Extract keywords from question text"
echo "  2. Calculate TF-IDF vectors"
echo "  3. Compute cosine similarity"
echo "  4. Calculate Jaccard similarity"
echo "  5. Weighted average: 60% TF-IDF + 40% Jaccard"
echo "  6. Apply confidence thresholds"
echo ""

echo "Happy assigning! 🎉"
