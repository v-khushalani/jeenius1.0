/**
 * Test Auto-Assignment System
 * 
 * Run this in browser console or create a test page
 */

import { autoAssignTopic } from '@/services/topicAssignmentService';

// Test cases for different subjects
export const testCases = [
  {
    question: "A block of mass 5 kg is placed on a frictionless surface. If a force of 20 N is applied horizontally, find the acceleration of the block.",
    subject: "Physics",
    expectedChapter: "Newton's Laws",
    expectedKeywords: ['force', 'mass', 'acceleration', 'block']
  },
  {
    question: "Calculate the work done when a force of 10 N moves an object through a distance of 5 m in the direction of the force.",
    subject: "Physics",
    expectedChapter: "Work, Energy and Power",
    expectedKeywords: ['work', 'force', 'distance']
  },
  {
    question: "Find the pH of a solution having hydrogen ion concentration of 1 × 10^-5 M.",
    subject: "Chemistry",
    expectedChapter: "Acids and Bases",
    expectedKeywords: ['ph', 'hydrogen', 'ion', 'concentration']
  },
  {
    question: "Balance the redox reaction: MnO4- + Fe2+ → Mn2+ + Fe3+",
    subject: "Chemistry",
    expectedChapter: "Redox Reactions",
    expectedKeywords: ['redox', 'oxidation', 'reduction', 'balance']
  },
  {
    question: "Find the derivative of f(x) = 3x^2 + 5x + 7 with respect to x.",
    subject: "Mathematics",
    expectedChapter: "Differentiation",
    expectedKeywords: ['derivative', 'differentiation', 'function']
  },
  {
    question: "If sin θ = 3/5, find the value of cos θ.",
    subject: "Mathematics",
    expectedChapter: "Trigonometry",
    expectedKeywords: ['sine', 'cosine', 'angle', 'trigonometric']
  }
];

/**
 * Run all test cases
 */
export async function runTests() {
  console.log('🧪 Starting Auto-Assignment Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testCases) {
    console.log(`\n📝 Testing: "${test.question.substring(0, 50)}..."`);
    console.log(`   Subject: ${test.subject}`);
    console.log(`   Expected: ${test.expectedChapter}`);
    
    try {
      const result = await autoAssignTopic(
        test.question,
        test.subject
      );
      
      console.log(`   ✅ Result:`);
      console.log(`      - Confidence: ${result.confidence}%`);
      console.log(`      - Method: ${result.method}`);
      console.log(`      - Chapter: ${result.matchedChapter?.name || 'None'}`);
      console.log(`      - Topic: ${result.matchedTopic?.name || 'None'}`);
      console.log(`      - Keywords: ${result.keywords.slice(0, 5).join(', ')}`);
      
      if (result.confidence >= 50) {
        passed++;
        console.log(`   ✅ PASSED (Confidence ≥50%)`);
      } else {
        failed++;
        console.log(`   ⚠️  LOW CONFIDENCE (${result.confidence}%)`);
      }
    } catch (error) {
      failed++;
      console.error(`   ❌ FAILED:`, error);
    }
  }
  
  console.log(`\n\n📊 Test Summary:`);
  console.log(`   ✅ Passed: ${passed}/${testCases.length}`);
  console.log(`   ❌ Failed/Low: ${failed}/${testCases.length}`);
  console.log(`   🎯 Success Rate: ${Math.round((passed / testCases.length) * 100)}%`);
}

/**
 * Test keyword extraction
 */
export function testKeywordExtraction() {
  const { extractKeywords } = require('@/services/topicAssignmentService');
  
  console.log('🔤 Testing Keyword Extraction:\n');
  
  const samples = [
    "A force of 10 N is applied to a mass of 2 kg",
    "Calculate the pH of the solution",
    "Find the derivative of f(x) = x^2 + 3x"
  ];
  
  samples.forEach(sample => {
    const keywords = extractKeywords(sample);
    console.log(`Text: "${sample}"`);
    console.log(`Keywords: ${keywords.join(', ')}\n`);
  });
}

/**
 * Test similarity calculation
 */
export function testSimilarity() {
  const { calculateSimilarity } = require('@/services/topicAssignmentService');
  
  console.log('📊 Testing Similarity Calculation:\n');
  
  const tests = [
    {
      keywords1: ['force', 'mass', 'acceleration'],
      keywords2: ['force', 'mass', 'acceleration', 'newton'],
      expected: 'High (75%+)'
    },
    {
      keywords1: ['acid', 'base', 'ph'],
      keywords2: ['force', 'mass', 'acceleration'],
      expected: 'Low (0%)'
    },
    {
      keywords1: ['derivative', 'function', 'calculus'],
      keywords2: ['differential', 'function', 'calculus'],
      expected: 'Medium (50-75%)'
    }
  ];
  
  tests.forEach(test => {
    const similarity = calculateSimilarity(test.keywords1, test.keywords2);
    console.log(`Keywords 1: ${test.keywords1.join(', ')}`);
    console.log(`Keywords 2: ${test.keywords2.join(', ')}`);
    console.log(`Similarity: ${similarity.toFixed(2)}% (Expected: ${test.expected})\n`);
  });
}

// Export for use in console
if (typeof window !== 'undefined') {
  (window as any).testAutoAssignment = {
    runTests,
    testKeywordExtraction,
    testSimilarity,
    testCases
  };
  
  console.log('✨ Auto-Assignment Tests loaded!');
  console.log('Run: window.testAutoAssignment.runTests()');
}
