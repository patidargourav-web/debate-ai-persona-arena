
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  total_score: number;
  total_debates: number;
  wins: number;
  win_rate: number;
  last_match_score: number | null;
  last_debate_date: string | null;
  rank: number | null;
  trend: 'up' | 'down' | 'stable';
  is_online: boolean;
  updated_at: string;
}

export const useLeaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .order('rank', { ascending: true, nullsLast: true })
        .order('total_score', { ascending: false })
        .limit(50);

      if (error) throw error;

      setLeaders(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaderboard_entries'
        },
        () => {
          console.log('Leaderboard updated, refetching...');
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { leaders, isLoading, refetch: fetchLeaderboard };
};
