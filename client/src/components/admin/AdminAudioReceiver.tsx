import { useEffect, useRef, useState } from 'react';
import { webSocket } from '@/lib/websocket';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/authContext';

interface AdminAudioReceiverProps {
  userId: number; // Admin's user ID
}

export default function AdminAudioReceiver({ userId }: AdminAudioReceiverProps) {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { user } = useAuth();
  
  // Check if this component is being used by an admin
  const isAdmin = user?.role === 'admin';
  
  // On component mount, set up WebSocket listeners
  useEffect(() => {
    // Don't proceed if not an admin
    if (!isAdmin) return;
    
    console.log('Admin audio receiver initialized');
    
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
    
    // Handler for incoming audio broadcasts - this is the KEY function
    // It will allow admins to hear ALL user audio regardless of which room they're in
    const handleMessage = (data: any) => {
      // Check if this is an audio broadcast
      if (data.type === 'broadcast' && data.audio) {
        // Skip our own broadcasts
        if (data.userId === userId) {
          return;
        }
        
        // IMPORTANT: This is admin mode, we want to hear ALL audio from all users
        // regardless of room! No room filtering here
        
        try {
          // Create a blob from the base64 audio data
          const audioBlob = dataURItoBlob(data.audio);
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // If there was a previous audio URL, revoke it to avoid memory leaks
          if (audioRef.current?.src && audioRef.current.src.startsWith('blob:')) {
            URL.revokeObjectURL(audioRef.current.src);
          }
          
          // Set the new audio source
          audioRef.current!.src = audioUrl;
          
          // Show a toast for new speakers so admin knows who's talking
          const speakerName = data.username || `User ${data.userId}`;
          // toast({
          //   title: "User Speaking",
          //   description: `${speakerName} is speaking`,
          //   duration: 2000,
          // });
          
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
      if (audioRef.current?.src && audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current.src = '';
      }
      
      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    };
  }, [userId, toast, isAdmin, user?.role]);
  
  // Invisible component - all handled via audio element
  return null;
}

// Utility function to convert data URI to Blob
function dataURItoBlob(dataURI: string): Blob {
  // If dataURI doesn't contain a comma, it's already in base64 format without data URI prefix
  if (!dataURI.includes(',')) {
    const byteString = atob(dataURI);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'audio/webm' });
  }
  
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