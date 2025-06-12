
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserPresence } from '@/hooks/useUserPresence';
import { useDebateRequests } from '@/hooks/useDebateRequests';
import { SendDebateRequestDialog } from './SendDebateRequestDialog';

export const OnlineUsers = () => {
  const { onlineUsers, loading } = useUserPresence();
  const { sendRequest } = useDebateRequests();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">🟢 Online Users</h3>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        🟢 Online Users
        <Badge variant="secondary">{onlineUsers.length}</Badge>
      </h3>
      
      {onlineUsers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-2">😴</div>
          <p>No other users online right now</p>
          <p className="text-sm">Check back later for opponents!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {onlineUsers.map((user) => (
            <div key={user.user_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {(user.display_name || user.username || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">
                    {user.display_name || user.username || 'Anonymous User'}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className={`w-2 h-2 rounded-full ${
                      user.status === 'available' ? 'bg-green-500' : 
                      user.status === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="capitalize">{user.status}</span>
                  </div>
                </div>
              </div>
              
              {user.status === 'available' && (
                <Button 
                  size="sm" 
                  onClick={() => setSelectedUser(user.user_id)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Challenge
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <SendDebateRequestDialog
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        receiverId={selectedUser}
        onSend={sendRequest}
      />
    </Card>
  );
};
