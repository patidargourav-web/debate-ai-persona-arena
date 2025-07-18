import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDebateAnalysis } from './useDebateAnalysis';

interface AnalysisEntry {
  id: string;
  debate_id: string;
  user_id: string;
  analysis_type: 'live_feedback' | 'final_suggestions';
  content: string;
  metrics?: any;
  suggestions?: string[];
  created_at: string;
}

interface DebateMetrics {
  argumentStrength: number;
  emotionalTone: number;
  engagement: number;
  topicRelevance: number;
  structure: {
    hasOpening: boolean;
    hasArgument: boolean;
    hasRebuttal: boolean;
    hasConclusion: boolean;
  };
}

export const useRealTimeAnalysis = (debateId?: string, transcriptions: any[] = []) => {
  const [analysisEntries, setAnalysisEntries] = useState<AnalysisEntry[]>([]);
  const [liveFeedback, setLiveFeedback] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { user } = useAuth();
  const { metrics, analyzeDebateContent } = useDebateAnalysis();

  // Load existing analysis entries
  useEffect(() => {
    if (!debateId) return;

    const loadAnalysis = async () => {
      const { data, error } = await supabase
        .from('debate_analysis')
        .select('*')
        .eq('debate_id', debateId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setAnalysisEntries(data as AnalysisEntry[]);
      }
    };

    loadAnalysis();

    // Subscribe to real-time analysis updates
    const channel = supabase
      .channel(`analysis-${debateId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'debate_analysis',
          filter: `debate_id=eq.${debateId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAnalysisEntries(prev => [...prev, payload.new as AnalysisEntry]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [debateId]);

  // Analyze transcriptions in real-time
  useEffect(() => {
    if (!debateId || !user || transcriptions.length === 0) return;

    const userTranscriptions = transcriptions.filter(t => t.speaker_type === 'user');
    if (userTranscriptions.length === 0) return;

    setIsAnalyzing(true);
    
    // Get the latest user transcription
    const latestTranscription = userTranscriptions[userTranscriptions.length - 1];
    const allUserContent = userTranscriptions.map(t => t.content).join(' ');
    
    // Analyze the content
    analyzeDebateContent(allUserContent, latestTranscription.confidence || 0.8);
    
    // Generate live feedback
    generateLiveFeedback(latestTranscription.content, allUserContent);
    
    setIsAnalyzing(false);
  }, [transcriptions, debateId, user, analyzeDebateContent]);

  const generateLiveFeedback = useCallback((latestContent: string, allContent: string) => {
    const wordCount = latestContent.split(' ').length;
    const hasEvidence = /\b(study|research|data|statistics|evidence|according to)\b/i.test(latestContent);
    const hasPersonalAttack = /\b(stupid|idiot|wrong|terrible|awful)\b/i.test(latestContent);
    
    let feedback = '';
    
    if (wordCount < 5) {
      feedback = "Try to elaborate more on your point.";
    } else if (hasPersonalAttack) {
      feedback = "Focus on arguments, not personal attacks.";
    } else if (hasEvidence) {
      feedback = "Great use of evidence to support your argument!";
    } else if (wordCount > 50) {
      feedback = "Consider being more concise to keep your argument clear.";
    } else {
      feedback = "Good point! Consider adding supporting evidence.";
    }
    
    setLiveFeedback(feedback);
  }, []);

  const saveLiveFeedback = useCallback(async (content: string) => {
    if (!debateId || !user) return;

    const { error } = await supabase
      .from('debate_analysis')
      .insert({
        debate_id: debateId,
        user_id: user.id,
        analysis_type: 'live_feedback' as const,
        content,
        metrics: metrics as any,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving live feedback:', error);
    }
  }, [debateId, user, metrics]);

  const generateFinalSuggestions = useCallback(async (allTranscriptions: any[]) => {
    if (!debateId || !user) return;

    const userContent = allTranscriptions
      .filter(t => t.speaker_type === 'user')
      .map(t => t.content)
      .join(' ');

    // Generate comprehensive suggestions
    const suggestions = [
      'Structure your arguments more clearly with opening statements',
      'Use more concrete examples and evidence',
      'Practice active listening and responding to opponent points',
      'Work on smoother transitions between topics',
      'Strengthen your closing arguments'
    ];

    const finalAnalysis = `
    Debate Performance Summary:
    
    Strengths:
    - ${metrics.argumentStrength > 70 ? 'Strong logical arguments' : 'Room for improvement in argument structure'}
    - ${metrics.engagement > 70 ? 'High engagement level' : 'Consider more dynamic delivery'}
    
    Areas for Improvement:
    - ${metrics.structure.hasOpening ? 'Good opening' : 'Work on stronger opening statements'}
    - ${metrics.structure.hasConclusion ? 'Strong conclusion' : 'Practice impactful conclusions'}
    
    Overall Score: ${Math.round((metrics.argumentStrength + metrics.engagement + metrics.topicRelevance) / 3)}%
    `;

    const { error } = await supabase
      .from('debate_analysis')
      .insert({
        debate_id: debateId,
        user_id: user.id,
        analysis_type: 'final_suggestions' as const,
        content: finalAnalysis,
        metrics: metrics as any,
        suggestions,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving final suggestions:', error);
    }
  }, [debateId, user, metrics]);

  return {
    analysisEntries,
    liveFeedback,
    metrics,
    isAnalyzing,
    saveLiveFeedback,
    generateFinalSuggestions
  };
};