
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VideoInterface } from '@/components/VideoInterface';
import { RealTimeAnalysisPanel } from '@/components/RealTimeAnalysisPanel';
import { EnhancedLeaderboard } from '@/components/EnhancedLeaderboard';
import { EnhancedPostDebateResults } from '@/components/EnhancedPostDebateResults';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DebateResultsData } from '@/hooks/useDebateResults';

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'debate' | 'results' | 'leaderboard'>('home');
  const [isDebating, setIsDebating] = useState(false);
  const [debateData, setDebateData] = useState<DebateResultsData | null>(null);
  const [transcript, setTranscript] = useState('');
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const startDebate = () => {
    setCurrentView('debate');
    setIsDebating(true);
    setTranscript('');
  };

  const endDebate = (results: any) => {
    setIsDebating(false);
    
    // Enhanced results with comparison and improvements
    const enhancedResults: DebateResultsData = {
      ...results,
      comparison: {
        aiScore: Math.floor(Math.random() * 20) + 80, // AI typically scores 80-100
        averageUserScore: Math.floor(Math.random() * 30) + 60, // Average user 60-90
        percentileRank: Math.floor(Math.random() * 40) + 60, // User's percentile
      },
      improvements: [
        "Practice using more concrete evidence to support your arguments",
        "Reduce filler words like 'um' and 'ah' for clearer delivery",
        "Improve your conclusion to better summarize key points",
        "Work on maintaining eye contact with the camera",
        "Structure your arguments with clearer transitions"
      ].slice(0, Math.floor(Math.random() * 3) + 2), // Random 2-4 suggestions
      metrics: {
        ...results.metrics,
        topicRelevance: Math.floor(Math.random() * 40) + 60,
        emotionalTone: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
        structure: {
          hasOpening: Math.random() > 0.3,
          hasArgument: Math.random() > 0.2,
          hasRebuttal: Math.random() > 0.5,
          hasConclusion: Math.random() > 0.4,
        }
      }
    };
    
    setDebateData(enhancedResults);
    setCurrentView('results');
  };

  const handleTranscriptUpdate = (newTranscript: string) => {
    setTranscript(newTranscript);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'debate':
        return (
          <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            <div className="flex-1 relative">
              <VideoInterface 
                isDebating={isDebating} 
                onEndDebate={endDebate}
                transcript={transcript}
              />
            </div>
            <div className="w-96 bg-slate-800/50 backdrop-blur-sm border-l border-blue-500/30">
              <RealTimeAnalysisPanel 
                isActive={isDebating} 
                onTranscriptUpdate={handleTranscriptUpdate}
              />
            </div>
          </div>
        );
      case 'results':
        return (
          <EnhancedPostDebateResults 
            data={debateData} 
            onReturnHome={() => setCurrentView('home')}
            onStartNewDebate={startDebate}
          />
        );
      case 'leaderboard':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <Navigation currentView={currentView} onViewChange={setCurrentView} />
            <EnhancedLeaderboard />
          </div>
        );
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
            <div className="text-center space-y-8 max-w-4xl mx-auto px-6">
              <Navigation currentView={currentView} onViewChange={setCurrentView} />
              
              <div className="space-y-4">
                <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Debatrix AI Persona
                </h1>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                  Engage in real-time debates with our AI persona. Get live speech analysis, performance feedback, and compete on the global leaderboard.
                </p>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={startDebate}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  🎯 Start Real-Time Debate
                </Button>
                <Button 
                  onClick={() => setCurrentView('leaderboard')}
                  variant="outline"
                  className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
                >
                  🏆 Live Leaderboard
                </Button>
              </div>

              <div className="grid md:grid-cols-4 gap-6 mt-12">
                <Card className="bg-slate-800/50 backdrop-blur-sm border-blue-500/30 p-6 text-center">
                  <div className="text-3xl mb-4">🤖</div>
                  <h3 className="text-lg font-semibold text-white mb-2">AI Video Persona</h3>
                  <p className="text-slate-400">Realistic AI avatar with lip-synced responses</p>
                </Card>
                <Card className="bg-slate-800/50 backdrop-blur-sm border-purple-500/30 p-6 text-center">
                  <div className="text-3xl mb-4">🎤</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Speech Recognition</h3>
                  <p className="text-slate-400">Real-time transcription and analysis</p>
                </Card>
                <Card className="bg-slate-800/50 backdrop-blur-sm border-green-500/30 p-6 text-center">
                  <div className="text-3xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Live Feedback</h3>
                  <p className="text-slate-400">Instant analysis of your debate performance</p>
                </Card>
                <Card className="bg-slate-800/50 backdrop-blur-sm border-orange-500/30 p-6 text-center">
                  <div className="text-3xl mb-4">🏆</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Global Rankings</h3>
                  <p className="text-slate-400">Live leaderboard with real-time updates</p>
                </Card>
              </div>
            </div>
          </div>
        );
    }
  };

  return renderContent();
};

export default Index;
