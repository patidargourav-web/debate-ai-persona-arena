import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Extend window type for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
  start(): void;
  stop(): void;
}

interface TranscriptionEntry {
  id: string;
  debate_id: string;
  user_id: string;
  speaker_type: 'user' | 'opponent';
  content: string;
  timestamp_start: number;
  timestamp_end?: number;
  confidence: number;
  created_at: string;
}

export const useTranscription = (debateId?: string) => {
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive"
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = async (event) => {
      if (!debateId || !user) return;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const transcriptText = result[0].transcript.trim();
          if (transcriptText) {
            await saveTranscription({
              debate_id: debateId,
              user_id: user.id,
              speaker_type: 'user',
              content: transcriptText,
              timestamp_start: Date.now(),
              confidence: result[0].confidence || 0.8
            });
          }
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [debateId, user]);

  // Load existing transcriptions
  useEffect(() => {
    if (!debateId) return;

    const loadTranscriptions = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('debate_id', debateId)
        .order('timestamp_start', { ascending: true });

      if (error) {
        console.error('Error loading transcriptions:', error);
      } else if (data) {
        setTranscriptions(data as TranscriptionEntry[]);
      }
      setIsLoading(false);
    };

    loadTranscriptions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`transcriptions-${debateId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transcriptions',
          filter: `debate_id=eq.${debateId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTranscriptions(prev => [...prev, payload.new as TranscriptionEntry]);
          } else if (payload.eventType === 'UPDATE') {
            setTranscriptions(prev => 
              prev.map(t => t.id === payload.new.id ? payload.new as TranscriptionEntry : t)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [debateId]);

  const saveTranscription = async (transcription: Omit<TranscriptionEntry, 'id' | 'created_at'>) => {
    const { error } = await supabase
      .from('transcriptions')
      .insert(transcription);

    if (error) {
      console.error('Error saving transcription:', error);
      toast({
        title: "Transcription Error",
        description: "Failed to save transcription.",
        variant: "destructive"
      });
    }
  };

  const startRecording = useCallback(() => {
    if (recognitionRef.current && !isRecording) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting recording:', error);
      }
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const addOpponentTranscription = useCallback(async (content: string) => {
    if (!debateId || !user) return;

    await saveTranscription({
      debate_id: debateId,
      user_id: user.id,
      speaker_type: 'opponent',
      content,
      timestamp_start: Date.now(),
      confidence: 0.9 // AI transcriptions are generally more accurate
    });
  }, [debateId, user]);

  return {
    transcriptions,
    isRecording,
    isLoading,
    startRecording,
    stopRecording,
    addOpponentTranscription
  };
};