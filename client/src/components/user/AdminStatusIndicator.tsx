import { useEffect, useState } from "react";
import { useWebSocketContext } from "@/lib/wsContext";
import { useQuery } from "@tanstack/react-query";

interface AdminStatusIndicatorProps {
  className?: string;
}

export default function AdminStatusIndicator({ className = "" }: AdminStatusIndicatorProps) {
  const [isAdminOnline, setIsAdminOnline] = useState<boolean>(false);
  const { lastMessage } = useWebSocketContext();
  
  // Use React Query to check admin status with automatic retries and refetching
  const { data: adminStatus, isError: adminStatusError } = useQuery<{ online: boolean }>({
    queryKey: ['/api/admin/status'],
    refetchInterval: 30000, // Check every 30 seconds
    retry: 3,
    refetchOnWindowFocus: true,
    staleTime: 15000,
  });
  
  // Check for connected users to infer admin status as fallback
  const { data: connectedUsers = [], isError: connectedUsersError } = useQuery<any[]>({
    queryKey: ["/api/rooms/connected-users"],
    refetchInterval: 15000, // Check every 15 seconds
    retry: 3, 
    refetchOnWindowFocus: true,
    staleTime: 10000,
    enabled: adminStatusError || !adminStatus, // Only run if admin status check fails
  });
  
  // Process admin status data
  useEffect(() => {
    if (adminStatus && typeof adminStatus.online === 'boolean') {
      setIsAdminOnline(adminStatus.online);
    } else if (connectedUsers && connectedUsers.length > 0) {
      // Use connected users as fallback
      const adminConnected = connectedUsers.some((u: any) => u.role === 'admin');
      setIsAdminOnline(adminConnected);
    }
  }, [adminStatus, connectedUsers]);
  
  // Listen for admin status changes via websocket (realtime updates)
  useEffect(() => {
    if (!lastMessage) return;
    
    try {
      const message = typeof lastMessage === 'string' ? JSON.parse(lastMessage) : lastMessage;
      
      if (message.type === 'admin-status-change') {
        console.log('Admin status change via WebSocket:', message.online);
        setIsAdminOnline(message.online);
      }
      
      // Alternative method: detect admin in initial user data
      if (message.type === 'INITIAL_DATA' && message.table === 'users') {
        const users = message.data || [];
        const adminUsers = users.filter((u: any) => u.role === 'admin');
        
        if (adminUsers.length > 0) {
          console.log('Admin users found in initial data:', adminUsers.length);
          // This doesn't mean they're online, but we can display this info
        }
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }, [lastMessage]);
  
  const indicatorClasses = `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
    isAdminOnline 
      ? "bg-green-100 text-green-800" 
      : "bg-amber-100 text-amber-800"
  } ${className}`;
  
  return (
    <div className={indicatorClasses}>
      <span className={`w-2 h-2 rounded-full mr-1 ${isAdminOnline ? 'bg-green-500' : 'bg-amber-500'}`}></span>
      {isAdminOnline ? "Admin Online" : "Waiting for Admin"}
    </div>
  );
}