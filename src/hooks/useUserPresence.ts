
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserPresence {
  user_id: string;
  is_online: boolean;
  last_seen: string;
  status: 'available' | 'busy' | 'in_debate';
  username?: string;
  display_name?: string;
}

export const useUserPresence = () => {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Update current user's presence to online
    const updatePresence = async () => {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          is_online: true,
          last_seen: new Date().toISOString(),
          status: 'available'
        });
    };

    updatePresence();

    // Fetch online users
    const fetchOnlineUsers = async () => {
      const { data, error } = await supabase
        .from('user_presence')
        .select(`
          *,
          profiles:user_id (username, display_name)
        `)
        .eq('is_online', true)
        .neq('user_id', user.id);

      if (!error && data) {
        const formattedUsers = data.map(user => ({
          ...user,
          username: user.profiles?.username,
          display_name: user.profiles?.display_name
        }));
        setOnlineUsers(formattedUsers);
      }
      setLoading(false);
    };

    fetchOnlineUsers();

    // Subscribe to presence changes
    const channel = supabase
      .channel('user-presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        () => {
          fetchOnlineUsers();
        }
      )
      .subscribe();

    // Update presence periodically
    const presenceInterval = setInterval(updatePresence, 30000);

    // Handle tab visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        supabase
          .from('user_presence')
          .update({ is_online: false, last_seen: new Date().toISOString() })
          .eq('user_id', user.id);
      } else {
        updatePresence();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(presenceInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      supabase.removeChannel(channel);
      
      // Set user offline on cleanup
      supabase
        .from('user_presence')
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq('user_id', user.id);
    };
  }, [user]);

  return { onlineUsers, loading };
};
