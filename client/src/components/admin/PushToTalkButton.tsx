import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { webSocket } from '@/lib/websocket';
import { Mic, MicOff, Send, Waves } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PushToTalkButtonProps {
  roomId?: number;
  userId: number;
  voiceEffect?: string;
}

export default function PushToTalkButton({ roomId, userId, voiceEffect }: PushToTalkButtonProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
        await webSocket.connect();
        webSocket.send({ type: 'auth', userId });
        setIsConnected(true);
      } catch (error) {
        console.error('WebSocket connection error:', error);
        setIsConnected(false);
      }
    };

    initializeWebSocket();
    const intervalId = setInterval(() => {
      if (!webSocket.isConnected()) {
        initializeWebSocket();
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [userId]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result;
            webSocket.send({
              type: 'broadcast',
              audio: base64data,
              roomId,
              voiceEffect,
            });
          };
          reader.readAsDataURL(event.data);
        }
      };

      recorder.start(500); // send audio chunks every 500ms
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing mic:', error);
      toast({
        title: 'Error',
        description: 'Microphone access failed. Check permissions.',
        variant: 'destructive',
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setMediaRecorder(null);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  const handleToggleRecording = () => {
    isRecording ? handleStopRecording() : handleStartRecording();
  };

  return (
    <div className="relative">
      <Button
        className={`w-full h-16 flex items-center justify-center gap-2 ${
          isRecording
            ? 'bg-red-600 hover:bg-red-700'
            : voiceEffect
            ? 'bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] hover:from-[#7C3AED] hover:to-[#0284C7]'
            : 'bg-[#8B5CF6] hover:bg-[#7C3AED]'
        } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleToggleRecording}
        disabled={!isConnected}
      >
        {isRecording ? (
          <>
            <MicOff className="h-5 w-5" />
            <span>Stop</span>
            {voiceEffect && <Waves className="h-4 w-4 ml-1 animate-pulse" />}
          </>
        ) : (
          <>
            {voiceEffect ? (
              <div className="flex items-center mr-1">
                <Mic className="h-5 w-5" />
                <Waves className="h-4 w-4 ml-1" />
              </div>
            ) : (
              <Mic className="h-5 w-5" />
            )}
            <span>
              Tap to Talk {roomId ? `(Room ${roomId})` : '(All Rooms)'}
              {voiceEffect && ` (${voiceEffect.replace(/([A-Z])/g, ' $1').toLowerCase()})`}
            </span>
          </>
        )}
      </Button>

      {isRecording && (
        <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
          <span className="text-xs text-red-500 animate-pulse flex items-center">
            <Send className="h-3 w-3 mr-1" /> Broadcasting...
          </span>
        </div>
      )}

      {!isConnected && (
        <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
          <span className="text-xs text-yellow-500">Connecting to server...</span>
        </div>
      )}
    </div>
  );
}
