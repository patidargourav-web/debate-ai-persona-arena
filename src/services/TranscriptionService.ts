
interface TranscriptEntry {
  speaker: 'AI' | 'Person';
  text: string;
  timestamp: number;
  confidence?: number;
}

class TranscriptionService {
  private subscribers: Set<(transcript: TranscriptEntry[]) => void> = new Set();
  private transcriptHistory: TranscriptEntry[] = [];
  private currentUserSpeech: string = '';
  private isUserSpeaking: boolean = false;

  subscribe(callback: (transcript: TranscriptEntry[]) => void) {
    this.subscribers.add(callback);
    // Immediately send current state
    callback(this.transcriptHistory);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback([...this.transcriptHistory]));
  }

  addUserTranscript(text: string, confidence?: number) {
    if (!text.trim()) return;
    
    console.log('TranscriptionService: Adding user transcript:', text);
    
    // Avoid duplicates
    const lastEntry = this.transcriptHistory[this.transcriptHistory.length - 1];
    if (lastEntry && lastEntry.speaker === 'Person' && lastEntry.text === text) {
      return;
    }

    const entry: TranscriptEntry = {
      speaker: 'Person',
      text: text.trim(),
      timestamp: Date.now(),
      confidence
    };

    this.transcriptHistory.push(entry);
    this.notifySubscribers();
  }

  addAITranscript(text: string) {
    if (!text.trim()) return;
    
    console.log('TranscriptionService: Adding AI transcript:', text);
    
    // Avoid duplicates
    const lastEntry = this.transcriptHistory[this.transcriptHistory.length - 1];
    if (lastEntry && lastEntry.speaker === 'AI' && lastEntry.text === text) {
      return;
    }

    const entry: TranscriptEntry = {
      speaker: 'AI',
      text: text.trim(),
      timestamp: Date.now()
    };

    this.transcriptHistory.push(entry);
    this.notifySubscribers();
  }

  updateCurrentUserSpeech(text: string) {
    this.currentUserSpeech = text;
    this.notifyCurrentSpeechSubscribers();
  }

  setUserSpeaking(speaking: boolean) {
    this.isUserSpeaking = speaking;
    this.notifyCurrentSpeechSubscribers();
  }

  getCurrentUserSpeech() {
    return this.currentUserSpeech;
  }

  getIsUserSpeaking() {
    return this.isUserSpeaking;
  }

  private currentSpeechSubscribers: Set<(speech: string, speaking: boolean) => void> = new Set();

  subscribeToCurrentSpeech(callback: (speech: string, speaking: boolean) => void) {
    this.currentSpeechSubscribers.add(callback);
    callback(this.currentUserSpeech, this.isUserSpeaking);
    
    return () => {
      this.currentSpeechSubscribers.delete(callback);
    };
  }

  private notifyCurrentSpeechSubscribers() {
    this.currentSpeechSubscribers.forEach(callback => 
      callback(this.currentUserSpeech, this.isUserSpeaking)
    );
  }

  getTranscriptHistory() {
    return [...this.transcriptHistory];
  }

  clearHistory() {
    this.transcriptHistory = [];
    this.currentUserSpeech = '';
    this.isUserSpeaking = false;
    this.notifySubscribers();
    this.notifyCurrentSpeechSubscribers();
  }
}

// Create singleton instance
export const transcriptionService = new TranscriptionService();
