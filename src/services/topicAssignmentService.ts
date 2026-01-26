/**
 * Topic Assignment Service
 * 
 * NLP-based automatic topic assignment for extracted questions
 * Uses keyword matching, TF-IDF similarity, and confidence scoring
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export interface AssignmentResult {
  chapterId: string | null;
  topicId: string | null;
  confidence: number;
  method: 'auto' | 'suggested' | 'manual';
  keywords: string[];
  matchedChapter?: {
    id: string;
    name: string;
  };
  matchedTopic?: {
    id: string;
    name: string;
  };
}

export interface TopicKeyword {
  id: string;
  chapter_id: string;
  topic_id: string | null;
  keywords: string[];
  chapter?: {
    chapter_name: string;
    subject: string;
  };
  topic?: {
    topic_name: string;
  };
}

/**
 * Extract keywords from text using NLP techniques
 */
export function extractKeywords(text: string): string[] {
  if (!text) return [];

  // Convert to lowercase
  const cleaned = text.toLowerCase()
    // Remove special characters but keep mathematical terms
    .replace(/[^\w\s+\-*/=^()]/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Split into words
  const words = cleaned.split(' ');

  // Stop words to filter out
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'should', 'could', 'may', 'might', 'must', 'can', 'what', 'which',
    'who', 'when', 'where', 'why', 'how', 'this', 'that', 'these', 'those',
    'if', 'then', 'than', 'such', 'some', 'any', 'each', 'every', 'all',
    'both', 'either', 'neither', 'not', 'only', 'own', 'same', 'so', 'as'
  ]);

  // Filter and deduplicate
  const keywords = Array.from(new Set(
    words.filter(word => 
      word.length >= 3 && 
      !stopWords.has(word) &&
      /^[a-z0-9]/.test(word)
    )
  ));

  return keywords;
}

/**
 * Calculate Jaccard similarity between two sets of keywords
 */
export function calculateSimilarity(keywords1: string[], keywords2: string[]): number {
  if (!keywords1.length || !keywords2.length) return 0;

  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);

  // Intersection
  const intersection = new Set([...set1].filter(x => set2.has(x)));

  // Union
  const union = new Set([...set1, ...set2]);

  // Jaccard similarity
  return (intersection.size / union.size) * 100;
}

/**
 * Calculate TF-IDF weighted similarity (more advanced)
 */
export function calculateWeightedSimilarity(
  questionKeywords: string[],
  topicKeywords: string[],
  allTopicKeywords: string[][] // All keywords from all topics (for IDF calculation)
): number {
  if (!questionKeywords.length || !topicKeywords.length) return 0;

  // Calculate IDF (Inverse Document Frequency)
  const idf = new Map<string, number>();
  const totalDocs = allTopicKeywords.length;

  questionKeywords.forEach(keyword => {
    const docsWithKeyword = allTopicKeywords.filter(keywords => 
      keywords.includes(keyword)
    ).length;

    if (docsWithKeyword > 0) {
      idf.set(keyword, Math.log(totalDocs / docsWithKeyword));
    }
  });

  // Calculate TF (Term Frequency) for question
  const questionTF = new Map<string, number>();
  questionKeywords.forEach(keyword => {
    questionTF.set(keyword, (questionTF.get(keyword) || 0) + 1);
  });

  // Calculate TF for topic
  const topicTF = new Map<string, number>();
  topicKeywords.forEach(keyword => {
    topicTF.set(keyword, (topicTF.get(keyword) || 0) + 1);
  });

  // Calculate TF-IDF vectors
  const questionVector: number[] = [];
  const topicVector: number[] = [];
  const allKeywords = new Set([...questionKeywords, ...topicKeywords]);

  allKeywords.forEach(keyword => {
    const qTF = questionTF.get(keyword) || 0;
    const tTF = topicTF.get(keyword) || 0;
    const idfValue = idf.get(keyword) || 0;

    questionVector.push(qTF * idfValue);
    topicVector.push(tTF * idfValue);
  });

  // Calculate cosine similarity
  const dotProduct = questionVector.reduce((sum, val, i) => 
    sum + val * topicVector[i], 0
  );

  const questionMagnitude = Math.sqrt(
    questionVector.reduce((sum, val) => sum + val * val, 0)
  );

  const topicMagnitude = Math.sqrt(
    topicVector.reduce((sum, val) => sum + val * val, 0)
  );

  if (questionMagnitude === 0 || topicMagnitude === 0) return 0;

  return (dotProduct / (questionMagnitude * topicMagnitude)) * 100;
}

