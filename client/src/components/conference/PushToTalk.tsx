import React, { useState, useEffect, useRef, useCallback } from 'react';
import { webRTCService } from '@/lib/webrtc';
// Using any type for User temporarily to avoid type issues
type User = any;
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface PushToTalkProps {
  user: User;
  roomId: number;
  onBack?: () => void;
}

export function PushToTalk({ user, roomId, onBack }: PushToTalkProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const pressTimeout = useRef<NodeJS.Timeout | null>(null);
  const [_, navigate] = useLocation();

  // Initialize WebRTC connection
  useEffect(() => {
    const initializeWebRTC = async () => {
      try {
        await webRTCService.joinRoom(roomId, user.id);
        setIsConnected(true);
      } catch (error) {
        console.error('Error joining WebRTC room:', error);
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to the conference room',
          variant: 'destructive',
        });
      }
    };

    initializeWebRTC();

    return () => {
      // Clean up when component unmounts
      if (isConnected) {
        webRTCService.leaveRoom();
      }
    };
  }, [roomId, user.id, toast]);

  // Handle press to talk
  const startTalking = useCallback(async () => {
    if (!isConnected) return;
    
    try {
      await webRTCService.startBroadcasting();
      setIsPressed(true);
      
      // Auto-release after 30 seconds for safety
      pressTimeout.current = setTimeout(() => {
        stopTalking();
        toast({
          title: 'Talk time limit reached',
          description: 'Press and hold to talk again',
        });
      }, 30000);
    } catch (error) {
      console.error('Error starting microphone:', error);
      toast({
        title: 'Microphone Error',
        description: 'Failed to access microphone',
        variant: 'destructive',
      });
    }
  }, [isConnected, toast]);

  const stopTalking = useCallback(() => {
    if (!isConnected) return;
    
    webRTCService.stopBroadcasting();
    setIsPressed(false);
    
    if (pressTimeout.current) {
      clearTimeout(pressTimeout.current);
      pressTimeout.current = null;
    }
  }, [isConnected]);

  // Handle touch events for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    startTalking();
  }, [startTalking]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    stopTalking();
  }, [stopTalking]);

  // Handle mouse events for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startTalking();
  }, [startTalking]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    stopTalking();
  }, [stopTalking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pressTimeout.current) {
        clearTimeout(pressTimeout.current);
      }
      stopTalking();
    };
  }, [stopTalking]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1A1F2C]">
      {/* Header with back button */}
      <div className="flex items-center p-3 bg-[#2A3042] shadow-md">
        <Button variant="ghost" className="text-gray-300 hover:text-white" onClick={handleBack}>
          <ArrowLeft size={20} />
          <span className="ml-2">Back</span>
        </Button>
      </div>
      
      {/* Connection status indicator - center of screen */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center mb-2">
            <div className={`w-3 h-3 ${isConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-2`}></div>
            <span className={`font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Conference Room</h3>
          <p className="text-sm text-gray-400">
            {isConnected ? 'Tap button below to speak' : 'Connecting to room...'}
          </p>
        </div>
      </div>
      
      {/* Push to talk button - moved to bottom of screen */}
      <div className="h-[65%] mt-auto flex flex-col items-center justify-end pb-16 bg-[#2A3042] rounded-t-3xl shadow-lg">
        <div 
          className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center ${
            isPressed 
              ? 'bg-green-500 scale-110 transition-transform duration-100' 
              : 'bg-[#0EA5E9] shadow-md hover:bg-[#0EA5E9]/90'
          }`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={stopTalking}
        >
          {isPressed ? (
            <Mic size={48} className="text-white" />
          ) : (
            <MicOff size={48} className="text-white" />
          )}
          
          {/* Pulsing effect when pressed */}
          {isPressed && (
            <div className="absolute inset-0 rounded-full animate-ping bg-green-500 opacity-50" />
          )}
        </div>
        
        <p className="mt-6 text-lg font-medium text-white">
          {isPressed ? 'Speaking...' : 'Press & Hold to Speak'}
        </p>
        
        <p className="text-sm text-gray-300 mt-2 px-4 text-center mb-8">
          {isPressed 
            ? 'Release to stop broadcasting' 
            : 'Everyone in the room will hear you'}
        </p>
      </div>
    </div>
  );
}

export default PushToTalk;