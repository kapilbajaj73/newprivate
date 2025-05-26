import React, { createContext, useContext, ReactNode } from 'react';
import { useRealtimeSync } from '@/hooks/use-realtime-sync';

// Type for our context
type RealtimeContextType = {
  connected: boolean;
  reconnecting: boolean;
  sendMessage: (message: any) => boolean;
};

// Create context with default values
const RealtimeContext = createContext<RealtimeContextType>({
  connected: false,
  reconnecting: false,
  sendMessage: () => false,
});

// Provider component
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const realtimeState = useRealtimeSync();

  return (
    <RealtimeContext.Provider value={realtimeState}>
      {children}
    </RealtimeContext.Provider>
  );
}

// Custom hook to use the realtime context
export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}