/**
 * Fetch all topic keywords from database
 */
export async function fetchTopicKeywords(subject?: string): Promise<TopicKeyword[]> {
  try {
    let query = supabase
      .from('topic_keywords')
      .select(`
        id,
        chapter_id,
        topic_id,
        keywords,
        chapters:chapter_id (
          id,
          chapter_name,
          subject
        ),
        topics:topic_id (
          id,
          topic_name
        )
      `);

    if (subject) {
      query = query.eq('chapters.subject', subject);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      chapter_id: item.chapter_id,
      topic_id: item.topic_id,
      keywords: item.keywords,
      chapter: item.chapters ? {
        chapter_name: item.chapters.chapter_name,
        subject: item.chapters.subject
      } : undefined,
      topic: item.topics ? {
        topic_name: item.topics.topic_name
      } : undefined
    }));
  } catch (error) {
    logger.error('Error fetching topic keywords:', error);
    return [];
  }
}

/**
 * Auto-assign chapter and topic to a question using NLP
 */
export async function autoAssignTopic(
  questionText: string,
  subject: string,
  chapterHint?: string
): Promise<AssignmentResult> {
  try {
    // Extract keywords from question
    const questionKeywords = extractKeywords(questionText);

    if (questionKeywords.length === 0) {
      return {
        chapterId: null,
        topicId: null,
        confidence: 0,
        method: 'manual',
        keywords: []
      };
    }

    logger.info('Extracted keywords:', questionKeywords);

    // Fetch topic keywords from database
    const topicKeywords = await fetchTopicKeywords(subject);

    if (topicKeywords.length === 0) {
      logger.warn('No topic keywords found for subject:', subject);
      return {
        chapterId: null,
        topicId: null,
        confidence: 0,
        method: 'manual',
        keywords: questionKeywords
      };
    }

    // Calculate similarities for all topics
    const allKeywordSets = topicKeywords.map(tk => tk.keywords);
    
    const matches = topicKeywords.map(topicKeyword => {
      // Use both Jaccard and TF-IDF, take average
      const jaccardScore = calculateSimilarity(
        questionKeywords,
        topicKeyword.keywords
      );

      const tfidfScore = calculateWeightedSimilarity(
        questionKeywords,
        topicKeyword.keywords,
        allKeywordSets
      );

      // Weighted average (60% TF-IDF, 40% Jaccard)
      const score = (tfidfScore * 0.6) + (jaccardScore * 0.4);

      // Boost score if chapter hint matches
      let boostedScore = score;
      if (chapterHint && topicKeyword.chapter?.chapter_name) {
        const chapterMatch = topicKeyword.chapter.chapter_name
          .toLowerCase()
          .includes(chapterHint.toLowerCase()) ||
          chapterHint.toLowerCase()
            .includes(topicKeyword.chapter.chapter_name.toLowerCase());
        
        if (chapterMatch) {
          boostedScore = score * 1.3; // 30% boost
        }
      }

      return {
        ...topicKeyword,
        score: boostedScore,
        originalScore: score
      };
    });

    // Sort by score
    matches.sort((a, b) => b.score - a.score);

    const bestMatch = matches[0];

    if (!bestMatch || bestMatch.score < 30) {
      // Too low confidence, require manual review
      return {
        chapterId: null,
        topicId: null,
        confidence: bestMatch?.score || 0,
        method: 'manual',
        keywords: questionKeywords
      };
    }

    logger.info('Best match:', {
      chapter: bestMatch.chapter?.chapter_name,
      topic: bestMatch.topic?.topic_name,
      score: bestMatch.score
    });

    // Determine assignment method based on confidence
    const method = bestMatch.score >= 75 ? 'auto' : 'suggested';

    return {
      chapterId: bestMatch.chapter_id,
      topicId: bestMatch.topic_id,
      confidence: Math.round(bestMatch.score * 100) / 100,
      method,
      keywords: questionKeywords,
      matchedChapter: bestMatch.chapter ? {
        id: bestMatch.chapter_id,
        name: bestMatch.chapter.chapter_name
      } : undefined,
      matchedTopic: bestMatch.topic ? {
        id: bestMatch.topic_id,
        name: bestMatch.topic.topic_name
      } : undefined
    };
  } catch (error) {
    logger.error('Error in auto-assign topic:', error);
    return {
      chapterId: null,
      topicId: null,
      confidence: 0,
      method: 'manual',
      keywords: []
    };
  }
}

