
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DebateRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  topic: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
  sender_profile?: {
    username: string;
    display_name: string;
  };
  receiver_profile?: {
    username: string;
    display_name: string;
  };
}

export const useDebateRequests = () => {
  const [requests, setRequests] = useState<DebateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('debate_requests')
      .select(`
        *,
        sender_profile:sender_id (username, display_name),
        receiver_profile:receiver_id (username, display_name)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();

    if (!user) return;

    // Subscribe to debate request changes
    const channel = supabase
      .channel('debate-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'debate_requests'
        },
        (payload) => {
          fetchRequests();
          
          // Show toast for new requests
          if (payload.eventType === 'INSERT' && payload.new.receiver_id === user.id) {
            toast({
              title: "New Debate Request",
              description: `You received a debate request about "${payload.new.topic}"`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const sendRequest = async (receiverId: string, topic: string, message?: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('debate_requests')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        topic,
        message
      });

    if (!error) {
      toast({
        title: "Request Sent",
        description: "Your debate request has been sent successfully!",
      });
      return true;
    } else {
      toast({
        title: "Error",
        description: "Failed to send debate request. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const respondToRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    const { error } = await supabase
      .from('debate_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (!error) {
      toast({
        title: status === 'accepted' ? "Request Accepted" : "Request Declined",
        description: `You have ${status} the debate request.`,
      });
      return true;
    } else {
      toast({
        title: "Error",
        description: "Failed to respond to request. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    requests,
    loading,
    sendRequest,
    respondToRequest,
    refreshRequests: fetchRequests
  };
};
