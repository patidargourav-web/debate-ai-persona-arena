import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDebateRequests } from '@/hooks/useDebateRequests';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export const DebateRequests = () => {
  const {
    requests,
    loading,
    respondToRequest
  } = useDebateRequests();
  const { user } = useAuth();
  const navigate = useNavigate();

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const sentRequests = pendingRequests.filter(req => req.sender_id === user?.id);
  const receivedRequests = pendingRequests.filter(req => req.receiver_id === user?.id);

  const handleAcceptRequest = async (request: any) => {
    const success = await respondToRequest(request.id, 'accepted');
    if (success) {
      // Navigate to the dedicated debate page
      navigate(`/debate/${request.id}`);
    }
  };

  // If there's an active debate, show the debate interface
  if (loading) {
    return <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">📬 Debate Requests</h3>
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-lg"></div>)}
        </div>
      </Card>;
  }

  return <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        📬 Debate Requests
        {pendingRequests.length > 0 && <Badge variant="secondary">{pendingRequests.length}</Badge>}
      </h3>

      {/* Received Requests */}
      {receivedRequests.length > 0 && <div className="mb-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">📥 Incoming Requests</h4>
          <div className="space-y-3">
            {receivedRequests.map(request => <div key={request.id} className="border rounded-lg p-4 bg-blue-50/50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">
                      {request.sender_profile?.display_name || request.sender_profile?.username || 'Anonymous'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(request.created_at), {
                  addSuffix: true
                })}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700">
                    Pending
                  </Badge>
                </div>
                
                <div className="mb-3">
                  <p className="font-medium text-sm">📋 Topic:</p>
                  <p className="text-sm">{request.topic}</p>
                  {request.message && <>
                      <p className="font-medium text-sm mt-2">💬 Message:</p>
                      <p className="text-sm text-muted-foreground">{request.message}</p>
                    </>}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAcceptRequest(request)} className="bg-green-600 hover:bg-green-700">
                    🎯 Accept & Start Debate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => respondToRequest(request.id, 'declined')}>
                    Decline
                  </Button>
                </div>
              </div>)}
          </div>
        </div>}

      {/* Sent Requests */}
      {sentRequests.length > 0 && <div className="mb-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">📤 Sent Requests</h4>
          <div className="space-y-3">
            {sentRequests.map(request => <div key={request.id} className="border rounded-lg p-4 bg-slate-950">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      To: {request.receiver_profile?.display_name || request.receiver_profile?.username || 'Anonymous'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(request.created_at), {
                  addSuffix: true
                })}
                    </p>
                    <p className="text-sm mt-1">
                      <span className="font-medium">Topic:</span> {request.topic}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                    Waiting
                  </Badge>
                </div>
              </div>)}
          </div>
        </div>}

      {pendingRequests.length === 0 && <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-2">📭</div>
          <p>No pending debate requests</p>
          <p className="text-sm">Challenge someone from the online users!</p>
        </div>}
    </Card>;
};
