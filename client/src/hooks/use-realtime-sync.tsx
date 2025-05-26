import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './use-auth';
import { queryClient } from '@/lib/queryClient';

type RealtimeEvent = {
  type: string;
  table?: string;
  action?: string;
  data?: any;
};

export function useRealtimeSync() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) {
      return;
    }

    // Close any existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Clear any pending reconnect timer
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // Determine the correct protocol (ws/wss)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    // Create new WebSocket connection
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      setReconnecting(false);

      // Authenticate with the server
      if (user) {
        socket.send(JSON.stringify({
          type: 'auth',
          userId: user.id
        }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as RealtimeEvent;
        
        // Handle different message types
        switch (message.type) {
          case 'INITIAL_DATA':
            // Initial data load, update cache
            if (message.table) {
              queryClient.setQueryData([`/api/${message.table}`], message.data);
            }
            break;
            
          case 'DATA_CHANGE':
            // Handle database update
            if (message.table && message.action) {
              // Invalidate query cache for the affected table
              queryClient.invalidateQueries({ queryKey: [`/api/${message.table}`] });
              
              // Show notification for important changes
              if (
                (message.action !== 'update') || 
                (message.table === 'rooms' && message.action && message.action.includes('create'))
              ) {
                toast({
                  title: `${capitalize(message.table)} ${message.action}d`,
                  description: `A ${message.table.slice(0, -1)} was ${message.action}d.`,
                });
              }
            }
            break;
            
          case 'USER_STATUS':
            // Update user status (online, offline, speaking)
            // This could trigger UI updates like showing who's speaking
            break;
            
          case 'CHAT_MESSAGE':
            // Handle chat message
            toast({
              title: 'New message',
              description: `From user ${message.data?.userId} in room ${message.data?.roomId}`,
            });
            break;
            
          case 'auth_success':
            console.log('Authenticated with WebSocket server');
            break;
            
          case 'error':
            console.error('WebSocket error:', message.data);
            toast({
              title: 'Connection Error',
              description: message.data?.message || 'An error occurred with the real-time connection',
              variant: 'destructive',
            });
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      
      // Schedule reconnect
      if (!reconnectTimerRef.current) {
        setReconnecting(true);
        reconnectTimerRef.current = window.setTimeout(() => {
          reconnectTimerRef.current = null;
          if (user) {
            console.log('Attempting to reconnect WebSocket...');
            // This will trigger a useEffect re-run
            setReconnecting(prev => !prev);
          }
        }, 3000);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: 'Connection Error',
        description: 'Error connecting to real-time server. Some features may be unavailable.',
        variant: 'destructive',
      });
    };

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [user, reconnecting, toast]);

  // Function to send a message through the WebSocket
  const sendMessage = (message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  };

  return {
    connected,
    reconnecting,
    sendMessage
  };
}

// Helper function to capitalize first letter
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}