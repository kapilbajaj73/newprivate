import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AudioPlayerProps {
  audioUrl: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

const AudioPlayer = ({ audioUrl, onPlayStateChange }: AudioPlayerProps) => {
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    // Add cache-busting parameter to avoid browser caching
    const timestampedUrl = `${audioUrl}?t=${Date.now()}`;
    console.log('Audio player initializing with URL:', timestampedUrl);
    
    // Create and configure audio element
    const audio = new Audio();
    
    // Set up event handlers
    audio.addEventListener('play', () => {
      console.log('Audio started playing');
      setIsPlaying(true);
      onPlayStateChange?.(true);
    });
    
    audio.addEventListener('pause', () => {
      console.log('Audio paused');
      setIsPlaying(false);
      onPlayStateChange?.(false);
    });
    
    audio.addEventListener('ended', () => {
      console.log('Audio playback completed');
      setIsPlaying(false);
      onPlayStateChange?.(false);
    });
    
    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      setHasError(true);
      setIsPlaying(false);
      onPlayStateChange?.(false);
      
      toast({
        title: "Audio Issue",
        description: "There was a problem playing this recording",
        variant: "destructive",
        duration: 3000
      });
    });
    
    // Set audio src and load it
    audio.src = timestampedUrl;
    audio.load();
    
    // Save reference
    audioRef.current = audio;
    
    // Clean up
    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [audioUrl, onPlayStateChange, toast]);
  
  // Toggle play/pause
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Always reload before playing to prevent cache issues
      audioRef.current.load();
      audioRef.current.play()
        .catch(error => {
          console.error('Error playing audio:', error);
          setHasError(true);
          
          toast({
            title: "Playback Error",
            description: "Could not play this recording",
            variant: "destructive",
            duration: 3000
          });
        });
    }
  };
  
  return (
    <Button
      onClick={togglePlayback}
      variant="ghost"
      size="icon"
      disabled={hasError}
      className={`rounded-full p-0 h-10 w-10 ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
    >
      {hasError ? (
        <AlertTriangle className="h-5 w-5" />
      ) : isPlaying ? (
        <Pause className="h-5 w-5" />
      ) : (
        <Play className="h-5 w-5" />
      )}
    </Button>
  );
};

export default AudioPlayer;