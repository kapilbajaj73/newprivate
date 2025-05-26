import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { formatDuration } from "@/lib/jitsiUtils";
import BroadcastListener from "./BroadcastListener";
import VideoCallRequestButton from "./VideoCallRequestButton";
import AdminStatusIndicator from "./AdminStatusIndicator";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Loader2 } from "lucide-react";

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get assigned room information
  const { data: rooms = [] } = useQuery<any[]>({
    queryKey: ["/api/rooms"],
  });

  // Get user recordings
  const { data: recordings = [] } = useQuery<any[]>({
    queryKey: ["/api/recordings"],
    enabled: !!user,
  });
  
  // Clean up audio on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        const audio = audioRef.current as HTMLAudioElement;
        audio.pause();
        audio.src = '';
        audioRef.current = null;
      }
    };
  }, []);
  
  const handlePlayRecording = (recording: any) => {
    try {
      // If there's already audio playing, stop it
      if (audioRef.current) {
        const audio = audioRef.current as HTMLAudioElement;
        audio.pause();
        audio.src = '';
        audioRef.current = null;
      }
      
      // If we're clicking on the currently playing recording, toggle play/pause
      if (playingId === recording.id && audioRef.current) {
        const audio = audioRef.current as HTMLAudioElement;
        if (audio.paused) {
          audio.play()
            .then(() => setIsPlaying(true))
            .catch((err: Error) => {
              console.error('Play error:', err);
              setIsPlaying(false);
            });
        } else {
          audio.pause();
          setIsPlaying(false);
        }
        return;
      }

      // Check if we have either fileUrl or fileName
      if (!recording.fileUrl && !recording.fileName) {
        toast({
          title: "Audio Not Available",
          description: "This recording doesn't have an audio file",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
      
      // Add timestamp to prevent caching issues
      const fileUrl = (recording.fileUrl || `/api/recordings/files/${recording.fileName}`) + `?t=${Date.now()}`;
      console.log('Playing audio from:', fileUrl);
      
      const audio = new Audio(fileUrl);
      audioRef.current = audio;
      setPlayingId(recording.id);
      setIsPlaying(true);

      // Set up event listeners
      audio.addEventListener('play', () => {
        console.log('Audio started playing');
        setIsPlaying(true);
      });
      
      audio.addEventListener('pause', () => {
        console.log('Audio paused');
        setIsPlaying(false);
      });
      
      audio.addEventListener('ended', () => {
        console.log('Audio playback completed');
        setIsPlaying(false);
        setPlayingId(null);
        audioRef.current = null;
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        toast({
          title: 'Playback Error',
          description: 'The audio file may be missing or corrupted.',
          variant: 'destructive',
          duration: 5000
        });
        setPlayingId(null);
        setIsPlaying(false);
        audioRef.current = null;
      });

      audio.play()
        .then(() => console.log('Playback started successfully'))
        .catch(error => {
          console.error('Failed to start playback:', error);
          setIsPlaying(false);
          setPlayingId(null);
          audioRef.current = null;
          
          toast({
            title: 'Playback Error',
            description: 'Could not play the recording. Please try again later.',
            variant: 'destructive',
            duration: 3000
          });
        });
    } catch (err) {
      console.error('Failed to play recording:', err);
      toast({
        title: 'Playback Error',
        description: 'Failed to play this recording.',
        variant: 'destructive',
      });
      setPlayingId(null);
      setIsPlaying(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const joinRoom = () => {
    if (user && user.roomId) {
      // Navigate to the user's assigned room
      console.log(`Joining conference room ${user.roomId}`);
      navigate(`/conference/${user.roomId}`);
    } else {
      console.error("Cannot join conference: User not assigned to any room");
      // You could add a toast notification here to inform the user
    }
  };

  // Find assigned room
  const assignedRoom = user?.roomId ? rooms.find((room: any) => room.id === user.roomId) : null;

  // Admin online status is now handled by the AdminStatusIndicator component

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-[#2A3042] px-3 md:px-4 py-2 md:py-3 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 md:space-x-3">
            <h1 className="text-lg md:text-xl font-bold text-[#0EA5E9]">Onra Voice</h1>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <VideoCallRequestButton className="p-2 text-xs rounded-full bg-gradient-to-r from-blue-600/50 to-purple-600/50 hover:from-blue-600/70 hover:to-purple-600/70 mobile-touch-feedback" />
            <span className="text-xs md:text-sm font-medium text-gray-300 truncate max-w-[80px] md:max-w-full">{user.fullName}</span>
            <button 
              className="text-gray-300 hover:text-white tap-target p-2 mobile-touch-feedback"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-2 md:p-6 overflow-auto mobile-no-scrollbar">
        <div className="w-full max-w-7xl mx-auto mobile-full-width">
          {/* Communication section removed as requested */}
          
          <div className="mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold mb-1 md:mb-2">Conference Room</h2>
            <p className="text-gray-300 text-sm md:text-base">
              <span className="font-medium text-white">Onra Voice Conference</span>
            </p>
          </div>

          <Card className="bg-[#2A3042] border-none shadow-md overflow-hidden mb-4 md:mb-6 mobile-spacing">
            <CardHeader className="border-b border-gray-700 py-2 px-3 md:pb-3 md:px-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <CardTitle className="text-base md:text-lg font-medium mb-1 sm:mb-0">Conference Room</CardTitle>
                <div className="flex items-center">
                  <AdminStatusIndicator />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <div className="text-xs md:text-sm text-gray-300">Status</div>
                  <div className="font-medium text-sm md:text-base">
                    <AdminStatusIndicator className="mt-1" />
                  </div>
                </div>
                <Button 
                  className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white flex items-center justify-center space-x-1 md:space-x-2 h-10 md:h-10 px-3 md:px-4 tap-target mobile-touch-feedback w-full sm:w-auto"
                  onClick={joinRoom}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4m-5-4l5-5-5-5m5 5H3"></path>
                  </svg>
                  <span>Join Conference</span>
                </Button>
              </div>
              
              <div className="border-t border-gray-700 pt-3 md:pt-4">
                <h4 className="text-xs md:text-sm font-medium mb-2">Recent Recordings</h4>
                {recordings.length > 0 ? (
                  <div className="space-y-2">
                    {recordings.map((recording: any) => (
                      <div key={recording.id} className="bg-[#374151] p-2 md:p-3 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex items-center space-x-2 md:space-x-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-[#0EA5E9] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"></path>
                            <path d="M19 10v2a7 7 0 01-14 0v-2"></path>
                            <line x1="12" y1="19" x2="12" y2="23"></line>
                            <line x1="8" y1="23" x2="16" y2="23"></line>
                          </svg>
                          <div className="overflow-hidden mobile-text-container">
                            <div className="text-xs md:text-sm font-medium truncate">Conference Room Session</div>
                            <div className="text-xs text-gray-300 truncate">
                              {format(new Date(recording.createdAt), "MMM d, yyyy")} • {formatDuration(recording.duration)}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2 md:space-x-3 ml-0 sm:ml-2 mt-2 sm:mt-0 flex-shrink-0">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handlePlayRecording(recording)}
                            className="text-gray-300 hover:text-white h-8 w-8 p-0 md:h-9 md:w-9 tap-target mobile-touch-feedback"
                          >
                            {playingId === recording.id ? (
                              isPlaying ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              )
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs md:text-sm text-gray-400 py-3 md:py-4 text-center bg-[#374151] rounded-lg">
                    No recordings available yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          

        </div>
      </main>
      
      {/* Add broadcast listener for admin announcements */}
      {/* {user && <BroadcastListener userId={user.id} />} */}
    </div>
  );
}
