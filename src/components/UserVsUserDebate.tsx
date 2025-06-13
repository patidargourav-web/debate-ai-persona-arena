
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserVsUserDebateProps {
  debateRequest: {
    id: string;
    topic: string;
    sender_id: string;
    receiver_id: string;
    sender_profile?: {
      username: string;
      display_name: string;
    };
    receiver_profile?: {
      username: string;
      display_name: string;
    };
  };
  onEndDebate: () => void;
}

interface DebaterScore {
  argumentStrength: number;
  clarity: number;
  engagement: number;
  overallScore: number;
  fillerWords: number;
  speakingTime: number;
}

export const UserVsUserDebate = ({ debateRequest, onEndDebate }: UserVsUserDebateProps) => {
  const [debateTimer, setDebateTimer] = useState(0);
  const [isDebating, setIsDebating] = useState(false);
  const [userScores, setUserScores] = useState<Record<string, DebaterScore>>({
    [debateRequest.sender_id]: {
      argumentStrength: 0,
      clarity: 0,
      engagement: 0,
      overallScore: 0,
      fillerWords: 0,
      speakingTime: 0
    },
    [debateRequest.receiver_id]: {
      argumentStrength: 0,
      clarity: 0,
      engagement: 0,
      overallScore: 0,
      fillerWords: 0,
      speakingTime: 0
    }
  });
  const [activeDebater, setActiveDebater] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const roomRef = useRef<string>(`debate-${debateRequest.id}`);

  useEffect(() => {
    if (isDebating) {
      const interval = setInterval(() => {
        setDebateTimer(prev => prev + 1);
        // Simulate real-time score updates
        updateScores();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isDebating]);

  useEffect(() => {
    // Auto-start debate when component mounts
    startDebate();
    
    // Listen for real-time updates from other user
    const channel = supabase
      .channel(`debate-room-${debateRequest.id}`)
      .on('broadcast', { event: 'score_update' }, (payload) => {
        if (payload.payload.userId !== user?.id) {
          setUserScores(prev => ({
            ...prev,
            [payload.payload.userId]: payload.payload.scores
          }));
        }
      })
      .on('broadcast', { event: 'active_speaker' }, (payload) => {
        setActiveDebater(payload.payload.userId);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const updateScores = () => {
    if (!user) return;

    const newScores: DebaterScore = {
      argumentStrength: Math.min(100, userScores[user.id]?.argumentStrength + Math.random() * 3),
      clarity: Math.min(100, userScores[user.id]?.clarity + Math.random() * 2),
      engagement: Math.min(100, userScores[user.id]?.engagement + Math.random() * 2.5),
      overallScore: 0,
      fillerWords: userScores[user.id]?.fillerWords + (Math.random() > 0.85 ? 1 : 0),
      speakingTime: userScores[user.id]?.speakingTime + (activeDebater === user.id ? 1 : 0)
    };
    
    newScores.overallScore = Math.round(
      (newScores.argumentStrength + newScores.clarity + newScores.engagement) / 3
    );

    setUserScores(prev => ({
      ...prev,
      [user.id]: newScores
    }));

    // Broadcast scores to other user
    supabase.channel(`debate-room-${debateRequest.id}`)
      .send({
        type: 'broadcast',
        event: 'score_update',
        payload: { userId: user.id, scores: newScores }
      });
  };

  const startDebate = () => {
    setIsDebating(true);
    toast({
      title: "Debate Started! 🎯",
      description: `You're now debating "${debateRequest.topic}" with ${getOpponentName()}`,
    });

    // Create active debate record
    supabase
      .from('active_debates')
      .insert({
        participant_1_id: debateRequest.sender_id,
        participant_2_id: debateRequest.receiver_id,
        topic: debateRequest.topic,
        status: 'active'
      });
  };

  const endDebate = async () => {
    setIsDebating(false);
    
    // Determine winner based on scores
    const myScore = userScores[user?.id || '']?.overallScore || 0;
    const opponentId = user?.id === debateRequest.sender_id ? debateRequest.receiver_id : debateRequest.sender_id;
    const opponentScore = userScores[opponentId]?.overallScore || 0;
    
    const winnerId = myScore > opponentScore ? user?.id : opponentId;
    
    // Update active debate with results - fix JSON serialization
    const debateDataJson = JSON.stringify({
      scores: userScores,
      duration: debateTimer,
      final_scores: { [user?.id || '']: myScore, [opponentId]: opponentScore }
    });

    await supabase
      .from('active_debates')
      .update({
        status: 'completed',
        winner_id: winnerId,
        debate_data: debateDataJson
      })
      .eq('participant_1_id', debateRequest.sender_id)
      .eq('participant_2_id', debateRequest.receiver_id);

    toast({
      title: myScore > opponentScore ? "You Won! 🏆" : "Good Effort! 🎯",
      description: `Final Score: You ${myScore} - ${opponentScore} ${getOpponentName()}`,
    });

    setTimeout(() => {
      onEndDebate();
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getOpponentName = () => {
    if (user?.id === debateRequest.sender_id) {
      return debateRequest.receiver_profile?.display_name || debateRequest.receiver_profile?.username || 'Opponent';
    }
    return debateRequest.sender_profile?.display_name || debateRequest.sender_profile?.username || 'Opponent';
  };

  const getOpponentId = () => {
    return user?.id === debateRequest.sender_id ? debateRequest.receiver_id : debateRequest.sender_id;
  };

  const myScore = userScores[user?.id || ''] || userScores[Object.keys(userScores)[0]];
  const opponentScore = userScores[getOpponentId()] || userScores[Object.keys(userScores)[1]];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="p-4 bg-slate-900/50 backdrop-blur-sm flex justify-between items-center border-b">
        <div className="text-white">
          <h2 className="text-xl font-semibold">🥊 Live User vs User Debate</h2>
          <p className="text-sm text-slate-400">
            Topic: {debateRequest.topic}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-white text-xl font-mono bg-slate-800/50 px-4 py-2 rounded">
            ⏱️ {formatTime(debateTimer)}
          </div>
          <Button onClick={endDebate} variant="destructive">
            End Debate
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Video Conference Area */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* User's Video */}
            <Card className="bg-slate-800/50 backdrop-blur-sm border-blue-500/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold">You</h3>
                <Badge className={activeDebater === user?.id ? 'bg-green-600' : 'bg-gray-600'}>
                  {activeDebater === user?.id ? 'Speaking' : 'Listening'}
                </Badge>
              </div>
              <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl mb-2 mx-auto">
                    👤
                  </div>
                  <p className="text-white">Your Camera</p>
                </div>
              </div>
              
              {/* User's Score */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Overall Score</span>
                  <span className="text-green-400 font-bold">{Math.round(myScore?.overallScore || 0)}</span>
                </div>
                <Progress value={myScore?.overallScore || 0} className="h-2 bg-slate-700" />
              </div>
            </Card>

            {/* Opponent's Video */}
            <Card className="bg-slate-800/50 backdrop-blur-sm border-purple-500/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold">{getOpponentName()}</h3>
                <Badge className={activeDebater === getOpponentId() ? 'bg-green-600' : 'bg-gray-600'}>
                  {activeDebater === getOpponentId() ? 'Speaking' : 'Listening'}
                </Badge>
              </div>
              <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl mb-2 mx-auto">
                    👤
                  </div>
                  <p className="text-white">{getOpponentName()}</p>
                </div>
              </div>
              
              {/* Opponent's Score */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Overall Score</span>
                  <span className="text-purple-400 font-bold">{Math.round(opponentScore?.overallScore || 0)}</span>
                </div>
                <Progress value={opponentScore?.overallScore || 0} className="h-2 bg-slate-700" />
              </div>
            </Card>
          </div>
        </div>

        {/* Real-time Analysis Panel */}
        <div className="w-full lg:w-80 bg-slate-900/50 border-l border-slate-700 p-4 overflow-y-auto">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            📊 Live Analysis
            <Badge variant="outline">Real-time</Badge>
          </h3>

          {/* Score Comparison */}
          <Card className="bg-slate-800/50 border-slate-600 p-4 mb-4">
            <h4 className="text-white font-medium mb-3">Score Battle</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-400">You</span>
                  <span className="text-green-400 font-bold">{Math.round(myScore?.overallScore || 0)}</span>
                </div>
                <Progress value={myScore?.overallScore || 0} className="h-3" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-purple-400">{getOpponentName()}</span>
                  <span className="text-purple-400 font-bold">{Math.round(opponentScore?.overallScore || 0)}</span>
                </div>
                <Progress value={opponentScore?.overallScore || 0} className="h-3" />
              </div>
            </div>
          </Card>

          {/* Detailed Metrics */}
          <Card className="bg-slate-800/50 border-slate-600 p-4 mb-4">
            <h4 className="text-white font-medium mb-3">Your Performance</h4>
            <div className="space-y-3 text-sm">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">Argument Strength</span>
                  <span className="text-white">{Math.round(myScore?.argumentStrength || 0)}%</span>
                </div>
                <Progress value={myScore?.argumentStrength || 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">Clarity</span>
                  <span className="text-white">{Math.round(myScore?.clarity || 0)}%</span>
                </div>
                <Progress value={myScore?.clarity || 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">Engagement</span>
                  <span className="text-white">{Math.round(myScore?.engagement || 0)}%</span>
                </div>
                <Progress value={myScore?.engagement || 0} className="h-2" />
              </div>
            </div>
          </Card>

          {/* Speaking Time */}
          <Card className="bg-slate-800/50 border-slate-600 p-4">
            <h4 className="text-white font-medium mb-3">Speaking Time</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-400">You</span>
                <span className="text-white">{formatTime(myScore?.speakingTime || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-400">{getOpponentName()}</span>
                <span className="text-white">{formatTime(opponentScore?.speakingTime || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Your Filler Words</span>
                <span className="text-red-400">{myScore?.fillerWords || 0}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
