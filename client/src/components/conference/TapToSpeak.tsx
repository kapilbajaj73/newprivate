import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startRecording, stopRecording, saveRecording } from "@/lib/jitsiUtils";
import { useToast } from "@/hooks/use-toast";
import { Check, Wifi, WifiOff } from "lucide-react";

interface TapToSpeakProps {
  userId: number;
  roomId: number;
  onRecordingChange: (isRecording: boolean) => void;
}

// Local recording state type
interface RecordingStateType {
  isRecording: boolean;
  mediaRecorder: MediaRecorder | null;
  recordedChunks: Blob[];
  audioStream: MediaStream | null;
}

export default function TapToSpeak({ userId, roomId, onRecordingChange }: TapToSpeakProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(true); // Set to true by default
  const [recordingState, setRecordingState] = useState<RecordingStateType>({
    isRecording: false,
    mediaRecorder: null,
    recordedChunks: [],
    audioStream: null,
  });
  const recordingStartTime = useRef<number | null>(null);
  const { toast } = useToast();
  const overlayRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  // Check for and reset any stale recording state on component mount
  useEffect(() => {
    if (recordingState.audioStream) {
      recordingState.audioStream.getTracks().forEach(track => track.stop());
      setRecordingState({
        isRecording: false,
        mediaRecorder: null,
        recordedChunks: [],
        audioStream: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save recording mutation
  const saveRecordingMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      roomId, 
      audioBlob, 
      duration 
    }: { 
      userId: number; 
      roomId: number; 
      audioBlob: Blob; 
      duration: number 
    }) => {
      return saveRecording(userId, roomId, audioBlob, duration);
    },
    onSuccess: (data) => {
      console.log("Recording saved successfully:", data);
      toast({
        title: "Recording saved",
        description: "Your voice recording has been saved successfully",
        duration: 2000, // Short-duration toast for non-intrusive feedback
      });
      
      // Invalidate the recordings query to trigger a refetch with specific room ID
      console.log('Invalidating recordings queries for room:', roomId);
      queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recordings', roomId] });
      
      // Force refetch to ensure immediate update
      queryClient.refetchQueries({ queryKey: ['/api/recordings', roomId] });
    },
    onError: (error) => {
      console.error("Error in saveRecordingMutation:", error);
      toast({
        title: "Error saving recording",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update parent component about recording state
  useEffect(() => {
    onRecordingChange(recordingState.isRecording);
  }, [recordingState.isRecording, onRecordingChange]);

  // ADD TOUCH EVENT LISTENERS
  // This ensures the touch events on the overlay actually trigger hold-to-talk behavior
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    
    // Define event listeners for HOLD to talk (not toggle)
    const handleTouchStart = () => {
      console.log("Touch start detected on overlay - starting voice");
      if (!isSpeaking && !recordingState.isRecording) {
        handleTapStart();
      }
    };
    
    const handleTouchEnd = () => {
      console.log("Touch end detected on overlay - stopping voice");
      if (isSpeaking && recordingState.isRecording) {
        handleTapEnd();
      }
    };
    
    // Add event listeners
    overlay.addEventListener('touchstart', handleTouchStart);
    overlay.addEventListener('touchend', handleTouchEnd);
    overlay.addEventListener('mousedown', handleTouchStart);
    overlay.addEventListener('mouseup', handleTouchEnd);
    // Also handle mouse leave to prevent stuck recording if mouse leaves element while pressed
    overlay.addEventListener('mouseleave', handleTouchEnd);
    
    // Clean up
    return () => {
      overlay.removeEventListener('touchstart', handleTouchStart);
      overlay.removeEventListener('mousedown', handleTouchStart);
      overlay.removeEventListener('touchend', handleTouchEnd);
      overlay.removeEventListener('mouseup', handleTouchEnd);
      overlay.removeEventListener('mouseleave', handleTouchEnd);
    };
  }, [isSpeaking, recordingState.isRecording]);

  const handleTapStart = async () => {
    // Prevent starting a new recording if already recording
    if (isSpeaking || recordingState.isRecording) {
      console.log("Already recording, ignoring tap start");
      return;
    }
    
    console.log("handleTapStart triggered");
    setIsSpeaking(true);
    
    // Start recording
    try {
      console.log("Starting recording from tap handler");
      const newRecordingState = await startRecording(recordingState);
      setRecordingState(newRecordingState);
      recordingStartTime.current = Date.now();
      
      // Show recording started toast
      toast({
        title: "Recording started",
        description: "Hold to continue speaking. Release to stop.",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      setIsSpeaking(false); // Reset UI state
      toast({
        title: "Error",
        description: "Could not start recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const handleTapEnd = async () => {
    // Only proceed if actually recording
    if (!isSpeaking || !recordingState.isRecording) {
      console.log("Not recording, ignoring tap end");
      return;
    }
    
    console.log("handleTapEnd triggered - Stopping recording");
    setIsSpeaking(false);
    
    // Stop recording if it was started
    if (recordingState.isRecording && recordingStartTime.current) {
      try {
        // Add debug log for tracking
        console.log("Stopping recording that started at:", new Date(recordingStartTime.current).toISOString());
        
        // Show stopping toast
        toast({
          title: "Stopping recording...",
          description: "Processing your recording",
          duration: 1500,
        });
        
        // Stop recording and get the audio blob
        const { state, audioBlob } = await stopRecording(recordingState);
        setRecordingState(state);
        
        // Calculate duration
        const durationMs = Date.now() - recordingStartTime.current;
        const durationSeconds = Math.ceil(durationMs / 1000);
        
        console.log(`Recording completed, duration: ${durationSeconds}s, blob size: ${audioBlob?.size || 0} bytes`);
        
        // Only save if the recording is longer than 1 second
        if (audioBlob && durationSeconds > 1) {
          console.log(`Saving recording for user ${userId} in room ${roomId}`);
          
          // Show saving indicator to user
          toast({
            title: "Saving recording...",
            description: "Your recording is being processed",
            duration: 2000,
          });
          
          // Important: Make sure we call the mutation properly
          saveRecordingMutation.mutate({
            userId,
            roomId,
            audioBlob,
            duration: durationSeconds,
          });
          
          // Debug log to confirm mutation was called
          console.log("Recording mutation triggered");
        } else if (durationSeconds <= 1) {
          toast({
            title: "Recording too short",
            description: "Recordings must be longer than 1 second",
            variant: "destructive",
            duration: 2000,
          });
        } else if (!audioBlob) {
          toast({
            title: "Recording failed",
            description: "No audio data was captured",
            variant: "destructive",
          });
        }
        
        recordingStartTime.current = null;
      } catch (error) {
        console.error("Error stopping recording:", error);
        toast({
          title: "Recording Error",
          description: "Failed to save your recording. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <>
      {/* Navigation bar at the top */}
      <div className="fixed top-0 left-0 right-0 bg-[#1A1F2C] p-3 md:p-4 flex items-center justify-between z-20 shadow-lg">
        <button 
          onClick={() => {
            if (isSpeaking) {
              handleTapEnd();
            }
            window.history.back();
          }}
          className="flex items-center space-x-1 text-white tap-target p-2"
          aria-label="Back to room"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span className="text-sm md:text-base">Back to Room</span>
        </button>
      </div>

      {/* Status bar at the bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1A1F2C] p-3 md:p-4 flex items-center justify-center z-20 shadow-lg tap-target mobile-spacing">
        <div className="flex items-center space-x-2 md:space-x-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 md:h-6 md:w-6 ${isSpeaking ? 'text-[#0EA5E9]' : 'text-gray-300'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isSpeaking ? (
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            ) : (
              <>
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
              </>
            )}
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
          <span className="font-medium text-sm md:text-base">
            {isSpeaking 
              ? <span className="flex flex-col items-center"><span>Recording active</span><span className="text-xs text-gray-400">(रिकॉर्डिंग चालू है)</span></span> 
              : <span className="flex flex-col items-center"><span>Hold area below to speak</span><span className="text-xs text-gray-400">(बोलने के लिए नीचे क्षेत्र को दबाकर रखें)</span></span>
            }
          </span>
        </div>
      </div>

      {/* Half-screen touch overlay for hold-to-speak (bottom half only) */}
      <div 
        ref={overlayRef}
        className="fixed bottom-0 left-0 right-0 h-1/2 z-10 no-select pointer-events-auto"
        style={{ 
          backgroundColor: isSpeaking ? 'rgba(14, 165, 233, 0.15)' : 'rgba(26, 31, 44, 0.05)',
          transition: 'background-color 0.3s ease',
          touchAction: 'none',  // Prevents default touch behaviors like scrolling
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}
        // Removing these handlers since we're now using addEventListener for better hold-to-talk behavior
      >
        {!isSpeaking && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div 
              className="rounded-full p-4 shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(145deg, #1c2235, #232a40)",
                boxShadow: "8px 8px 16px #161b29, -8px -8px 16px #242f45",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                transform: "translateY(0)",
                transition: "transform 0.2s, box-shadow 0.2s"
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "translateY(4px)";
                e.currentTarget.style.boxShadow = "4px 4px 8px #161b29, -4px -4px 8px #242f45";
                // Do not call handleTapStart here; it's now on the parent div
                e.stopPropagation(); // Prevent double triggering with parent
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "8px 8px 16px #161b29, -8px -8px 16px #242f45";
                e.stopPropagation(); // Prevent double triggering with parent
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform = "translateY(4px)";
                e.currentTarget.style.boxShadow = "4px 4px 8px #161b29, -4px -4px 8px #242f45";
                // Do not call handleTapStart here; it's now on the parent div
                e.stopPropagation(); // Prevent double triggering with parent
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "8px 8px 16px #161b29, -8px -8px 16px #242f45";
                e.stopPropagation(); // Prevent double triggering with parent
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 md:h-16 md:w-16 text-gray-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </div>
            <p className="mt-4 text-sm md:text-base text-gray-300 bg-[#1A1F2C]/70 px-3 py-1 rounded-full shadow">
              Hold this area to speak <span className="text-gray-400">(बोलने के लिए यहां दबाएं रखें)</span>
            </p>
          </div>
        )}
        
        {isSpeaking && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="relative">
              {/* Ripple effects */}
              <div className="absolute inset-0 rounded-full bg-red-500 opacity-40 animate-ping" style={{animationDuration: '1.2s'}}></div>
              <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-ping" style={{animationDuration: '1.8s', animationDelay: '0.2s'}}></div>
              <div className="absolute inset-0 rounded-full bg-red-500 opacity-10 animate-ping" style={{animationDuration: '2.4s', animationDelay: '0.4s'}}></div>
              
              {/* Main button */}
              <div className="relative bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full p-5 md:p-7 shadow-lg" 
                style={{
                  boxShadow: "0 0 20px rgba(239, 68, 68, 0.5)",
                }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 md:h-16 md:w-16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering events on parent div
                handleTapEnd();
              }}
              className="mt-5 text-base md:text-lg font-bold text-white bg-red-600 px-5 py-2 rounded-full shadow-lg hover:bg-red-700 transition-colors"
            >
              Stop Recording
            </button>
          </div>
        )}
      </div>

      {/* Upper half of the screen is transparent, allowing interaction with the room */}
      <div className="fixed top-0 left-0 right-0 h-1/2 z-0 pt-16">
        <div className="h-full bg-[#1A1F2C]/10 border-b border-gray-700/30 flex items-center justify-center">
          <div className="text-center p-4">
            <h3 className="text-xl md:text-2xl font-semibold mb-1">Conference Room</h3>
            
            {/* Connection status indicator */}
            <div className="flex items-center justify-center mb-3">
              <div className={`flex items-center justify-center px-3 py-1 rounded-full ${isConnected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-400 mr-1" />
                    <span className="text-green-400 text-sm font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-400 mr-1" />
                    <span className="text-red-400 text-sm font-medium">Disconnected</span>
                  </>
                )}
              </div>
            </div>
            
            <p className="text-gray-300 text-sm md:text-base">
              {isConnected ? 
                "Use the area below to record voice messages" : 
                "Reconnecting... Please wait or refresh the page"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
