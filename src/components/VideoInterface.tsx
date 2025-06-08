
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

interface VideoInterfaceProps {
  isDebating: boolean;
  onEndDebate: (results: any) => void;
}

export const VideoInterface = ({ isDebating, onEndDebate }: VideoInterfaceProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [debateTimer, setDebateTimer] = useState(0);
  const [aiPersonaReady, setAiPersonaReady] = useState(false);
  const [persona, setPersona] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const aiVideoRef = useRef<HTMLIFrameElement>(null);
  const recognitionRef = useRef<any>(null);
  const conversationCleanupRef = useRef<string | null>(null);

  const TAVUS_API_KEY = 'ce3813432eaa4955b4453267bab295b2';
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
    if (isDebating && !aiPersonaReady) {
      initializeAIPersona();
    }
    return () => {
      cleanup();
    };
  }, [isDebating]);

  const cleanup = async () => {
    stopCamera();
    stopSpeechRecognition();
    
    // Clean up any active conversation
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

  const sendMessage = async (message: string) => {
    if (!conversation?.conversation_id) {
      throw new Error('No active conversation');
    }

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
          text: message,
        })
      };
      
      const response = await fetch(`https://tavusapi.com/v2/conversations/${conversation.conversation_id}/speak`, options);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }
      
      console.log('Message sent to AI:', data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Error sending message:', err);
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
        // Set the iframe src immediately
        aiVideoRef.current.src = conversationData.conversation_url;
        
        // Set ready state after a delay to allow iframe to load
        setTimeout(() => {
          setAiPersonaReady(true);
          console.log('AI persona ready for debate');
        }, 3000);
      }
      
      // Start user camera and speech recognition
      startCamera();
      initializeSpeechRecognition();
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Camera access denied. Please enable camera permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript);
          handleUserSpeech(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleUserSpeech = async (userInput: string) => {
    if (!conversation?.conversation_id || !aiPersonaReady) {
      console.log('AI persona not ready, generating fallback response');
      generateFallbackResponse(userInput);
      return;
    }

    try {
      console.log('Sending user speech to AI persona:', userInput);
      await sendMessage(userInput);
    } catch (error) {
      console.error('Failed to send message to AI persona:', error);
      generateFallbackResponse(userInput);
    }
  };

  const generateFallbackResponse = (userInput: string) => {
    const responses = [
      "That's an interesting point about climate change. However, have you considered the economic implications of rapid renewable energy transitions?",
      "I appreciate your perspective, but the data suggests we need more immediate action on carbon emissions reduction.",
      "While that argument has merit, it overlooks the technological innovations that are making clean energy more affordable.",
      "Let me challenge that assumption - what about the job creation potential in the green energy sector?",
      "Your point is valid, but we must also consider the long-term environmental costs of maintaining the status quo."
    ];
    
    setTimeout(() => {
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      console.log('AI Persona (fallback):', randomResponse);
    }, 1000);
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsRecording(!isRecording);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndDebate = async () => {
    // Clean up conversation before ending
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
      transcript: transcript,
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
          <h2 className="text-xl font-semibold">Debate Session</h2>
          <p className="text-sm text-slate-400">
            Topic: Climate Change Solutions
            {error && <span className="text-red-400 ml-2">• {error}</span>}
            {loading && <span className="text-yellow-400 ml-2">• Loading AI...</span>}
            {aiPersonaReady && <span className="text-green-400 ml-2">• AI Ready</span>}
            {conversation && !aiPersonaReady && <span className="text-blue-400 ml-2">• Connecting to AI...</span>}
          </p>
        </div>
        <div className="text-white text-lg font-mono">
          {formatTime(debateTimer)}
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        {/* AI Persona */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-blue-500/30 p-4 flex flex-col">
          <h3 className="text-white font-semibold mb-2">AI Persona - Debatrix</h3>
          <div className="flex-1 rounded-lg overflow-hidden relative bg-slate-900/50">
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
                  style={{ minHeight: '400px' }}
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
                  <p className="text-white text-sm">
                    {loading ? 'Initializing AI Persona...' : error ? 'AI in fallback mode' : 'AI Persona Starting...'}
                  </p>
                  {loading && (
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mt-2"></div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* User Video */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-purple-500/30 p-4 flex flex-col">
          <h3 className="text-white font-semibold mb-2">You</h3>
          <div className="flex-1 rounded-lg overflow-hidden relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover rounded-lg"
            />
            {transcript && (
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur-sm p-3 rounded-lg">
                <p className="text-white text-sm">{transcript}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="p-4 bg-slate-900/50 backdrop-blur-sm flex justify-center space-x-4">
        <Button
          onClick={toggleRecording}
          className={`${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white px-6 py-3`}
        >
          {isRecording ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
        
        <Button
          onClick={() => setIsMuted(!isMuted)}
          variant="outline"
          className="border-slate-600 text-white px-6 py-3"
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>
        
        <Button
          onClick={() => setIsVideoOn(!isVideoOn)}
          variant="outline"
          className="border-slate-600 text-white px-6 py-3"
        >
          {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>

        <Button
          onClick={handleEndDebate}
          variant="destructive"
          className="px-6 py-3"
        >
          End Debate
        </Button>
      </div>
    </div>
  );
};
