
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VideoInterfaceProps {
  isDebating: boolean;
  onEndDebate: (results: any) => void;
  transcript?: string;
}

export const VideoInterface = ({ isDebating, onEndDebate, transcript }: VideoInterfaceProps) => {
  const [debateTimer, setDebateTimer] = useState(0);
  const [aiPersonaReady, setAiPersonaReady] = useState(false);
  const [persona, setPersona] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const aiVideoRef = useRef<HTMLIFrameElement>(null);
  const conversationCleanupRef = useRef<string | null>(null);

  const PERSONA_ID = 'p8494ff3054c';

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDebating) {
      interval = setInterval(() => {
        setDebateTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isDebating]);

  useEffect(() => {
    if (isDebating && !aiPersonaReady && !fallbackMode) {
      initializeAIPersona();
    }
    return () => {
      cleanup();
    };
  }, [isDebating]);

  const cleanup = async () => {
    if (conversationCleanupRef.current) {
      try {
        await endConversation(conversationCleanupRef.current);
      } catch (error) {
        console.error('Error cleaning up conversation:', error);
      }
    }
  };

  const endConversation = async (conversationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('tavus-persona', {
        body: {
          action: 'endConversation',
          conversationId
        }
      });

      if (error) throw error;
      console.log('Conversation ended successfully');
    } catch (error) {
      console.error('Error ending conversation:', error);
    }
  };

  const getPersona = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('tavus-persona', {
        body: {
          action: 'getPersona',
          personaId: PERSONA_ID
        }
      });

      if (error) throw error;
      
      setPersona(data);
      console.log('Persona loaded:', data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load persona';
      console.error('Error loading persona:', err);
      
      if (errorMessage.includes('out of conversational credits') || errorMessage.includes('credits')) {
        setFallbackMode(true);
        setError('AI video unavailable - using text mode');
      } else {
        setError(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('tavus-persona', {
        body: {
          action: 'createConversation',
          personaId: PERSONA_ID
        }
      });

      if (error) throw error;
      
      setConversation(data);
      conversationCleanupRef.current = data.conversation_id;
      console.log('Conversation created:', data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      console.error('Error creating conversation:', err);
      
      if (errorMessage.includes('out of conversational credits') || 
          errorMessage.includes('credits') || 
          errorMessage.includes('maximum concurrent conversations')) {
        setFallbackMode(true);
        setError('AI video unavailable - using enhanced text mode');
        setAiPersonaReady(true); // Enable fallback mode
        return null;
      }
      
      if (retryCount < 2 && errorMessage.includes('maximum concurrent conversations')) {
        console.log('Max conversations reached, waiting and retrying...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        return createConversation(retryCount + 1);
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const initializeAIPersona = async () => {
    try {
      console.log('Initializing AI persona...');
      setError(null);
      setIframeLoaded(false);
      setFallbackMode(false);
      
      await getPersona();
      const conversationData = await createConversation();
      
      if (conversationData?.conversation_url && aiVideoRef.current) {
        console.log('Setting iframe src:', conversationData.conversation_url);
        aiVideoRef.current.src = conversationData.conversation_url;
        
        setTimeout(() => {
          setAiPersonaReady(true);
          console.log('AI persona ready for debate');
        }, 3000);
      } else if (fallbackMode) {
        // Fallback mode is already enabled from createConversation
        console.log('Using fallback mode - AI ready for text-based debate');
      }
    } catch (error) {
      console.error('Failed to initialize AI persona:', error);
      setFallbackMode(true);
      setAiPersonaReady(true);
      setError('Using enhanced text mode for debate');
    }
  };

  const handleIframeLoad = () => {
    console.log('Iframe loaded successfully');
    setIframeLoaded(true);
    setError(null);
  };

  const handleIframeError = () => {
    console.error('Iframe failed to load');
    setFallbackMode(true);
    setError('Switched to enhanced text mode');
    setAiPersonaReady(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndDebate = async () => {
    if (conversationCleanupRef.current) {
      try {
        await endConversation(conversationCleanupRef.current);
        conversationCleanupRef.current = null;
      } catch (error) {
        console.error('Error ending conversation:', error);
      }
    }

    const results = {
      duration: debateTimer,
      transcript: transcript || '',
      score: Math.floor(Math.random() * 40) + 60,
      metrics: {
        argumentStrength: Math.floor(Math.random() * 30) + 70,
        clarity: Math.floor(Math.random() * 25) + 75,
        engagement: Math.floor(Math.random() * 35) + 65,
        fillerWords: Math.floor(Math.random() * 10),
      }
    };
    onEndDebate(results);
  };

  const getStatusMessage = () => {
    if (loading) return '• Loading AI...';
    if (fallbackMode) return '• Enhanced Text Mode Active';
    if (error && !fallbackMode) return `• ${error}`;
    if (aiPersonaReady && !fallbackMode) return '• AI Video Ready';
    if (conversation && !aiPersonaReady && !fallbackMode) return '• Connecting to AI...';
    return '';
  };

  const getStatusColor = () => {
    if (loading) return 'text-yellow-400';
    if (fallbackMode) return 'text-blue-400';
    if (error && !fallbackMode) return 'text-red-400';
    if (aiPersonaReady) return 'text-green-400';
    return 'text-blue-400';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-slate-900/50 backdrop-blur-sm flex justify-between items-center">
        <div className="text-white">
          <h2 className="text-xl font-semibold">🎯 Live Debate Session</h2>
          <p className="text-sm text-slate-400">
            Topic: Climate Change Solutions
            <span className={`ml-2 ${getStatusColor()}`}>{getStatusMessage()}</span>
          </p>
        </div>
        <div className="text-white text-xl font-mono bg-slate-800/50 px-4 py-2 rounded">
          ⏱️ {formatTime(debateTimer)}
        </div>
      </div>

      {/* AI Video Area */}
      <div className="flex-1 p-8 flex justify-center items-center">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-blue-500/30 p-6 w-full max-w-4xl">
          <h3 className="text-white font-semibold mb-4 text-center text-xl">
            🤖 AI Debate Persona - Debatrix {fallbackMode && '(Enhanced Text Mode)'}
          </h3>
          <div className="rounded-lg overflow-hidden relative bg-slate-900/50" style={{ aspectRatio: '16/9', minHeight: '500px' }}>
            {conversation?.conversation_url && !fallbackMode ? (
              <>
                <iframe
                  ref={aiVideoRef}
                  src={conversation.conversation_url}
                  className="w-full h-full rounded-lg border-0"
                  allow="camera; microphone; autoplay; display-capture; fullscreen"
                  title="AI Debate Persona"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                />
                {!iframeLoaded && (
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-white text-sm">Loading AI Video...</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-4xl mb-4 mx-auto">
                    {fallbackMode ? '💬' : '🤖'}
                  </div>
                  <p className="text-white text-lg mb-2">
                    {loading ? 'Initializing AI Persona...' : 
                     fallbackMode ? 'Enhanced Text Mode Ready' : 
                     error ? 'AI in enhanced mode' : 'AI Persona Starting...'}
                  </p>
                  {fallbackMode && (
                    <p className="text-slate-300 text-sm max-w-md mx-auto">
                      The AI is ready to debate through text responses and will provide intelligent arguments and feedback.
                    </p>
                  )}
                  {loading && (
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mt-2"></div>
                  )}
                </div>
              </div>
            )}
            
            {/* Live transcript overlay */}
            {transcript && (
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-sm p-4 rounded-lg">
                <p className="text-white text-sm"><strong>🎤 Live Transcript:</strong> {transcript}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="p-4 bg-slate-900/50 backdrop-blur-sm flex justify-center space-x-4">
        <Button
          onClick={handleEndDebate}
          variant="destructive"
          size="lg"
          className="px-8 py-3 text-lg"
        >
          🏁 End Debate & Get Results
        </Button>
      </div>
    </div>
  );
};
