import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/authContext";
import { JITSI_DOMAIN, getJitsiOptions } from "@/lib/jitsiUtils";

interface VideoConferenceProps {
  roomName: string;
}

// Add JitsiMeetExternalAPI to window type
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface Participant {
  id: string;
  displayName: string;
  isSpeaking: boolean;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
}

export default function VideoConference({ roomName }: VideoConferenceProps) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  
  // Initialize Jitsi Meet when component mounts
  useEffect(() => {
    const loadJitsiScript = () => {
      console.log("Loading Jitsi script...");
      
      // Check if already loaded
      if (window.JitsiMeetExternalAPI) {
        console.log("Jitsi script already loaded");
        setJitsiLoaded(true);
        initJitsi();
        return;
      }
      
      // Set up loader with proper error handling
      try {
        const script = document.createElement("script");
        script.src = `https://${JITSI_DOMAIN}/external_api.js`;
        script.async = true;
        
        script.onload = () => {
          console.log("Jitsi script loaded successfully");
          setJitsiLoaded(true);
          initJitsi();
        };
        
        script.onerror = (err) => {
          console.error("Failed to load Jitsi script:", err);
          setError("Failed to load video conference interface. Please try again later.");
        };
        
        document.body.appendChild(script);
      } catch (err) {
        console.error("Error in script loading:", err);
        setError("Failed to set up video conference. Please check your connection.");
      }
    };

    const initJitsi = () => {
      if (!jitsiContainerRef.current) {
        console.error("Container ref not available");
        return;
      }
      if (!window.JitsiMeetExternalAPI) {
        console.error("JitsiMeetExternalAPI not available");
        return;
      }
      if (!user) {
        console.error("User not available");
        return;
      }
      
      try {
        // Clear any previous instances
        if (jitsiApiRef.current) {
          console.log("Disposing previous Jitsi instance");
          jitsiApiRef.current.dispose();
          jitsiApiRef.current = null;
        }
        
        console.log("Initializing Jitsi with room:", roomName);
        const domain = JITSI_DOMAIN;
        
        // Get Jitsi options from utility function
        const jitsiOptions = getJitsiOptions(
          roomName,
          user.fullName || user.username,
          `${user.username}@onravoice.com`,
          user.role === 'admin'
        );
        
        // Add parentNode and enhanced options
        const options = {
          ...jitsiOptions,
          parentNode: jitsiContainerRef.current,
          configOverwrite: {
            ...jitsiOptions.configOverwrite,
            prejoinPageEnabled: false,
            startWithVideoMuted: false,
            startWithAudioMuted: false,
            toolbarButtons: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 
              'fullscreen', 'fodeviceselection', 'hangup', 'profile', 
              'chat', 'recording', 'settings', 'raisehand'
            ],
          }
        };
        
        console.log("Creating Jitsi instance with options:", options);
        const api = new window.JitsiMeetExternalAPI(domain, options);
        jitsiApiRef.current = api;
        
        // Execute commands to auto-join
        api.executeCommand('displayName', user.fullName || user.username);
        
        // Force video on for admins
        if (user.role === 'admin') {
          console.log("User is admin, enabling camera");
          setTimeout(() => {
            api.executeCommand('toggleVideo');
          }, 2000);
        }
        
        // Set up event listeners
        api.addListener('participantJoined', handleParticipantJoined);
        api.addListener('participantLeft', handleParticipantLeft);
        api.addListener('audioMuteStatusChanged', handleAudioMuteStatus);
        api.addListener('videoMuteStatusChanged', handleVideoMuteStatus);
        api.addListener('dominantSpeakerChanged', handleDominantSpeaker);
        api.addListener('videoConferenceJoined', () => {
          console.log("User has joined the video conference");
        });
        
        // Handle errors and moderation
        api.addListener('errorOccurred', (error: any) => {
          console.error('Jitsi error:', error);
          setError(`Video conference error: ${error.error}`);
        });
        
        // Skip any moderator screens automatically
        api.addListener('readyToClose', () => {
          console.log('Jitsi meeting ready to close');
        });
        
        // Automatically handle moderation actions
        api.addListener('participantRoleChanged', (event: any) => {
          if (event.role === 'moderator') {
            console.log(`${event.participantId} is now a moderator`);
          }
        });
      } catch (err) {
        console.error('Error initializing Jitsi Meet:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to initialize video call: ${errorMessage}`);
      }
    };
    
    const handleParticipantJoined = (data: any) => {
      const { id, displayName } = data;
      setParticipants(prev => [
        ...prev,
        { 
          id,
          displayName: displayName || 'Guest',
          isSpeaking: false,
          isAudioMuted: false,
          isVideoMuted: false
        }
      ]);
    };
    
    const handleParticipantLeft = (data: any) => {
      const { id } = data;
      setParticipants(prev => prev.filter(p => p.id !== id));
    };
    
    const handleAudioMuteStatus = (data: any) => {
      const { id, muted } = data;
      setParticipants(prev => 
        prev.map(p => p.id === id ? { ...p, isAudioMuted: muted } : p)
      );
    };
    
    const handleVideoMuteStatus = (data: any) => {
      const { id, muted } = data;
      setParticipants(prev => 
        prev.map(p => p.id === id ? { ...p, isVideoMuted: muted } : p)
      );
    };
    
    const handleDominantSpeaker = (data: any) => {
      const { id } = data;
      setParticipants(prev => 
        prev.map(p => ({ ...p, isSpeaking: p.id === id }))
      );
    };
    
    loadJitsiScript();
    
    return () => {
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch (err) {
          console.error("Error disposing Jitsi instance:", err);
        }
      }
    };
  }, [roomName, user]);

  // Handle loading state and errors
  if (error) {
    return (
      <div className="flex-1 p-4 flex flex-col items-center justify-center bg-[#1A1F2C] text-white">
        <div className="p-6 bg-red-900/20 border border-red-700/30 rounded-lg max-w-md text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3 className="text-xl font-bold mb-2">Video Conference Error</h3>
          <p className="text-gray-300">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!jitsiLoaded) {
    return (
      <div className="flex-1 p-4 flex flex-col items-center justify-center bg-[#1A1F2C] text-white">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent mb-4"></div>
        <p className="text-lg">Loading video conference...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-1 md:p-2 relative">
      <div ref={jitsiContainerRef} className="w-full h-full rounded-lg overflow-hidden bg-[#1A1F2C]">
        {!jitsiApiRef.current && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>
      
      {/* Controls overlay */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
        <div className="px-4 py-2 bg-black/50 rounded-full flex items-center space-x-2 pointer-events-auto">
          <button 
            onClick={() => jitsiApiRef.current?.executeCommand('toggleAudio')}
            className="p-2 rounded-full hover:bg-gray-700 focus:outline-none text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
          <button 
            onClick={() => jitsiApiRef.current?.executeCommand('toggleVideo')}
            className="p-2 rounded-full hover:bg-gray-700 focus:outline-none text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}