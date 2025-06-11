
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff } from 'lucide-react';

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
  const aiVideoRef = useRef<HTMLIFrameElement>(null);
  const conversationCleanupRef = useRef<string | null>(null);

  const TAVUS_API_KEY = '75f20ee320cc44bbbe0b8dd2cf21f3b5';
  const PERSONA_ID = 'pad2b96fcba5';

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
    if (isDebating && !aiPersonaReady) {
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
      const options = {
        method: 'DELETE',
        headers: {'x-api-key': TAVUS_API_KEY}
      };
      
      await fetch(`https://tavusapi.com/v2/conversations/${conversationId}`, options);
      console.log('Conversation ended successfully');
    } catch (error) {
      console.error('Error ending conversation:', error);
    }
  };

  const getPersona = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const options = {
        method: 'GET', 
        headers: {'x-api-key': TAVUS_API_KEY}
      };
      
      const response = await fetch(`https://tavusapi.com/v2/personas/${PERSONA_ID}`, options);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to load persona');
      }
      
      setPersona(data);
      console.log('Persona loaded:', data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load persona';
      setError(errorMessage);
      console.error('Error loading persona:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      const options = {
        method: 'POST',
        headers: {
          'x-api-key': TAVUS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          persona_id: PERSONA_ID,
          callback_url: `${window.location.origin}/api/tavus-callback`,
          properties: {
            max_call_duration: 600,
            participant_left_timeout: 30,
          }
        })
      };
      
      const response = await fetch('https://tavusapi.com/v2/conversations', options);
      const data = await response.json();
      
      if (!response.ok) {
        if (data.message?.includes('maximum concurrent conversations') && retryCount < 2) {
          console.log('Max conversations reached, waiting and retrying...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          return createConversation(retryCount + 1);
        }
        throw new Error(data.message || 'Failed to create conversation');
      }
      
      setConversation(data);
      conversationCleanupRef.current = data.conversation_id;
      console.log('Conversation created:', data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
      console.error('Error creating conversation:', err);
      
      if (retryCount === 0 && errorMessage.includes('maximum concurrent conversations')) {
        console.log('Retrying conversation creation...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return createConversation(1);
      }
      
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
      
      await getPersona();
      const conversationData = await createConversation();
      
      if (conversationData?.conversation_url && aiVideoRef.current) {
        console.log('Setting iframe src:', conversationData.conversation_url);
        aiVideoRef.current.src = conversationData.conversation_url;
        
        setTimeout(() => {
          setAiPersonaReady(true);
          console.log('AI persona ready for debate');
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to initialize AI persona:', error);
      setError('Failed to initialize AI persona. Using fallback mode.');
    }
  };

  const handleIframeLoad = () => {
    console.log('Iframe loaded successfully');
    setIframeLoaded(true);
    setError(null);
  };

  const handleIframeError = () => {
    console.error('Iframe failed to load');
    setError('Failed to load AI video. Check connection.');
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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-slate-900/50 backdrop-blur-sm flex justify-between items-center">
        <div className="text-white">
          <h2 className="text-xl font-semibold">🎯 Live Debate Session</h2>
          <p className="text-sm text-slate-400">
            Topic: Climate Change Solutions
            {error && <span className="text-red-400 ml-2">• {error}</span>}
            {loading && <span className="text-yellow-400 ml-2">• Loading AI...</span>}
            {aiPersonaReady && <span className="text-green-400 ml-2">• AI Ready</span>}
            {conversation && !aiPersonaReady && <span className="text-blue-400 ml-2">• Connecting to AI...</span>}
          </p>
        </div>
        <div className="text-white text-xl font-mono bg-slate-800/50 px-4 py-2 rounded">
          ⏱️ {formatTime(debateTimer)}
        </div>
      </div>

      {/* AI Video Area */}
      <div className="flex-1 p-8 flex justify-center items-center">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-blue-500/30 p-6 w-full max-w-4xl">
          <h3 className="text-white font-semibold mb-4 text-center text-xl">🤖 AI Debate Persona - Debatrix</h3>
          <div className="rounded-lg overflow-hidden relative bg-slate-900/50" style={{ aspectRatio: '16/9', minHeight: '500px' }}>
            {conversation?.conversation_url ? (
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
                    🤖
                  </div>
                  <p className="text-white text-lg mb-2">
                    {loading ? 'Initializing AI Persona...' : error ? 'AI in fallback mode' : 'AI Persona Starting...'}
                  </p>
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
