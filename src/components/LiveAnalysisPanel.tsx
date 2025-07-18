import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, MessageSquare, Target } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DebateMetrics {
  argumentStrength: number;
  emotionalTone: number;
  engagement: number;
  topicRelevance: number;
  structure: {
    hasOpening: boolean;
    hasArgument: boolean;
    hasRebuttal: boolean;
    hasConclusion: boolean;
  };
}

interface LiveAnalysisPanelProps {
  metrics: DebateMetrics;
  liveFeedback: string;
  isAnalyzing: boolean;
}

export const LiveAnalysisPanel: React.FC<LiveAnalysisPanelProps> = ({
  metrics,
  liveFeedback,
  isAnalyzing
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  const MetricCard = ({ 
    icon: Icon, 
    title, 
    score, 
    description 
  }: { 
    icon: any; 
    title: string; 
    score: number; 
    description: string; 
  }) => (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={`text-lg font-bold ${getScoreColor(score)}`}>
            {Math.round(score)}%
          </span>
          <Progress 
            value={score} 
            className="w-16 h-2"
          />
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Live Analysis
          {isAnalyzing && (
            <Badge variant="secondary" className="animate-pulse">
              Analyzing...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Live Feedback */}
        {liveFeedback && (
          <Alert>
            <MessageSquare className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {liveFeedback}
            </AlertDescription>
          </Alert>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 gap-3">
          <MetricCard
            icon={TrendingUp}
            title="Argument Strength"
            score={metrics.argumentStrength}
            description="Logic and persuasiveness of your points"
          />
          
          <MetricCard
            icon={MessageSquare}
            title="Engagement"
            score={metrics.engagement}
            description="Audience connection and delivery"
          />
          
          <MetricCard
            icon={Target}
            title="Topic Relevance"
            score={metrics.topicRelevance}
            description="Staying on topic and addressing key points"
          />
          
          <MetricCard
            icon={Brain}
            title="Emotional Tone"
            score={metrics.emotionalTone}
            description="Professional and balanced communication"
          />
        </div>

        {/* Structure Progress */}
        <div className="p-3 rounded-lg border bg-card">
          <h4 className="text-sm font-medium mb-3">Debate Structure</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(metrics.structure).map(([key, completed]) => (
              <div key={key} className="flex items-center gap-2">
                <div 
                  className={`w-3 h-3 rounded-full ${
                    completed ? 'bg-success' : 'bg-muted-foreground/30'
                  }`} 
                />
                <span className="text-xs capitalize">{key.replace('has', '')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Overall Score */}
        <div className="p-3 rounded-lg border bg-primary/5">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {Math.round((metrics.argumentStrength + metrics.engagement + metrics.topicRelevance + metrics.emotionalTone) / 4)}%
            </div>
            <div className="text-sm text-muted-foreground">Overall Performance</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};