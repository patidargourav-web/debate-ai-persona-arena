
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface LeaderboardEntry {
  id: number;
  name: string;
  rank: number;
  score: number;
  winRate: number;
  totalDebates: number;
  lastMatchScore: number;
  trend: 'up' | 'down' | 'stable';
  isOnline: boolean;
}

export const EnhancedLeaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterBy, setFilterBy] = useState<'global' | 'monthly' | 'weekly'>('global');
  const [sortBy, setSortBy] = useState<'score' | 'winRate' | 'debates'>('score');

  useEffect(() => {
    // Simulate fetching leaderboard data
    setIsLoading(true);
    setTimeout(() => {
      const generateLeaders = (): LeaderboardEntry[] => {
        return Array(25).fill(null).map((_, i) => ({
          id: i + 1,
          name: `Player${Math.floor(Math.random() * 1000)}`,
          rank: i + 1,
          score: Math.floor(Math.random() * 500) + 500,
          winRate: Math.floor(Math.random() * 70) + 30,
          totalDebates: Math.floor(Math.random() * 100) + 10,
          lastMatchScore: Math.floor(Math.random() * 100) + 50,
          trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
          isOnline: Math.random() > 0.6,
        }));
      };

      let sorted = generateLeaders();
      
      // Sort based on selected criteria
      if (sortBy === 'score') {
        sorted = sorted.sort((a, b) => b.score - a.score);
      } else if (sortBy === 'winRate') {
        sorted = sorted.sort((a, b) => b.winRate - a.winRate);
      } else {
        sorted = sorted.sort((a, b) => b.totalDebates - a.totalDebates);
      }

      // Update ranks after sorting
      sorted = sorted.map((item, idx) => ({ ...item, rank: idx + 1 }));
      
      setLeaders(sorted);
      setIsLoading(false);
    }, 1000);

    // Simulate real-time updates via WebSocket
    const interval = setInterval(() => {
      setLeaders(prev => {
        const updated = [...prev];
        // Randomly update 1-3 players
        const updateCount = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < updateCount; i++) {
          const indexToUpdate = Math.floor(Math.random() * updated.length);
          const scoreChange = Math.floor(Math.random() * 20) - 10;
          
          updated[indexToUpdate] = {
            ...updated[indexToUpdate],
            score: Math.max(0, updated[indexToUpdate].score + scoreChange),
            trend: scoreChange > 0 ? 'up' : scoreChange < 0 ? 'down' : 'stable',
            isOnline: Math.random() > 0.3,
          };
        }
        
        // Re-sort and update ranks
        let resorted = [...updated];
        if (sortBy === 'score') {
          resorted = resorted.sort((a, b) => b.score - a.score);
        } else if (sortBy === 'winRate') {
          resorted = resorted.sort((a, b) => b.winRate - a.winRate);
        } else {
          resorted = resorted.sort((a, b) => b.totalDebates - a.totalDebates);
        }
        
        return resorted.map((item, idx) => ({ ...item, rank: idx + 1 }));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [filterBy, sortBy]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '➡️';
    }
  };

  const getTrendBadge = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <Badge className="bg-green-600 text-xs">↑</Badge>;
      case 'down':
        return <Badge className="bg-red-600 text-xs">↓</Badge>;
      default:
        return <Badge className="bg-gray-600 text-xs">—</Badge>;
    }
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <Card className="bg-slate-900/70 backdrop-blur-sm border-blue-500/30">
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <CardTitle className="text-xl text-white flex items-center">
            🏆 Live Global Leaderboard
            <Badge className="ml-2 bg-green-600 animate-pulse">LIVE</Badge>
          </CardTitle>
          
          <div className="flex space-x-2 flex-wrap">
            {/* Time Filter */}
            <div className="flex space-x-1">
              {(['global', 'monthly', 'weekly'] as const).map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant={filterBy === filter ? 'default' : 'outline'}
                  onClick={() => setFilterBy(filter)}
                  className="text-xs"
                >
                  {filter === 'global' ? 'All Time' : filter}
                </Button>
              ))}
            </div>
            
            {/* Sort Filter */}
            <div className="flex space-x-1">
              {([
                { key: 'score', label: 'Score' },
                { key: 'winRate', label: 'Win Rate' },
                { key: 'debates', label: 'Debates' }
              ] as const).map(({ key, label }) => (
                <Button
                  key={key}
                  size="sm"
                  variant={sortBy === key ? 'default' : 'outline'}
                  onClick={() => setSortBy(key)}
                  className="text-xs"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-left border-b border-slate-700">
                <tr>
                  <th className="p-3 text-slate-400 font-medium">Rank</th>
                  <th className="p-3 text-slate-400 font-medium">Player</th>
                  <th className="p-3 text-slate-400 font-medium text-right">Score</th>
                  <th className="p-3 text-slate-400 font-medium text-right">Win Rate</th>
                  <th className="p-3 text-slate-400 font-medium text-right">Debates</th>
                  <th className="p-3 text-slate-400 font-medium text-right">Last Match</th>
                  <th className="p-3 text-slate-400 font-medium text-right">Trend</th>
                </tr>
              </thead>
              <tbody>
                {leaders.slice(0, 20).map((leader, index) => (
                  <tr 
                    key={leader.id} 
                    className={`border-b border-slate-800 hover:bg-slate-800/50 transition-all duration-200 ${
                      index < 3 ? 'bg-gradient-to-r from-yellow-900/20 to-transparent' : ''
                    }`}
                  >
                    <td className="p-3 font-bold text-white text-lg">
                      {getRankDisplay(leader.rank)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                            {leader.name.substring(0, 2).toUpperCase()}
                          </div>
                          {leader.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <div>
                          <span className="text-white font-medium">{leader.name}</span>
                          {leader.isOnline && (
                            <Badge className="ml-2 bg-green-600 text-xs">Online</Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-mono text-blue-400 font-bold text-lg">
                        {leader.score.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-green-400 font-medium">{leader.winRate}%</span>
                    </td>
                    <td className="p-3 text-right text-slate-300 font-medium">
                      {leader.totalDebates}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`font-medium ${
                        leader.lastMatchScore >= 80 ? 'text-green-400' :
                        leader.lastMatchScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {leader.lastMatchScore}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {getTrendBadge(leader.trend)}
                        <span className="text-sm">{getTrendIcon(leader.trend)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="mt-4 text-center">
              <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/30">
                🔄 Updates every 3 seconds
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
