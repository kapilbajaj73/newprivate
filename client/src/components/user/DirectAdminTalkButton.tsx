import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { webSocket } from '@/lib/websocket';
import { Mic, MicOff, Send, Waves } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DirectAdminTalkButtonProps {
  userId: number;
  className?: string;
}

export default function DirectAdminTalkButton({ userId, className = '' }: DirectAdminTalkButtonProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Connect to WebSocket when component mounts
  useEffect(() => {
    // Initialize WebSocket connection
    const initializeWebSocket = async () => {
      try {
        await webSocket.connect();
        
        // Authenticate with WebSocket server
        webSocket.send({
          type: 'auth',
          userId: userId
        });
        
        setIsConnected(true);
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        setIsConnected(false);
      }
    };
    
    // Initial connection
    initializeWebSocket();
    
    // Set up interval to check connection
    const intervalId = setInterval(() => {
      if (!webSocket.isConnected()) {
        initializeWebSocket();
      }
    }, 5000);
    
    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [userId]);
  
  const handleStartRecording = async () => {
    try {
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert blob to base64 for transmission
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          
          // Send audio via WebSocket - this will be routed to admin only
          webSocket.send({
            type: 'broadcast',
            audio: base64data,
            // No roomId means it's a direct message to admin
            // targetAdmins flag is handled server-side to route this only to admins
          });
          
          // Clear the chunks for next recording
          audioChunksRef.current = [];
        };
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting audio recording:', error);
      toast({
        title: 'Error',
        description: 'Failed to access microphone. Please check permissions.',
        variant: 'destructive'
      });
    }
  };
  
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      <Button
        className={`w-full h-16 flex items-center justify-center gap-2 ${
          isRecording 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] hover:from-[#7C3AED] hover:to-[#0284C7]'
        } ${
          !isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onMouseDown={handleStartRecording}
        onMouseUp={handleStopRecording}
        onTouchStart={handleStartRecording}
        onTouchEnd={handleStopRecording}
        disabled={!isConnected}
      >
        {isRecording ? (
          <>
            <MicOff className="h-5 w-5" />
            <span>Release to Send to Admin</span>
          </>
        ) : (
          <>
            <Mic className="h-5 w-5" />
            <span>
              Hold to Talk to Admin Directly
            </span>
          </>
        )}
      </Button>
      
      {isRecording && (
        <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
          <span className="text-xs text-red-500 animate-pulse flex items-center">
            <Send className="h-3 w-3 mr-1" /> Sending to admin...
          </span>
        </div>
      )}
      
      {!isConnected && (
        <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
          <span className="text-xs text-yellow-500">
            Connecting to server...
          </span>
        </div>
      )}
    </div>
  );
}