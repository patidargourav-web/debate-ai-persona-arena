
import { useState, useCallback } from 'react';

interface DebateMetrics {
  argumentStrength: number;
  emotionalTone: number;
  engagement: number;
  structure: {
    hasOpening: boolean;
    hasArgument: boolean;
    hasRebuttal: boolean;
    hasConclusion: boolean;
  };
  topicRelevance: number;
}

export const useDebateAnalysis = () => {
  const [metrics, setMetrics] = useState<DebateMetrics>({
    argumentStrength: 0,
    emotionalTone: 75, // Neutral balanced score
    engagement: 0,
    structure: {
      hasOpening: false,
      hasArgument: false,
      hasRebuttal: false,
      hasConclusion: false,
    },
    topicRelevance: 0,
  });

  const analyzeDebateContent = useCallback((transcript: string, confidence: number) => {
    const words = transcript.toLowerCase().split(/\s+/);
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Analyze argument strength based on evidence keywords
    const evidenceKeywords = ['research', 'study', 'data', 'evidence', 'proof', 'statistics', 'fact'];
    const evidenceCount = words.filter(word => evidenceKeywords.includes(word)).length;
    const argumentStrength = Math.min(100, (evidenceCount / words.length) * 1000 + confidence * 50);

    // Analyze emotional tone (0-100 scale, where 50 is neutral, >50 is positive, <50 is negative)
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'beneficial', 'improve', 'effective', 'strong'];
    const negativeWords = ['bad', 'terrible', 'wrong', 'harmful', 'negative', 'worse', 'fail', 'weak'];
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    // Calculate emotional tone as a score (0-100)
    const totalEmotionalWords = positiveCount + negativeCount;
    let emotionalTone = 75; // Default neutral-positive
    if (totalEmotionalWords > 0) {
      emotionalTone = Math.round(50 + ((positiveCount - negativeCount) / totalEmotionalWords) * 50);
      emotionalTone = Math.max(0, Math.min(100, emotionalTone)); // Clamp between 0-100
    }

    // Analyze engagement based on variety and complexity
    const uniqueWords = new Set(words);
    const engagement = Math.min(100, (uniqueWords.size / words.length) * 100 + sentences.length * 2);

    // Analyze structure
    const openingKeywords = ['first', 'initially', 'to begin', 'introduction'];
    const argumentKeywords = ['because', 'therefore', 'however', 'furthermore'];
    const rebuttalKeywords = ['but', 'although', 'despite', 'counter'];
    const conclusionKeywords = ['conclusion', 'finally', 'in summary', 'therefore'];

    const structure = {
      hasOpening: openingKeywords.some(keyword => transcript.toLowerCase().includes(keyword)),
      hasArgument: argumentKeywords.some(keyword => transcript.toLowerCase().includes(keyword)),
      hasRebuttal: rebuttalKeywords.some(keyword => transcript.toLowerCase().includes(keyword)),
      hasConclusion: conclusionKeywords.some(keyword => transcript.toLowerCase().includes(keyword)),
    };

    // Topic relevance (simplified - would use more sophisticated NLP in production)
    const climateKeywords = ['climate', 'carbon', 'emission', 'renewable', 'fossil', 'environment'];
    const relevantWords = words.filter(word => climateKeywords.includes(word));
    const topicRelevance = Math.min(100, (relevantWords.length / words.length) * 200);

    setMetrics({
      argumentStrength: Math.round(argumentStrength),
      emotionalTone: Math.round(emotionalTone),
      engagement: Math.round(engagement),
      structure,
      topicRelevance: Math.round(topicRelevance),
    });
  }, []);

  return { metrics, analyzeDebateContent };
};
