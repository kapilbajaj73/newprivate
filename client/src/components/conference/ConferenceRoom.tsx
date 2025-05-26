import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/authContext";
import TapToSpeak from "./TapToSpeak";
import RecordingsModal from "./RecordingsModal";
import AudioReceiver from "@/components/AudioReceiver";
import VideoConference from "./VideoConference";

export default function ConferenceRoom() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { roomId } = useParams();
  const [isRecording, setIsRecording] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRecordings, setShowRecordings] = useState(false);
  const [isVideoMode, setIsVideoMode] = useState(false);
  
  // Get room details
  const { data: room, isLoading } = useQuery<any>({
    queryKey: [`/api/rooms/${roomId}`],
    enabled: !!roomId,
  });

  useEffect(() => {
    // Check if user is allowed in this room
    if (user && roomId && user.roomId !== parseInt(roomId)) {
      navigate("/user");
    }
  }, [user, roomId, navigate]);

  // Check if we arrived here from a video call acceptance
  useEffect(() => {
    // If this includes a video parameter, enable video mode
    const params = new URLSearchParams(window.location.search);
    if (params.get('video') === 'true') {
      setIsVideoMode(true);
    }
  }, []);

  const handleLeaveRoom = () => {
    navigate("/user");
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };
  
  const toggleRecordings = () => {
    setShowRecordings(!showRecordings);
  };

  if (isLoading || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1F2C]">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 mx-auto mb-4 text-[#0EA5E9]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-300">Loading conference room...</p>
        </div>
      </div>
    );
  }

  // For video mode, we'll use our VideoConference component
  if (isVideoMode) {
    return (
      <div className="min-h-screen bg-[#1A1F2C] flex flex-col">
        {/* Header with room info and controls */}
        <div className="bg-[#2A3042] p-4 shadow-md flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-white">{room.name}</h1>
            <p className="text-sm text-gray-400">Video Conference</p>
          </div>
          <button
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded flex items-center space-x-1"
            onClick={handleLeaveRoom}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Leave</span>
          </button>
        </div>
        
        {/* Video conference component with room name */}
        <div className="flex-1 flex">
          <VideoConference roomName={room.name} />
        </div>
      </div>
    );
  }

  // Regular audio-only conference room view
  return (
    <div className="min-h-screen bg-[#1A1F2C]">
      {/* Tap to Speak Audio Interface - for recording voice messages */}
      <TapToSpeak 
        userId={user?.id || 0}
        roomId={roomId ? Number(roomId) : 0}
        onRecordingChange={setIsRecording}
      />
      
      {/* Floating action button for recordings - moved to top */}
      <button
        className="fixed top-14 right-4 w-10 h-10 rounded-full bg-[#8B5CF6] text-white shadow-lg flex items-center justify-center z-20"
        onClick={toggleRecordings}
        aria-label="View Recordings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18V5l12-2v13"></path>
          <circle cx="6" cy="18" r="3"></circle>
          <circle cx="18" cy="16" r="3"></circle>
        </svg>
      </button>
      
      {/* Recordings Modal */}
      <RecordingsModal 
        open={showRecordings} 
        onOpenChange={setShowRecordings} 
        roomId={roomId ? Number(roomId) : undefined} 
      />
      
      {/* Audio receiver for voice broadcasts with voice effects */}
      {user && roomId && (
        <AudioReceiver 
          userId={user.id} 
          roomId={Number(roomId)}
        />
      )}
    </div>
  );
}
