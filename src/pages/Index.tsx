
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeLandingPage } from '@/components/HomeLandingPage';
import { VideoInterface } from '@/components/VideoInterface';
import { RealTimeAnalysisPanel } from '@/components/RealTimeAnalysisPanel';
import { EnhancedLeaderboard } from '@/components/EnhancedLeaderboard';
import { EnhancedPostDebateResults } from '@/components/EnhancedPostDebateResults';
import { Navigation } from '@/components/Navigation';
import { UserDebatesSection } from '@/components/UserDebatesSection';
import { useAuth } from '@/contexts/AuthContext';
import { DebateResultsData } from '@/hooks/useDebateResults';

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'debate' | 'results' | 'leaderboard' | 'user-debates'>('home');
  const [isDebating, setIsDebating] = useState(false);
  const [debateData, setDebateData] = useState<DebateResultsData | null>(null);
  const [transcriptHistory, setTranscriptHistory] = useState<{ speaker: 'AI' | 'Person'; text: string; timestamp: number }[]>([]);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading your debate arena...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const startDebate = () => {
    setCurrentView('debate');
    setIsDebating(true);
    setTranscriptHistory([]);
  };

  const endDebate = (results: any) => {
    setIsDebating(false);
    
    const enhancedResults: DebateResultsData = {
      ...results,
      comparison: {
        aiScore: Math.floor(Math.random() * 20) + 80,
        averageUserScore: Math.floor(Math.random() * 30) + 60,
        percentileRank: Math.floor(Math.random() * 40) + 60,
      },
      improvements: [
        "Practice using more concrete evidence to support your arguments",
        "Reduce filler words like 'um' and 'ah' for clearer delivery",
        "Improve your conclusion to better summarize key points",
        "Work on maintaining eye contact with the camera",
        "Structure your arguments with clearer transitions"
      ].slice(0, Math.floor(Math.random() * 3) + 2),
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

  const handleTranscriptUpdate = (newTranscriptHistory: { speaker: 'AI' | 'Person'; text: string; timestamp: number }[]) => {
    setTranscriptHistory(newTranscriptHistory);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'debate':
        return (
          <div className="flex flex-col lg:flex-row h-screen bg-background">
            <div className="flex-1 relative min-h-[60vh] lg:min-h-full">
              <VideoInterface 
                isDebating={isDebating} 
                onEndDebate={endDebate}
                onTranscriptUpdate={handleTranscriptUpdate}
              />
            </div>
            <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-border">
              <RealTimeAnalysisPanel 
                isActive={isDebating} 
                onTranscriptUpdate={handleTranscriptUpdate}
                transcriptHistory={transcriptHistory}
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
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-6 lg:py-8">
              <Navigation currentView={currentView} onViewChange={setCurrentView} />
              <div className="mt-8">
                <EnhancedLeaderboard />
              </div>
            </div>
          </div>
        );
      case 'user-debates':
        return (
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-6 lg:py-8">
              <Navigation currentView={currentView} onViewChange={setCurrentView} />
              <div className="mt-8">
                <UserDebatesSection />
              </div>
            </div>
          </div>
        );
      default:
        return (
          <HomeLandingPage 
            onStartDebate={startDebate}
            onUserDebates={() => setCurrentView('user-debates')}
            onLeaderboard={() => setCurrentView('leaderboard')}
          />
        );
    }
  };

  return renderContent();
};

export default Index;

