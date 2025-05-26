import { useState, useEffect, useRef } from 'react';
import { webRTCService } from '@/lib/webrtc';
import { webSocket } from '@/lib/websocket';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Phone, PhoneOff, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// Using any type for User temporarily to avoid type issues
type UserType = any;
import { useLocation } from 'wouter';

interface Participant {
  userId: number;
  username: string;
  isSpeaking: boolean;
  audioStream?: MediaStream;
}

interface AudioConferenceProps {
  roomId: number;
  user: UserType;
  onLeave?: () => void;
}

export function AudioConference({ roomId, user, onLeave }: AudioConferenceProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const audioRefs = useRef<Map<number, HTMLAudioElement>>(new Map());
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Initialize WebRTC connection
  useEffect(() => {
    const init = async () => {
      try {
        // Set event handlers
        webRTCService.setEventHandlers({
          onParticipantJoined: (userId) => {
            console.log(`Participant joined: ${userId}`);
            // Get user details
            // For simplicity, we'll just use the user ID as the username
            setParticipants(prev => [
              ...prev,
              {
                userId,
                username: `User ${userId}`,
                isSpeaking: false
              }
            ]);
          },
          onParticipantLeft: (userId) => {
            console.log(`Participant left: ${userId}`);
            setParticipants(prev => prev.filter(p => p.userId !== userId));
          },
          onAudioStreamAdded: (userId, stream) => {
            console.log(`Audio stream added for user ${userId}`);
            setParticipants(prev => prev.map(p => 
              p.userId === userId ? { ...p, audioStream: stream } : p
            ));
          }
        });

        // Connect to WebSocket server
        await webSocket.connect();
        
        // Authenticate with WebSocket server
        webSocket.send({
          type: 'auth',
          userId: user.id
        });

        // Join the room
        await webRTCService.joinRoom(roomId, user.id);
        setIsConnected(true);
        
        toast({
          title: 'Connected to audio conference',
          description: `You have joined room #${roomId}`,
        });
      } catch (error) {
        console.error('Error initializing WebRTC:', error);
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to the audio conference',
          variant: 'destructive',
        });
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      webRTCService.leaveRoom();
      setIsConnected(false);
    };
  }, [roomId, user.id, toast]);

  // Handle audio elements for participants
  useEffect(() => {
    participants.forEach(participant => {
      if (participant.audioStream) {
        // Create audio element if it doesn't exist
        let audioElement = audioRefs.current.get(participant.userId);
        
        if (!audioElement) {
          audioElement = new Audio();
          audioElement.autoplay = true;
          audioRefs.current.set(participant.userId, audioElement);
        }
        
        // Set or update the stream
        if (audioElement.srcObject !== participant.audioStream) {
          audioElement.srcObject = participant.audioStream;
        }
      }
    });

    // Clean up audio elements for participants who left
    audioRefs.current.forEach((audioElement, userId) => {
      if (!participants.some(p => p.userId === userId)) {
        audioElement.srcObject = null;
        audioRefs.current.delete(userId);
      }
    });
  }, [participants]);

  // Toggle microphone
  const toggleMute = async () => {
    try {
      if (isMuted) {
        // Unmute and start broadcasting
        await webRTCService.startBroadcasting();
        setIsMuted(false);
        toast({
          title: 'Microphone On',
          description: 'Others can now hear you',
        });
      } else {
        // Mute and stop broadcasting
        webRTCService.stopBroadcasting();
        setIsMuted(true);
        toast({
          title: 'Microphone Off',
          description: 'You are now muted',
        });
      }
    } catch (error) {
      console.error('Error toggling microphone:', error);
      toast({
        title: 'Microphone Error',
        description: 'Failed to access microphone',
        variant: 'destructive',
      });
    }
  };

  // Leave the conference
  const handleLeave = () => {
    webRTCService.leaveRoom();
    setIsConnected(false);
    
    toast({
      title: 'Left Conference',
      description: 'You have left the audio conference',
    });
    
    if (onLeave) {
      onLeave();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Conference controls */}
      <div className="flex justify-center gap-4 p-4 rounded-lg bg-card shadow-sm mb-4">
        <Button
          variant={isMuted ? "outline" : "default"}
          size="lg"
          className={`rounded-full p-4 ${!isMuted ? 'bg-green-500 hover:bg-green-600' : ''}`}
          onClick={toggleMute}
        >
          {isMuted ? <Mic size={24} /> : <MicOff size={24} />}
        </Button>
        
        <Button
          variant="destructive"
          size="lg"
          className="rounded-full p-4"
          onClick={handleLeave}
        >
          <Phone size={24} />
        </Button>
      </div>
      
      {/* Participants grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 flex-1 overflow-y-auto p-2">
        {/* Current user */}
        <div 
          className={`flex flex-col items-center justify-center p-4 rounded-lg shadow-sm ${
            !isMuted ? 'bg-green-100 dark:bg-green-900' : 'bg-card'
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <User size={32} className="text-primary" />
          </div>
          <p className="font-medium">{user.fullName || user.username}</p>
          <p className="text-sm text-muted-foreground">{isMuted ? 'Muted' : 'Speaking'}</p>
        </div>
        
        {/* Other participants */}
        {participants.map((participant) => (
          <div 
            key={participant.userId}
            className={`flex flex-col items-center justify-center p-4 rounded-lg shadow-sm ${
              participant.isSpeaking ? 'bg-green-100 dark:bg-green-900' : 'bg-card'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <User size={32} className="text-primary" />
            </div>
            <p className="font-medium">{participant.username}</p>
            <p className="text-sm text-muted-foreground">
              {participant.isSpeaking ? 'Speaking' : 'Silent'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AudioConference;