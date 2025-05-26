import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Play, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RecordingWithUser {
  id: number;
  userId: number;
  roomId: number;
  fileName: string;  // Changed from filename to fileName to match DB schema
  fileUrl?: string;  // Added optional fileUrl
  duration: number;
  createdAt: string;
  user: {
    id: number;
    username: string;
    fullName: string;
    role?: string;
  } | null;
}

type GroupedRecordings = Record<string, RecordingWithUser[]>;

export default function AllRecordingsPanel() {
  const { toast } = useToast();
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [groupedRecordings, setGroupedRecordings] = useState<GroupedRecordings>({});

  // Fetch all recordings
  const { data: recordings, isLoading, error, refetch } = useQuery<RecordingWithUser[]>({
    queryKey: ['/api/recordings/all'],
    staleTime: 30000, // 30 seconds
  });

  useEffect(() => {
    if (recordings) {
      // Group recordings by user
      const grouped = recordings.reduce((acc, recording) => {
        const userKey = recording.user ? 
          `${recording.user.fullName} (${recording.user.username})` : 
          'Unknown User';
        
        if (!acc[userKey]) {
          acc[userKey] = [];
        }
        
        acc[userKey].push(recording);
        return acc;
      }, {} as GroupedRecordings);
      
      setGroupedRecordings(grouped);
    }
  }, [recordings]);

  useEffect(() => {
    // Clean up audio on component unmount
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
    };
  }, [currentAudio]);

  const playRecording = async (recording: RecordingWithUser) => {
    try {
      // If there's already audio playing, stop it
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
        setCurrentAudio(null);
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
      setCurrentAudio(audio);
      setPlayingId(recording.id);

      // Set up event listeners
      audio.addEventListener('ended', () => {
        console.log('Audio playback completed');
        setPlayingId(null);
        setCurrentAudio(null);
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
        setCurrentAudio(null);
      });

      try {
        await audio.play();
        console.log('Playback started successfully');
      } catch (playError) {
        console.error('Play error:', playError);
        toast({
          title: 'Playback Error',
          description: 'Could not play the recording. Please try again later.',
          variant: 'destructive',
          duration: 3000
        });
        setPlayingId(null);
        setCurrentAudio(null);
      }
    } catch (err) {
      console.error('Failed to play recording:', err);
      toast({
        title: 'Playback Error',
        description: 'Failed to play this recording.',
        variant: 'destructive',
      });
      setPlayingId(null);
      setCurrentAudio(null);
    }
  };

  const deleteRecording = async (id: number) => {
    try {
      const response = await fetch(`/api/recordings/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete recording');
      }

      toast({
        title: 'Success',
        description: 'Recording deleted successfully.',
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/recordings/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
    } catch (err) {
      console.error('Failed to delete recording:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete recording.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Recordings</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Failed to load recordings. Please try again.</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold">All User Recordings</h2>
      
      <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
        Manage all recordings across the platform. Recordings are automatically deleted after 7 days.
      </p>
      
      {Object.keys(groupedRecordings).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6">
            <p className="text-muted-foreground">No recordings found</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-3 sm:space-y-4">
          {Object.entries(groupedRecordings).map(([userKey, userRecordings]) => (
            <AccordionItem key={userKey} value={userKey} className="border rounded-lg">
              <AccordionTrigger className="px-3 sm:px-4 py-2 sm:py-3 hover:no-underline">
                <div className="flex justify-between items-center w-full pr-1 sm:pr-4">
                  <h3 className="text-base sm:text-lg font-medium truncate mr-2">{userKey}</h3>
                  <span className="badge bg-gray-800 text-xs px-2 py-1 rounded flex-shrink-0">
                    {userRecordings.length} recording{userRecordings.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="space-y-2 sm:space-y-3">
                  {userRecordings.map((recording) => (
                    <Card key={recording.id} className="overflow-hidden border-none bg-gray-800">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:gap-4">
                          <div className="mb-2 sm:mb-0">
                            <p className="font-medium text-sm sm:text-base truncate">
                              {new Date(recording.createdAt).toLocaleString()}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-400 truncate">
                              {formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}
                              {recording.duration && ` • ${Math.round(recording.duration)}s`}
                            </p>
                          </div>
                          <div className="flex space-x-2 mt-1 sm:mt-0 sm:ml-auto">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => playRecording(recording)}
                              disabled={playingId === recording.id}
                              className="h-8 w-8 sm:h-9 sm:w-9"
                            >
                              {playingId === recording.id ? (
                                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteRecording(recording.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-900/20 h-8 w-8 sm:h-9 sm:w-9"
                            >
                              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}