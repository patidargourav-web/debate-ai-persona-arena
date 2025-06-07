
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
  const [aiResponse, setAiResponse] = useState('');
  const [debateTimer, setDebateTimer] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);

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
    if (isDebating) {
      startCamera();
      initializeSpeechRecognition();
    }
    return () => {
      stopCamera();
      stopSpeechRecognition();
    };
  }, [isDebating]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
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
          generateAIResponse(finalTranscript);
        }
      };
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsRecording(!isRecording);
  };

  const generateAIResponse = (userInput: string) => {
    // Simulate AI response generation
    const responses = [
      "That's an interesting point, but have you considered the economic implications?",
      "I understand your perspective, however, the data suggests otherwise.",
      "While that argument has merit, it overlooks several key factors.",
      "Let me challenge that assumption with a different viewpoint.",
      "Your point is valid, but what about the long-term consequences?"
    ];
    
    setTimeout(() => {
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setAiResponse(randomResponse);
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndDebate = () => {
    const results = {
      duration: debateTimer,
      transcript: transcript,
      score: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
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
          <p className="text-sm text-slate-400">Topic: Climate Change Solutions</p>
        </div>
        <div className="text-white text-lg font-mono">
          {formatTime(debateTimer)}
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        {/* AI Persona */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-blue-500/30 p-4 flex flex-col">
          <h3 className="text-white font-semibold mb-2">AI Persona - Alex</h3>
          <div className="flex-1 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg flex items-center justify-center relative">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-4xl">
              🤖
            </div>
            {aiResponse && (
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur-sm p-3 rounded-lg">
                <p className="text-white text-sm">{aiResponse}</p>
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
