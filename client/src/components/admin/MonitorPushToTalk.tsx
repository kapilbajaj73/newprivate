import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { webSocket } from '@/lib/websocket';
import { Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MonitorPushToTalkProps {
  userId: number;
}

export default function MonitorPushToTalk({ userId }: MonitorPushToTalkProps) {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();

  // Cleanup function to ensure we properly stop recording
  const cleanupRecording = () => {
    // Stop the media recorder if it exists
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Error stopping recorder:', err);
      }
      mediaRecorderRef.current = null;
    }

    // Stop all tracks in the stream
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error('Error stopping tracks:', err);
      }
      streamRef.current = null;
    }

    // Update state
    setIsTransmitting(false);
  };

  // Check for microphone permissions when component mounts
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
        stream.getTracks().forEach(track => track.stop()); // Release the microphone
      } catch (error) {
        console.error('Microphone permission error:', error);
        setHasPermission(false);
        toast({
          title: 'Microphone Access Required',
          description: 'Please grant microphone access to use the talk functionality.',
          variant: 'destructive',
        });
      }
    };

    checkMicrophonePermission();

    // Cleanup function for component unmount
    return () => {
      cleanupRecording();
    };
  }, [toast]);

  const startTransmitting = async () => {
    try {
      // Connect to WebSocket if not already connected
      if (!webSocket.isConnected()) {
        await webSocket.connect();
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      setIsTransmitting(true);

      // Create a MediaRecorder to capture audio
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up an array to collect audio chunks
      const audioChunks: Blob[] = [];
      
      // Collect audio data whenever it becomes available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      // When recording stops, send the complete audio
      mediaRecorder.onstop = async () => {
        // Combine all chunks into one blob
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Extract the base64 data from the data URI
          const base64Audio = base64data.includes(',')
            ? base64data.split(',')[1]
            : base64data;
            
          // Send to all users - this is broadcast to everyone
          webSocket.send({
            type: 'broadcast',
            userId: userId,
            roomId: 0, // 0 means broadcast to all rooms
            audio: base64Audio,
            fromAdmin: true, // Mark this as coming from admin
            toAllUsers: true // Explicitly broadcast to all users
          });
        };
        reader.readAsDataURL(audioBlob);
      };
      
      // Request data every 1 second to accumulate audio
      mediaRecorder.start(1000);  // This will trigger ondataavailable every 1 second

      toast({
        title: 'Broadcasting to All Users',
        description: 'All users can hear you now.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error starting broadcast:', error);
      setIsTransmitting(false);
      toast({
        title: 'Broadcast Error',
        description: 'Could not start broadcasting. Please check microphone permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopTransmitting = () => {
    cleanupRecording();
    
    toast({
      title: 'Broadcast Ended',
      description: 'You are no longer broadcasting to users.',
      duration: 2000,
    });
  };

  // Toggle between transmitting and not transmitting
  const toggleTransmitting = () => {
    if (isTransmitting) {
      stopTransmitting();
    } else {
      startTransmitting();
    }
  };

  // If we don't know permission status yet, show nothing
  if (hasPermission === null) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <Button
        ref={buttonRef}
        variant="default" 
        size="lg"
        className={`rounded-full p-4 shadow-lg ${
          isTransmitting 
            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        }`}
        disabled={!hasPermission}
        onClick={toggleTransmitting}
      >
        {isTransmitting ? (
          <>
            <MicOff className="h-5 w-5 mr-2" />
            <span>Tap to Stop</span>
          </>
        ) : (
          <>
            <Mic className="h-5 w-5 mr-2" />
            <span>Tap to Talk</span>
          </>
        )}
      </Button>
    </div>
  );
}