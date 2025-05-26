import { useEffect, useRef } from 'react';
import { webSocket } from '@/lib/websocket';
import { useToast } from '@/hooks/use-toast';

interface AudioReceiverProps {
  userId: number;
  roomId?: number; // If in a specific room, only play audio from that room
}

export default function AudioReceiver({ userId, roomId }: AudioReceiverProps) {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // On component mount, set up WebSocket listeners
  useEffect(() => {
    // Initialize audio context for better browser compatibility
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.error('Failed to create AudioContext:', error);
      }
    }
    
    // Create audio element if not exists
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    // Handler for incoming audio broadcasts
    const handleMessage = (data: any) => {
      // Check if this is an audio broadcast
      if (data.type === 'broadcast' && data.audio) {
        // Skip our own broadcasts
        if (data.userId === userId) {
          return;
        }
        
        // Special handling for direct messages from admin
        if (data.directMessage) {
          // Only play if we are the target
          if (data.targetUserId === userId) {
            console.log('Received direct message from admin');
          } else {
            // Not for us, skip
            return;
          }
        } else {
          // Regular room broadcast logic
          // If we're in a specific room, only play audio targeted for that room
          if (roomId && data.roomId && data.roomId !== roomId) {
            return;
          }
        }
        
        try {
          // Create a blob from the base64 audio data
          const audioBlob = dataURItoBlob(data.audio);
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // If there was a previous audio URL, revoke it to avoid memory leaks
          if (audioRef.current?.src) {
            URL.revokeObjectURL(audioRef.current.src);
          }
          
          // Set the new audio source
          audioRef.current!.src = audioUrl;
          
          // If this is a direct message from admin, show a toast notification
          if (data.directMessage && data.fromAdmin) {
            toast({
              title: "Direct Message",
              description: `Admin is speaking directly to you`,
              duration: 2000,
            });
          }
          // If there's a voice effect indicator, show a toast notification
          else if (data.voiceEffect) {
            const effectName = data.voiceEffect.replace(/([A-Z])/g, ' $1').toLowerCase();
            
            toast({
              title: "Voice Effect Detected",
              description: `The speaker is using ${effectName} effect`,
              duration: 2000,
            });
          }
          
          // Play the audio
          audioRef.current!.play().catch(error => {
            console.error('Error playing audio:', error);
          });
        } catch (error) {
          console.error('Error processing audio broadcast:', error);
        }
      }
    };
    
    // Register message handler
    webSocket.onMessage(handleMessage);
    
    // Clean up when component unmounts
    return () => {
      // Remove message listener
      webSocket.removeMessageListener(handleMessage);
      
      // Revoke any object URLs to prevent memory leaks
      if (audioRef.current?.src) {
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current.src = '';
      }
      
      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    };
  }, [userId, roomId, toast]);
  
  // Invisible component - all handled via audio element
  return null;
}

// Utility function to convert data URI to Blob
function dataURItoBlob(dataURI: string): Blob {
  // Extract content type and base64 data
  const byteString = dataURI.split(',')[0].indexOf('base64') >= 0 
    ? atob(dataURI.split(',')[1])
    : decodeURI(dataURI.split(',')[1]);
    
  // Extract content type
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  
  // Write the bytes to an ArrayBuffer
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  // Create a Blob from the ArrayBuffer
  return new Blob([ab], { type: mimeString });
}