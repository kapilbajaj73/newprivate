import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './authContext';

interface WebSocketContextType {
  connected: boolean;
  sendMessage: (message: any) => void;
  lastMessage: any | null;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const { user } = useAuth();

  // WebSocket connection with retry logic
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    // Tracking retry state
    let retryCount = 0;
    const maxRetries = 5;
    const retryInterval = 3000; // Initial retry after 3 seconds
    let retryTimeout: NodeJS.Timeout | null = null;
    
    // Create WebSocket connection with retry capability
    const connectWebSocket = () => {
      console.log(`Connecting to WebSocket (attempt ${retryCount + 1}):`, wsUrl);
      
      // Clear any existing retry timeouts
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }
      
      const ws = new WebSocket(wsUrl);
      
      // Connection opened
      ws.addEventListener('open', () => {
        console.log('WebSocket connected successfully');
        setConnected(true);
        retryCount = 0; // Reset retry count on successful connection
        
        // If user is authenticated, send auth message
        if (user) {
          ws.send(JSON.stringify({
            type: 'auth',
            userId: user.id
          }));
        }
      });
      
      // Listen for messages
      ws.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      // Connection closed - attempt reconnection
      ws.addEventListener('close', (event) => {
        console.log(`WebSocket disconnected (code: ${event.code}, reason: ${event.reason})`);
        setConnected(false);
        
        // Attempt to reconnect if we haven't reached max retries
        if (retryCount < maxRetries) {
          // Exponential backoff - increase wait time with each retry
          const delay = retryInterval * Math.pow(1.5, retryCount);
          console.log(`Attempting reconnection in ${delay}ms...`);
          
          retryTimeout = setTimeout(() => {
            retryCount++;
            setSocket(null); // Clear old socket reference
            connectWebSocket(); // Try to connect again
          }, delay);
        } else {
          console.log('Maximum WebSocket reconnection attempts reached');
        }
      });
      
      // Connection error
      ws.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
        // Don't attempt reconnect here - the close event will handle it
      });
      
      // Set socket reference
      setSocket(ws);
      
      return ws;
    };
    
    // Initial connection attempt
    const ws = connectWebSocket();
    
    // Clean up on unmount
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      ws.close();
    };
  }, [user?.id]); // Reconnect if user ID changes
  
  // Send auth message when user changes
  useEffect(() => {
    if (socket && socket.readyState === WebSocket.OPEN && user) {
      socket.send(JSON.stringify({
        type: 'auth',
        userId: user.id
      }));
    }
  }, [socket, user]);
  
  // Send a message through the WebSocket
  const sendMessage = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.error('Cannot send message, WebSocket is not connected');
    }
  };
  
  return (
    <WebSocketContext.Provider value={{ connected, sendMessage, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};