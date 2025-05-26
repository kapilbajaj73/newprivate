import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWebSocketContext } from '@/lib/wsContext';
import { useQuery } from '@tanstack/react-query';
import { User, CircleUser, UserCheck, Volume2 } from 'lucide-react';
import DirectTalkButton from './DirectTalkButton';
import MonitorPushToTalk from './MonitorPushToTalk';
import AdminAudioReceiver from './AdminAudioReceiver';
import { useAuth } from '@/lib/authContext';

type OnlineUser = {
  id: number;
  username: string;
  fullName?: string;
  status: 'online' | 'speaking' | 'offline';
  lastActivity: number;
  roomId: number;
};

export default function OnlineUsersPanel() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const { lastMessage } = useWebSocketContext();
  const { user } = useAuth();
  
  // Fetch all users from the API using the monitoring endpoint
  const { data: users } = useQuery<any[]>({
    queryKey: ['/api/users/monitor'],
    refetchInterval: 15000, // Refresh every 15 seconds
  });
  
  // Process WebSocket messages to update user statuses
  useEffect(() => {
    if (!lastMessage) return;
    
    try {
      const message = typeof lastMessage === 'string' 
        ? JSON.parse(lastMessage) 
        : lastMessage;
      
      // Handle user status updates
      if (message.type === 'USER_STATUS') {
        const { userId, status, roomId } = message;
        
        setOnlineUsers(prev => {
          // Find if user already exists in our list
          const userIndex = prev.findIndex(u => u.id === userId);
          
          if (userIndex >= 0) {
            // Update existing user
            const updatedUsers = [...prev];
            updatedUsers[userIndex] = {
              ...updatedUsers[userIndex],
              status,
              lastActivity: Date.now(),
              roomId: roomId || updatedUsers[userIndex].roomId
            };
            return updatedUsers;
          } else if (status !== 'offline') {
            // Add new user if they're not offline
            return [...prev, {
              id: userId,
              username: `User ${userId}`, // Temporary name until we get full data
              status,
              lastActivity: Date.now(),
              roomId: roomId || 0
            }];
          }
          
          return prev;
        });
      }
      
      // Handle authentication events to update user connection status
      if (message.type === 'auth-response' && message.userId) {
        const userId = message.userId;
        
        setOnlineUsers(prev => {
          const userIndex = prev.findIndex(u => u.id === userId);
          if (userIndex >= 0) {
            const updatedUsers = [...prev];
            updatedUsers[userIndex] = {
              ...updatedUsers[userIndex],
              status: 'online',
              lastActivity: Date.now()
            };
            return updatedUsers;
          }
          return prev;
        });
      }
      
      // Handle broadcast messages to update speaking status
      if (message.type === 'broadcast' && message.userId) {
        const userId = message.userId;
        
        setOnlineUsers(prev => {
          const userIndex = prev.findIndex(u => u.id === userId);
          if (userIndex >= 0) {
            const updatedUsers = [...prev];
            updatedUsers[userIndex] = {
              ...updatedUsers[userIndex],
              status: 'speaking',
              lastActivity: Date.now()
            };
            
            // Set back to online after 1 second
            setTimeout(() => {
              setOnlineUsers(current => {
                const idx = current.findIndex(u => u.id === userId);
                if (idx >= 0 && current[idx].status === 'speaking') {
                  const updated = [...current];
                  updated[idx] = {
                    ...updated[idx],
                    status: 'online'
                  };
                  return updated;
                }
                return current;
              });
            }, 1000);
            
            return updatedUsers;
          }
          return prev;
        });
      }
      
      // Handle client disconnect messages
      if (message.type === 'client-disconnect' && message.userId) {
        const userId = message.userId;
        
        setOnlineUsers(prev => {
          const userIndex = prev.findIndex(u => u.id === userId);
          if (userIndex >= 0) {
            const updatedUsers = [...prev];
            updatedUsers[userIndex] = {
              ...updatedUsers[userIndex],
              status: 'offline',
              lastActivity: Date.now()
            };
            return updatedUsers;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }, [lastMessage]);
  
  // Initialize or update online users when the users data changes
  useEffect(() => {
    if (!users) return;
    
    // Update existing online users with detailed info
    setOnlineUsers(prev => {
      const updatedUsers = [...prev];
      
      // Update existing users with data from API
      prev.forEach((user, index) => {
        const apiUser = users.find(u => u.id === user.id);
        if (apiUser) {
          updatedUsers[index] = {
            ...updatedUsers[index],
            username: apiUser.username,
            fullName: apiUser.fullName,
            roomId: apiUser.roomId
          };
        }
      });
      
      // Add users from API that aren't in the list yet (assume offline)
      users.forEach(apiUser => {
        if (!prev.some(u => u.id === apiUser.id)) {
          updatedUsers.push({
            id: apiUser.id,
            username: apiUser.username,
            fullName: apiUser.fullName,
            status: 'offline',
            lastActivity: 0,
            roomId: apiUser.roomId
          });
        }
      });
      
      return updatedUsers;
    });
  }, [users]);
  
  // Filter out admin users and keep only regular users
  const filteredUsers = onlineUsers.filter(user => {
    const apiUser = users?.find(u => u.id === user.id);
    return apiUser && apiUser.role !== 'admin';
  });
  
  // Sort users: online first, then offline, and by name within each group
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    // Online first
    if (a.status !== 'offline' && b.status === 'offline') return -1;
    if (a.status === 'offline' && b.status !== 'offline') return 1;
    
    // Speaking users before online users
    if (a.status === 'speaking' && b.status === 'online') return -1;
    if (a.status === 'online' && b.status === 'speaking') return 1;
    
    // Then by last activity (most recent first)
    if (a.status !== 'offline' && b.status !== 'offline') {
      return b.lastActivity - a.lastActivity;
    }
    
    // Then alphabetically by name
    const aName = a.fullName || a.username;
    const bName = b.fullName || b.username;
    return aName.localeCompare(bName);
  });

  return (
    <Card className="border-gray-700 bg-slate-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-blue-400" />
          <span>Connected Users</span>
          {sortedUsers.filter(u => u.status !== 'offline').length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {sortedUsers.filter(u => u.status !== 'offline').length} online
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          All users connected to the system, across all rooms
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedUsers.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <CircleUser className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {sortedUsers.map(user => (
              <div 
                key={user.id}
                className={`p-3 rounded-lg border transition-colors ${
                  user.status === 'speaking' 
                    ? 'bg-green-900/20 border-green-700/30 animate-pulse' 
                    : user.status === 'online'
                      ? 'bg-blue-900/20 border-blue-700/30'
                      : 'bg-gray-800/20 border-gray-700/30'
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`relative p-1 rounded-full ${
                      user.status === 'speaking' 
                        ? 'bg-green-900/30' 
                        : user.status === 'online'
                          ? 'bg-blue-900/30'
                          : 'bg-gray-800/30'
                    }`}>
                      <User className="h-5 w-5 text-gray-300" />
                      {user.status === 'speaking' && (
                        <div className="absolute -bottom-1 -right-1 rounded-full bg-green-500 p-0.5">
                          <Volume2 className="h-3 w-3 text-white" />
                        </div>
                      )}
                      {user.status === 'online' && (
                        <div className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-medium truncate">{user.fullName || user.username}</div>
                      <div className="text-xs text-gray-400 truncate">Room #{user.roomId}</div>
                    </div>
                  </div>
                  
                  {/* Removed individual hold-to-talk buttons */}
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Admin audio receiver to hear all users from any room */}
        {user && <AdminAudioReceiver userId={user.id} />}
        
        {/* Global push-to-talk for admin to speak to all users */}
        {user && <MonitorPushToTalk userId={user.id} />}
      </CardContent>
    </Card>
  );
}