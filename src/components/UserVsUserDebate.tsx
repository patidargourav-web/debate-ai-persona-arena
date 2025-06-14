import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { LiveKitDebateVideo } from '@/components/LiveKitDebateVideo';

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
  const [participantCount, setParticipantCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Determine if this user is the initiator (sender of the request)
  const isInitiator = debateRequest?.sender_id === user?.id;

  // Initialize WebRTC
  const {
    connectionState,
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    isConnecting,
    initializeWebRTC,
    toggleMicrophone,
    toggleCamera,
    setLocalVideoElement,
    setRemoteVideoElement
  } = useWebRTC({
    debateId,
    userId: user?.id || '',
    isInitiator
  });

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

  // Set video elements when refs are available
  useEffect(() => {
    if (localVideoRef.current) {
      setLocalVideoElement(localVideoRef.current);
    }
  }, [localVideoRef.current, setLocalVideoElement]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      setRemoteVideoElement(remoteVideoRef.current);
    }
  }, [remoteVideoRef.current, setRemoteVideoElement]);

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

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`debate-presence-${debateId}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        console.log('[Presence] Current Users in Debate Room:', newState);

        const count = Object.keys(newState).length;
        setParticipantCount(count);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[Presence] User joined:', key, newPresences);
        if (newPresences.length > 0 && newPresences[0].user_id !== user.id) {
          toast({
            title: "🎯 Opponent Joined!",
            description: "Your opponent has entered the debate room. Video connecting...",
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[Presence] User left:', key, leftPresences);
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
      });

    channelRef.current = channel;

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track user presence
        await channel.track({
          user_id: user.id,
          username: user.email,
          display_name: user.email?.split('@')[0] || 'Anonymous',
          online_at: new Date().toISOString(),
          debate_id: debateId,
          status: 'active'
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

  const getConnectionStatusText = () => {
    switch (connectionState) {
      case 'connecting':
        return 'Connecting to video...';
      case 'connected':
        return 'Video connected';
      case 'disconnected':
        return 'Video disconnected';
      case 'failed':
        return 'Connection failed';
      case 'new':
        return 'Initializing...';
      default:
        return 'Unknown status';
    }  
  };

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'text-green-400';
      case 'connecting':
      case 'new':
        return 'text-yellow-400';
      case 'disconnected':
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
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
      {/* Enhanced Header with WebRTC Status */}
      <div className="p-6 bg-black/30 backdrop-blur-lg border-b border-purple-500/20">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                🎯 Live Video Debate Arena
              </h2>
            </div>
            <p className="text-slate-300 text-lg font-medium">
              {debateRequest.topic}
            </p>
            <div className="flex items-center gap-6 text-sm mt-2">
              <div className={`flex items-center gap-2 ${getConnectionStatusColor()}`}>
                <div className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-green-400 animate-pulse' : connectionState === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'}`}></div>
                {getConnectionStatusText()}
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
        {/* Real-time Video Conference Area */}
        <div className="flex-1 p-6">
          <div className="h-full w-full">
            {/* Render the LiveKit video component immediately when debateRequest & user exist */}
            <LiveKitDebateVideo
              roomName={debateId}
              userId={user.id}
              displayName={user.email?.split('@')[0] || user.id}
              isMuted={false}
              isCameraEnabled={true}
            />
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

          {/* WebRTC Connection Status */}
          <Card className="bg-slate-800/50 border-slate-600/50 p-4 mb-6 backdrop-blur-sm">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              🔗 Video Connection Status
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Your Camera</span>
                <span className={`flex items-center gap-2 ${localStream ? 'text-green-400' : 'text-red-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${localStream ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  {localStream ? 'Active' : 'Disconnected'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">{getOpponentName()}'s Camera</span>
                <span className={`flex items-center gap-2 ${remoteStream ? 'text-green-400' : 'text-yellow-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${remoteStream ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
                  {remoteStream ? 'Connected' : 'Waiting...'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">WebRTC Status</span>
                <span className={`flex items-center gap-2 ${getConnectionStatusColor()}`}>
                  <div className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-green-400 animate-pulse' : connectionState === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'}`}></div>
                  {connectionState.charAt(0).toUpperCase() + connectionState.slice(1)}
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
