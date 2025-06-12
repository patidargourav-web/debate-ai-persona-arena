
import { useState, useEffect } from 'react';
import { transcriptionService } from '@/services/TranscriptionService';

interface TranscriptEntry {
  speaker: 'AI' | 'Person';
  text: string;
  timestamp: number;
  confidence?: number;
}

export const useTranscription = () => {
  const [transcriptHistory, setTranscriptHistory] = useState<TranscriptEntry[]>([]);
  const [currentUserSpeech, setCurrentUserSpeech] = useState('');
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  useEffect(() => {
    const unsubscribeTranscripts = transcriptionService.subscribe(setTranscriptHistory);
    const unsubscribeCurrentSpeech = transcriptionService.subscribeToCurrentSpeech(
      (speech, speaking) => {
        setCurrentUserSpeech(speech);
        setIsUserSpeaking(speaking);
      }
    );

    return () => {
      unsubscribeTranscripts();
      unsubscribeCurrentSpeech();
    };
  }, []);

  const addUserTranscript = (text: string, confidence?: number) => {
    transcriptionService.addUserTranscript(text, confidence);
  };

  const addAITranscript = (text: string) => {
    transcriptionService.addAITranscript(text);
  };

  const updateCurrentUserSpeech = (text: string) => {
    transcriptionService.updateCurrentUserSpeech(text);
  };

  const setUserSpeaking = (speaking: boolean) => {
    transcriptionService.setUserSpeaking(speaking);
  };

  const clearHistory = () => {
    transcriptionService.clearHistory();
  };

  return {
    transcriptHistory,
    currentUserSpeech,
    isUserSpeaking,
    addUserTranscript,
    addAITranscript,
    updateCurrentUserSpeech,
    setUserSpeaking,
    clearHistory
  };
};
