import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { webSocket } from '@/lib/websocket';
import { useToast } from '@/hooks/use-toast';

interface DirectTalkButtonProps {
  userId: number;
  username: string;
}

export default function DirectTalkButton({ userId, username }: DirectTalkButtonProps) {
  const [isTalking, setIsTalking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Cleanup function to ensure we stop everything properly
  const cleanupRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Error stopping recorder:', err);
      }
      mediaRecorderRef.current = null;
    }
    
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error('Error stopping tracks:', err);
      }
      streamRef.current = null;
    }
    
    setIsTalking(false);
  };

  // Ensure cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, []);

  const startTalking = async () => {
    try {
      // Connect to WebSocket if not already connected
      if (!webSocket.isConnected()) {
        await webSocket.connect();
      }
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true 
        } 
      });
      
      streamRef.current = stream;
      setIsTalking(true);
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Handle audio data
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          // Convert blob to base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            // Get just the base64 part
            const base64Audio = base64data.includes(',') 
              ? base64data.split(',')[1] 
              : base64data;
            
            // Send direct message to specific user
            webSocket.send({
              type: 'broadcast',
              targetUserId: userId,
              fromAdmin: true,
              directMessage: true,
              audio: base64Audio
            });
          };
          reader.readAsDataURL(event.data);
        }
      };
      
      // Start recording in small chunks
      mediaRecorder.start(250);
      
      toast({
        title: `Talking to ${username}`,
        description: 'They can hear you now',
        duration: 2000,
      });
      
    } catch (error) {
      console.error('Error starting direct talk:', error);
      setIsTalking(false);
      toast({
        title: 'Microphone Error',
        description: 'Could not access your microphone.',
        variant: 'destructive',
      });
    }
  };

  const stopTalking = () => {
    cleanupRecording();
    
    toast({
      title: 'Talk Ended',
      duration: 1500,
    });
  };

  return (
    <Button
      ref={buttonRef}
      variant="default"
      size="sm"
      className={`w-full ${
        isTalking 
          ? 'bg-red-600 hover:bg-red-700 text-white' 
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
      onMouseDown={() => {
        if (!isTalking) startTalking();
      }}
      onMouseUp={() => {
        if (isTalking) stopTalking();
      }}
      onTouchStart={() => {
        if (!isTalking) startTalking();
      }}
      onTouchEnd={() => {
        if (isTalking) stopTalking();
      }}
      // Fallback click handler in case touch/mouse events fail
      onClick={(e) => {
        e.preventDefault(); // Prevent default to avoid double triggering
        if (isTalking) {
          stopTalking();
        }
      }}
      // Handle cases where mouse leaves the button while pressed
      onMouseLeave={() => {
        if (isTalking) stopTalking();
      }}
    >
      {isTalking ? (
        <>
          <MicOff className="h-4 w-4 mr-2" />
          <span>Release</span>
        </>
      ) : (
        <>
          <Mic className="h-4 w-4 mr-2" />
          <span>Hold to Talk</span>
        </>
      )}
    </Button>
  );
}