import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserVsUserDebateProps {
  debateId: string;
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

interface DebateRequestWithProfiles {
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
}

export const UserVsUserDebate = ({ debateId, onEndDebate }: UserVsUserDebateProps) => {
  const [debateTimer, setDebateTimer] = useState(0);
  const [isDebating, setIsDebating] = useState(false);
  const [debateRequest, setDebateRequest] = useState<DebateRequestWithProfiles | null>(null);
  const [loading, setLoading] = useState(true);
  const [userScores, setUserScores] = useState<Record<string, DebaterScore>>({});
  const [activeDebater, setActiveDebater] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    fetchDebateRequest();
  }, [debateId]);

  useEffect(() => {
    if (debateRequest && user) {
      initializeScores();
      setupRealTimeConnection();
      startDebate();
    }
  }, [debateRequest, user]);

  useEffect(() => {
    if (isDebating) {
      const interval = setInterval(() => {
        setDebateTimer(prev => prev + 1);
        updateScores();
        
        // Simulate speaking turns
        if (Math.random() > 0.7) {
          const participants = [debateRequest?.sender_id, debateRequest?.receiver_id];
          setActiveDebater(participants[Math.floor(Math.random() * participants.length)] || null);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isDebating, debateRequest]);

  const setupRealTimeConnection = () => {
    if (!user || !debateRequest) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`debate-room-${debateId}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        console.log('Users in debate room:', newState);
        
        const participantCount = Object.keys(newState).length;
        setParticipantCount(participantCount);
        
        // Check if opponent is connected
        const opponentId = user.id === debateRequest.sender_id ? debateRequest.receiver_id : debateRequest.sender_id;
        const opponentPresent = Object.keys(newState).some(key => 
          newState[key].some((presence: any) => presence.user_id === opponentId)
        );
        setOpponentConnected(opponentPresent);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        if (newPresences.length > 0 && newPresences[0].user_id !== user.id) {
          toast({
            title: "🎯 Opponent Joined!",
            description: "Your opponent has entered the debate room. Let the debate begin!",
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        if (leftPresences.length > 0 && leftPresences[0].user_id !== user.id) {
          toast({
            title: "⚠️ Opponent Left",
            description: "Your opponent has left the debate room.",
            variant: "destructive"
          });
        }
      })
      .on('broadcast', { event: 'score_update' }, (payload) => {
        const { userId, scores } = payload.payload;
        if (userId !== user.id) {
          setUserScores(prev => ({
            ...prev,
            [userId]: scores
          }));
        }
      })
      .on('broadcast', { event: 'speaking_status' }, (payload) => {
        const { userId, isSpeaking } = payload.payload;
        if (isSpeaking) {
          setActiveDebater(userId);
        }
      });

    channelRef.current = channel;
    
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        // Track user presence with enhanced data
        await channel.track({
          user_id: user.id,
          username: user.email,
          display_name: user.email?.split('@')[0] || 'Anonymous',
          online_at: new Date().toISOString(),
          debate_id: debateId,
          status: 'active'
        });
        
        toast({
          title: "🔗 Connected to Debate Room",
          description: "Waiting for your opponent to join...",
        });
      }
    });
  };

  const fetchDebateRequest = async () => {
    try {
      const { data: requestData, error } = await supabase
        .from('debate_requests')
        .select('*')
        .eq('id', debateId)
        .single();

      if (error) throw error;

      // Fetch profiles for both users
      const userIds = [requestData.sender_id, requestData.receiver_id];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', userIds);

      const senderProfile = profilesData?.find(p => p.id === requestData.sender_id);
      const receiverProfile = profilesData?.find(p => p.id === requestData.receiver_id);

      setDebateRequest({
        ...requestData,
        sender_profile: senderProfile ? {
          username: senderProfile.username || '',
          display_name: senderProfile.display_name || ''
        } : undefined,
        receiver_profile: receiverProfile ? {
          username: receiverProfile.username || '',
          display_name: receiverProfile.display_name || ''
        } : undefined
      });
    } catch (error) {
      console.error('Error fetching debate request:', error);
      toast({
        title: "Error",
        description: "Failed to load debate information.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeScores = () => {
    if (!debateRequest) return;
    
    setUserScores({
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
  };

  const updateScores = () => {
    if (!user || !debateRequest) return;

    const newScores: DebaterScore = {
      argumentStrength: Math.min(100, (userScores[user.id]?.argumentStrength || 0) + Math.random() * 3),
      clarity: Math.min(100, (userScores[user.id]?.clarity || 0) + Math.random() * 2),
      engagement: Math.min(100, (userScores[user.id]?.engagement || 0) + Math.random() * 2.5),
      overallScore: 0,
      fillerWords: (userScores[user.id]?.fillerWords || 0) + (Math.random() > 0.85 ? 1 : 0),
      speakingTime: (userScores[user.id]?.speakingTime || 0) + (activeDebater === user.id ? 1 : 0)
    };
    
    newScores.overallScore = Math.round(
      (newScores.argumentStrength + newScores.clarity + newScores.engagement) / 3
    );

    setUserScores(prev => ({
      ...prev,
      [user.id]: newScores
    }));

    // Broadcast scores to other user
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'score_update',
        payload: { userId: user.id, scores: newScores }
      });
    }
  };

  const startDebate = () => {
    setIsDebating(true);
    toast({
      title: "🚀 Debate Started!",
      description: `Topic: "${debateRequest?.topic}"`,
    });

    // Create active debate record
    if (debateRequest) {
      supabase
        .from('active_debates')
        .insert({
          participant_1_id: debateRequest.sender_id,
          participant_2_id: debateRequest.receiver_id,
          topic: debateRequest.topic,
          status: 'active'
        });
    }
  };

  const endDebate = async () => {
    if (!debateRequest || !user) return;
    
    setIsDebating(false);
    
    const myScore = userScores[user.id]?.overallScore || 0;
    const opponentId = user.id === debateRequest.sender_id ? debateRequest.receiver_id : debateRequest.sender_id;
    const opponentScore = userScores[opponentId]?.overallScore || 0;
    
    const winnerId = myScore > opponentScore ? user.id : opponentId;
    
    const debateDataJson = JSON.stringify({
      scores: userScores,
      duration: debateTimer,
      final_scores: { [user.id]: myScore, [opponentId]: opponentScore }
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

    // Clean up real-time connection
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    toast({
      title: myScore > opponentScore ? "🏆 Victory!" : "💪 Great Effort!",
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
    if (!debateRequest || !user) return 'Opponent';
    
    if (user.id === debateRequest.sender_id) {
      return debateRequest.receiver_profile?.display_name || debateRequest.receiver_profile?.username || 'Opponent';
    }
    return debateRequest.sender_profile?.display_name || debateRequest.sender_profile?.username || 'Opponent';
  };

  const getOpponentId = () => {
    if (!debateRequest || !user) return '';
    return user.id === debateRequest.sender_id ? debateRequest.receiver_id : debateRequest.sender_id;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500 border-b-transparent rounded-full animate-spin animation-delay-150"></div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">🎯 Preparing Debate Arena</h3>
            <p className="text-slate-300">Setting up real-time video connection...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!debateRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Debate Not Found</h2>
          <p className="text-slate-300 mb-6">The debate session could not be loaded.</p>
          <Button onClick={onEndDebate} className="bg-purple-600 hover:bg-purple-700">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  const myScore = userScores[user?.id || ''] || userScores[Object.keys(userScores)[0]];
  const opponentScore = userScores[getOpponentId()] || userScores[Object.keys(userScores)[1]];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Tavus AI-Style Header */}
      <div className="p-6 bg-black/30 backdrop-blur-lg border-b border-purple-500/20">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                🎯 Live Debate Arena
              </h2>
            </div>
            <p className="text-slate-300 text-lg font-medium">
              {debateRequest.topic}
            </p>
            <div className="flex items-center gap-6 text-sm mt-2">
              <div className={`flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                {isConnected ? 'Connected' : 'Connecting...'}
              </div>
              <div className={`flex items-center gap-2 ${opponentConnected ? 'text-green-400' : 'text-yellow-400'}`}>
                <div className={`w-2 h-2 rounded-full ${opponentConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
                {opponentConnected ? `${getOpponentName()} Online` : 'Waiting for opponent...'}
              </div>
              <div className="text-purple-400">
                👥 {participantCount}/2 participants
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center bg-black/40 px-6 py-3 rounded-xl border border-purple-500/30">
              <div className="text-2xl font-mono text-white">⏱️ {formatTime(debateTimer)}</div>
              <div className="text-xs text-slate-400">Debate Time</div>
            </div>
            <Button onClick={endDebate} variant="destructive" className="bg-red-600 hover:bg-red-700">
              End Debate
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row h-[calc(100vh-120px)]">
        {/* Tavus AI-Style Video Conference Area */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* User's Video - Tavus AI Style */}
            <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-lg border-blue-500/30 p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <h3 className="text-white font-bold text-lg">You</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${activeDebater === user?.id ? 'bg-green-500 animate-pulse' : 'bg-gray-600'} text-white`}>
                      {activeDebater === user?.id ? '🎤 Speaking' : '👂 Listening'}
                    </Badge>
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  </div>
                </div>
                
                <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl flex items-center justify-center relative border border-blue-500/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl"></div>
                  <div className="text-center relative z-10">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-4xl mb-4 mx-auto shadow-2xl">
                      👤
                    </div>
                    <p className="text-white font-semibold text-lg">Your Camera</p>
                    <p className="text-blue-200 text-sm">AI-Powered Analysis Active</p>
                  </div>
                  
                  {activeDebater === user?.id && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-bold animate-pulse shadow-lg">
                      🔴 LIVE
                    </div>
                  )}
                  
                  {/* AI Analysis Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex justify-between text-xs text-white">
                      <span>Confidence: {Math.round(myScore?.overallScore || 0)}%</span>
                      <span>Clarity: {Math.round(myScore?.clarity || 0)}%</span>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Score Display */}
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-200">Overall Performance</span>
                    <span className="text-green-400 font-bold text-lg">{Math.round(myScore?.overallScore || 0)}%</span>
                  </div>
                  <Progress 
                    value={myScore?.overallScore || 0} 
                    className="h-3 bg-slate-800/50 border border-blue-500/30" 
                  />
                </div>
              </div>
            </Card>

            {/* Opponent's Video - Tavus AI Style */}
            <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-lg border-purple-500/30 p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${opponentConnected ? 'bg-purple-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                    <h3 className="text-white font-bold text-lg">{getOpponentName()}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${activeDebater === getOpponentId() ? 'bg-green-500 animate-pulse' : 'bg-gray-600'} text-white`}>
                      {activeDebater === getOpponentId() ? '🎤 Speaking' : '👂 Listening'}
                    </Badge>
                    <div className={`w-3 h-3 rounded-full ${opponentConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
                  </div>
                </div>
                
                <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl flex items-center justify-center relative border border-purple-500/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-xl"></div>
                  <div className="text-center relative z-10">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-4xl mb-4 mx-auto shadow-2xl">
                      👤
                    </div>
                    <p className="text-white font-semibold text-lg">{getOpponentName()}</p>
                    {!opponentConnected ? (
                      <p className="text-yellow-400 text-sm animate-pulse">⏳ Connecting...</p>
                    ) : (
                      <p className="text-purple-200 text-sm">Connected & Ready</p>
                    )}
                  </div>
                  
                  {activeDebater === getOpponentId() && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-bold animate-pulse shadow-lg">
                      🔴 LIVE
                    </div>
                  )}
                  
                  {/* AI Analysis Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex justify-between text-xs text-white">
                      <span>Confidence: {Math.round(opponentScore?.overallScore || 0)}%</span>
                      <span>Clarity: {Math.round(opponentScore?.clarity || 0)}%</span>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Score Display */}
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-200">Overall Performance</span>
                    <span className="text-purple-400 font-bold text-lg">{Math.round(opponentScore?.overallScore || 0)}%</span>
                  </div>
                  <Progress 
                    value={opponentScore?.overallScore || 0} 
                    className="h-3 bg-slate-800/50 border border-purple-500/30" 
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Enhanced Real-time Analysis Panel */}
        <div className="w-full xl:w-96 bg-black/40 backdrop-blur-lg border-l border-purple-500/20 p-6 overflow-y-auto">
          <h3 className="text-white font-bold mb-6 flex items-center gap-3 text-xl">
            🧠 AI Analysis Dashboard
            <Badge variant="outline" className="border-green-500 text-green-400 animate-pulse">
              LIVE
            </Badge>
          </h3>

          {/* Connection Status */}
          <Card className="bg-slate-800/50 border-slate-600/50 p-4 mb-6 backdrop-blur-sm">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              🔗 Connection Status
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">You</span>
                <span className={`flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">{getOpponentName()}</span>
                <span className={`flex items-center gap-2 ${opponentConnected ? 'text-green-400' : 'text-yellow-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${opponentConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
                  {opponentConnected ? 'Connected' : 'Waiting...'}
                </span>
              </div>
            </div>
          </Card>

          {/* Score Battle */}
          <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-purple-500/30 p-5 mb-6 backdrop-blur-sm">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              ⚔️ Score Battle
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-blue-400 font-medium">You</span>
                  <span className="text-blue-400 font-bold text-lg">{Math.round(myScore?.overallScore || 0)}</span>
                </div>
                <Progress value={myScore?.overallScore || 0} className="h-4 bg-slate-800" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-purple-400 font-medium">{getOpponentName()}</span>
                  <span className="text-purple-400 font-bold text-lg">{Math.round(opponentScore?.overallScore || 0)}</span>
                </div>
                <Progress value={opponentScore?.overallScore || 0} className="h-4 bg-slate-800" />
              </div>
            </div>
          </Card>

          {/* Detailed Performance Metrics */}
          <Card className="bg-slate-800/50 border-slate-600/50 p-5 mb-6 backdrop-blur-sm">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              📊 Your Performance
            </h4>
            <div className="space-y-4 text-sm">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-300">Argument Strength</span>
                  <span className="text-white font-medium">{Math.round(myScore?.argumentStrength || 0)}%</span>
                </div>
                <Progress value={myScore?.argumentStrength || 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-300">Clarity & Articulation</span>
                  <span className="text-white font-medium">{Math.round(myScore?.clarity || 0)}%</span>
                </div>
                <Progress value={myScore?.clarity || 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-300">Audience Engagement</span>
                  <span className="text-white font-medium">{Math.round(myScore?.engagement || 0)}%</span>
                </div>
                <Progress value={myScore?.engagement || 0} className="h-2" />
              </div>
            </div>
          </Card>

          {/* Speaking Analytics */}
          <Card className="bg-slate-800/50 border-slate-600/50 p-5 backdrop-blur-sm">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              🎤 Speaking Analytics
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-400">Your Speaking Time</span>
                <span className="text-white font-mono">{formatTime(myScore?.speakingTime || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-400">{getOpponentName()}'s Time</span>
                <span className="text-white font-mono">{formatTime(opponentScore?.speakingTime || 0)}</span>
              </div>
              <div className="pt-2 border-t border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Filler Words</span>
                  <span className="text-red-400 font-medium">{myScore?.fillerWords || 0}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-400">Current Speaker</span>
                  <span className="text-green-400 font-medium">
                    {activeDebater === user?.id ? 'You' : 
                     activeDebater === getOpponentId() ? getOpponentName() : 'None'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
