import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/authContext';
import { formatDuration } from '@/lib/jitsiUtils';
import { Loader2, Play, Pause, Music, Calendar, Clock, Share2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RecordingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId?: number;
}

export default function RecordingsModal({ open, onOpenChange, roomId }: RecordingsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPlayingId, setCurrentPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Default collapsed state
  const [expandedRecordings, setExpandedRecordings] = useState<number[]>([]);

  // Fetch recordings
  const { data: recordings, isLoading, refetch, isError } = useQuery<any[]>({
    queryKey: roomId ? [`/api/recordings`, roomId] : [`/api/recordings`],
    enabled: open,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 10000, // Refetch after 10 seconds of staleness
  });

  // Toggle individual recording expansion
  const toggleRecordingExpansion = (recordingId: number) => {
    if (expandedRecordings.includes(recordingId)) {
      setExpandedRecordings(expandedRecordings.filter(id => id !== recordingId));
    } else {
      setExpandedRecordings([...expandedRecordings, recordingId]);
    }
  };

  // Keep all recordings collapsed by default
  useEffect(() => {
    if (!recordings) return;
    
    // Always keep recordings collapsed
    setExpandedRecordings([]);
    setIsExpanded(false);
  }, [recordings]);

  // Direct in-browser audio playback implementation
  const handlePlayRecording = (recordingId: number, audioUrl: string) => {
    console.log('Play recording clicked:', recordingId, audioUrl);
    
    if (currentPlayingId === recordingId) {
      // Toggle the current recording play/pause
      if (audioRef.current) {
        if (audioRef.current.paused) {
          audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(err => {
              console.error('Play error:', err);
              setIsPlaying(false);
            });
        } else {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }
    } else {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Check if we have a valid URL
      if (!audioUrl) {
        console.error('No audio URL available for this recording');
        toast({
          title: "Audio Not Available",
          description: "This recording doesn't have an audio file yet",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
      
      // Set UI state
      setCurrentPlayingId(recordingId);
      setIsPlaying(true);
      
      // Create new audio element with timestamp to prevent caching
      const audio = new Audio(`${audioUrl}?t=${Date.now()}`);
      
      // Set up event handlers
      audio.onplay = () => {
        console.log('Audio started playing');
        setIsPlaying(true);
      };
      
      audio.onpause = () => {
        console.log('Audio paused');
        setIsPlaying(false);
      };
      
      audio.onended = () => {
        console.log('Audio playback completed');
        setIsPlaying(false);
        setCurrentPlayingId(null);
        audioRef.current = null;
      };
      
      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setIsPlaying(false);
        setCurrentPlayingId(null);
        audioRef.current = null;
        
        toast({
          title: "Playback Error",
          description: "Could not play the recording. Please try again later.",
          variant: "destructive",
          duration: 3000
        });
      };
      
      // Store reference to the audio element
      audioRef.current = audio;
      
      // Try to play the audio
      audio.play()
        .then(() => console.log('Playback started successfully'))
        .catch(error => {
          console.error('Failed to start playback:', error);
          setIsPlaying(false);
          setCurrentPlayingId(null);
          
          toast({
            title: "Playback Error",
            description: "Could not play the recording. Please try again later.",
            variant: "destructive",
            duration: 3000
          });
        });
    }
  };

  // Stop playing audio when modal is closed
  useEffect(() => {
    if (!open && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentPlayingId(null);
    }
  }, [open]);

  // Format date for UI display with enhanced readability
  const formatRecordingDate = (dateString: string) => {
    if (!dateString) {
      return "Date not available";
    }
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
      
      // Get date parts in a more readable format
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
      };
      
      return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (error) {
      return "Invalid date";
    }
  };

  // Calculate days until deletion (7 days from creation)
  const getDaysUntilDeletion = (createdAt: string) => {
    if (!createdAt) return null;
    
    try {
      const creationDate = new Date(createdAt);
      const expiryDate = new Date(creationDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
      const now = new Date();
      
      const diffTime = expiryDate.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      return null;
    }
  };

  // Simple share function
  const shareRecording = (recording: any) => {
    toast({
      title: "Share Feature",
      description: "Sharing functionality will be available in a future update.",
      duration: 3000,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1F2C] text-white border-gray-700 shadow-lg max-w-md sm:max-w-lg w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center text-xl">
            <Music className="h-5 w-5 text-[#0EA5E9] mr-2" />
            Voice Recordings
          </DialogTitle>
          <DialogDescription className="text-gray-400 flex items-center justify-between">
            <span>Listen to saved voice messages</span>
            <button
              className="text-[#0EA5E9] hover:text-[#0284C7] text-sm flex items-center px-2 py-1 rounded hover:bg-blue-500/10 transition-colors self-start sm:self-auto"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  <span className="whitespace-nowrap">Collapse All</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  <span className="whitespace-nowrap">Expand All</span>
                </>
              )}
            </button>
          </DialogDescription>
          <div className="mt-1 sm:mt-2 text-xs text-amber-400 bg-amber-900/20 p-2 rounded-md border border-amber-800/30">
            <p className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
              <span>Recordings are automatically deleted after 7 days</span>
            </p>
          </div>
        </DialogHeader>

        <div className="mt-3 sm:mt-4 space-y-2 max-h-[55vh] sm:max-h-[60vh] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-6 sm:py-10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-[#0EA5E9]" />
              <span className="ml-2 text-gray-300 text-sm sm:text-base">Loading recordings...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-6 sm:py-8 text-gray-400">
              <div className="p-2 rounded-full bg-red-500/10 mx-auto w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <p className="text-sm sm:text-base">Error loading recordings</p>
              <button 
                onClick={() => refetch()}
                className="mt-2 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 bg-[#0EA5E9] text-white rounded-full hover:bg-[#0EA5E9]/80 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : recordings && recordings.length > 0 ? (
            recordings.map((recording) => {
              const daysUntilDeletion = getDaysUntilDeletion(recording.createdAt);
              const isExpired = daysUntilDeletion !== null && daysUntilDeletion <= 0;
              const isExpandedItem = expandedRecordings.includes(recording.id);
              
              return (
                <div 
                  key={recording.id}
                  className={`bg-[#2A3042] rounded-lg p-2 sm:p-3 border ${currentPlayingId === recording.id ? 'border-[#0EA5E9]' : 'border-gray-700'} hover:border-[#0EA5E9] transition-colors shadow-md overflow-hidden`}
                >
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                    <div className="flex-1 min-w-0 order-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${daysUntilDeletion !== null && daysUntilDeletion <= 2 ? 'bg-red-500' : daysUntilDeletion !== null && daysUntilDeletion <= 4 ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                        <p className="font-medium truncate text-sm sm:text-base">
                          {recording.user?.fullName || 'Unknown User'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 mt-1 text-xs text-gray-400">
                        <span>{formatDuration(recording.duration)}</span>
                        <span>•</span>
                        <span className="truncate">{formatRecordingDate(recording.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-1.5 ml-auto order-2">
                      {/* Play/pause button - moved to first position for better mobile usability */}
                      <button
                        onClick={() => handlePlayRecording(recording.id, recording.fileUrl)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${
                          currentPlayingId === recording.id && isPlaying
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-[#0EA5E9] hover:bg-[#0EA5E9]/80'
                        } transition-colors`}
                        disabled={isExpired}
                        title={isExpired ? "Recording expired" : "Play recording"}
                      >
                        {currentPlayingId === recording.id && isPlaying ? (
                          <Pause className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        ) : (
                          <Play className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        )}
                      </button>
                      
                      {/* Share button */}
                      <button
                        onClick={() => shareRecording(recording)}
                        className="p-1 sm:p-1.5 rounded-full hover:bg-gray-700/50 transition-colors"
                        title="Share recording"
                      >
                        <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                      </button>
                      
                      {/* Toggle details button */}
                      <button
                        onClick={() => toggleRecordingExpansion(recording.id)}
                        className="p-1 sm:p-1.5 rounded-full hover:bg-gray-700/50 transition-colors"
                        title="Toggle details"
                      >
                        {isExpandedItem ? (
                          <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Expanded details section */}
                  {isExpandedItem && (
                    <div className="mt-2 pt-2 border-t border-gray-700 text-xs sm:text-sm">
                      <div className="space-y-1 mb-2">
                        <p className="flex items-center text-gray-400">
                          <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          <span>Created: {formatRecordingDate(recording.createdAt)}</span>
                        </p>
                        <p className="flex items-center text-gray-400">
                          <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          <span>Duration: {formatDuration(recording.duration)}</span>
                        </p>
                        {daysUntilDeletion !== null && (
                          <p className={`flex items-center ${daysUntilDeletion <= 2 ? 'text-red-400' : daysUntilDeletion <= 4 ? 'text-amber-400' : 'text-green-400'}`}>
                            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                            <span>
                              {daysUntilDeletion > 0
                                ? `Expires in ${daysUntilDeletion} days`
                                : 'Expired'}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recordings available</p>
              <p className="text-sm mt-1">Record a message to get started</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}