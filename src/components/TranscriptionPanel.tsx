import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TranscriptionEntry {
  id: string;
  speaker_type: 'user' | 'opponent';
  content: string;
  timestamp_start: number;
  confidence: number;
  created_at: string;
}

interface TranscriptionPanelProps {
  transcriptions: TranscriptionEntry[];
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isLoading: boolean;
}

export const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({
  transcriptions,
  isRecording,
  onStartRecording,
  onStopRecording,
  isLoading
}) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-success';
    if (confidence >= 0.6) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Live Transcription</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant={isRecording ? "destructive" : "default"}
            size="sm"
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isLoading}
          >
            {isRecording ? (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              Recording
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-64 w-full pr-4">
          {transcriptions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No transcriptions yet. Start recording to see live transcripts.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transcriptions.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-lg border ${
                    entry.speaker_type === 'user'
                      ? 'bg-primary/10 border-primary/20'
                      : 'bg-muted border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {entry.speaker_type === 'user' ? (
                        <Mic className="w-4 h-4 text-primary" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                      )}
                      <Badge variant={entry.speaker_type === 'user' ? 'default' : 'secondary'}>
                        {entry.speaker_type === 'user' ? 'You' : 'AI Opponent'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getConfidenceColor(entry.confidence)}`}
                      >
                        {Math.round(entry.confidence * 100)}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(entry.timestamp_start)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed">{entry.content}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="mt-4 text-xs text-muted-foreground">
          <p>💡 Tip: Speak clearly and avoid background noise for better transcription accuracy.</p>
        </div>
      </CardContent>
    </Card>
  );
};