/**
 * Bulk auto-assign topics to multiple questions
 */
export async function bulkAutoAssign(questionIds: string[]): Promise<{
  processed: number;
  autoAssigned: number;
  suggested: number;
  failed: number;
}> {
  let processed = 0;
  let autoAssigned = 0;
  let suggested = 0;
  let failed = 0;

  for (const questionId of questionIds) {
    try {
      // Fetch question from queue
      const { data: question, error } = await supabase
        .from('extracted_questions_queue')
        .select('*')
        .eq('id', questionId)
        .single();

      if (error || !question) {
        failed++;
        continue;
      }

      const parsed = question.parsed_question as any;
      
      // Auto-assign
      const result = await autoAssignTopic(
        parsed.question || '',
        parsed.subject || '',
        parsed.chapter
      );

      // Update queue with assignment
      await supabase
        .from('extracted_questions_queue')
        .update({
          auto_assigned_chapter_id: result.chapterId,
          auto_assigned_topic_id: result.topicId,
          confidence_score: result.confidence,
          assignment_method: result.method
        })
        .eq('id', questionId);

      processed++;

      if (result.method === 'auto') {
        autoAssigned++;
      } else if (result.method === 'suggested') {
        suggested++;
      }

    } catch (error) {
      logger.error(`Error processing question ${questionId}:`, error);
      failed++;
    }
  }

  return {
    processed,
    autoAssigned,
    suggested,
    failed
  };
}

/**
 * Add or update keywords for a topic/chapter
 */
export async function updateTopicKeywords(
  chapterId: string,
  topicId: string | null,
  keywords: string[]
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('topic_keywords')
      .upsert({
        chapter_id: chapterId,
        topic_id: topicId,
        keywords
      }, {
        onConflict: 'chapter_id,topic_id'
      });

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Error updating topic keywords:', error);
    return false;
  }
}

/**
 * Get statistics for auto-assignment performance
 */
export async function getAssignmentStats(): Promise<{
  total: number;
  autoAssigned: number;
  suggested: number;
  manual: number;
  avgConfidence: number;
}> {
  try {
    const { data, error } = await supabase
      .from('extracted_questions_queue')
      .select('assignment_method, confidence_score');

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      autoAssigned: data?.filter(q => q.assignment_method === 'auto').length || 0,
      suggested: data?.filter(q => q.assignment_method === 'suggested').length || 0,
      manual: data?.filter(q => !q.assignment_method || q.assignment_method === 'manual').length || 0,
      avgConfidence: 0
    };

    if (data && data.length > 0) {
      const totalConfidence = data.reduce((sum, q) => 
        sum + (q.confidence_score || 0), 0
      );
      stats.avgConfidence = Math.round(totalConfidence / data.length * 100) / 100;
    }

    return stats;
  } catch (error) {
    logger.error('Error getting assignment stats:', error);
    return {
      total: 0,
      autoAssigned: 0,
      suggested: 0,
      manual: 0,
      avgConfidence: 0
    };
  }
}
