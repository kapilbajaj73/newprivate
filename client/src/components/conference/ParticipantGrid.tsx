import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/authContext";

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

interface ParticipantGridProps {
  roomUrl: string;
}

export default function ParticipantGrid({ roomUrl }: ParticipantGridProps) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  
  // Initialize Jitsi Meet when component mounts
  useEffect(() => {
    const loadJitsiScript = () => {
      if (window.JitsiMeetExternalAPI) return;
      
      const script = document.createElement("script");
      script.src = "https://8x8.vc/external_api.js";
      script.async = true;
      script.onload = initJitsi;
      document.body.appendChild(script);
    };

    const initJitsi = () => {
      if (!jitsiContainerRef.current) return;
      if (!window.JitsiMeetExternalAPI) return;
      if (!user) return;
      
      try {
        const domain = "8x8.vc";
        const roomName = roomUrl.split("/").pop() || "";
        
        const options = {
          roomName,
          parentNode: jitsiContainerRef.current,
          // Make the user automatically a moderator
          jwt: "create-moderator-without-token",
          userInfo: {
            displayName: user.fullName,
            email: `${user.username}@onravoice.com`,
            role: 'moderator'
          },
          configOverwrite: {
            // Audio/video settings - enable both for video calls
            startWithAudioMuted: false,  // Allow audio by default
            startWithVideoMuted: false,  // Enable video by default for video calls
            enableClosePage: false,      // Don't show close page
            disableDeepLinking: true,    // Don't deep link
            prejoinPageEnabled: false,   // Skip prejoin
            disableInviteFunctions: true, // No invites
            startAudioOnly: false,       // Support video but don't start with it
            // Disable the need for a moderator
            enableWaitingNotice: false,
            enableNoAudioDetection: false,
            enableNoisyMicDetection: false,
            // Make anyone a moderator
            enableUserRolesBasedOnToken: false,
            // Remove the waiting for host message
            hideConferenceSubject: true,
            hideConferenceTimer: true,
            // Skip the prejoin screen completely
            prejoinConfig: {
              enabled: false,
            },
            // Completely disable lobby mode
            lobby: {
              autoKnock: false,
              enableChat: false,
            },
            // Tell all browsers to join immediately without waiting
            testing: {
              p2pTestMode: true,
              skipPrejoinOnReload: true,
            },
            // Allow participants to join immediately
            p2p: {
              enabled: true,
              preferH264: true,
              disableH264: false,
              useStunTurn: true
            },
            // Make audio enabled by default (not muted)
            // We removed the duplicate startWithAudioMuted
            disableModeratorIndicator: true,
            disableFocus: true,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'chat', 'desktop', 'participants-pane', 'tileview'
            ],
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            HIDE_INVITE_MORE_HEADER: true,
            // Hide waiting for host message
            SHOW_PROMOTIONAL_CLOSE_PAGE: false,
            SHOW_JITSI_WATERMARK: false,
            DISABLE_PRESENCE_STATUS: true,
            DISABLE_FOCUS_INDICATOR: true,
            DEFAULT_BACKGROUND: '#1A1F2C',
            // Disable moderator UI completely
            DISABLE_MODERATOR_INDICATORS: true,
            DISABLE_VIDEO_BACKGROUND: false,
            DISABLE_TRANSCRIPTION_SUBTITLES: true,
            MOBILE_APP_PROMO: false,
            MAXIMUM_ZOOMING_COEFFICIENT: 1.0,
            // Allow anyone to enter the room
            AUTO_JOIN_DOMAIN: 'onravoice.com',
            HIDE_DEEP_LINKING_LOGO: true,
            HIDE_PREJOIN_DISPLAY_NAME: true,
            // Make all participants equal
            DISABLE_DOMINANT_SPEAKER_INDICATOR: false,
          },
          lang: 'en',
        };
        
        const api = new window.JitsiMeetExternalAPI(domain, options);
        jitsiApiRef.current = api;
        
        // Set up event listeners
        api.addListener('participantJoined', handleParticipantJoined);
        api.addListener('participantLeft', handleParticipantLeft);
        api.addListener('audioMuteStatusChanged', handleAudioMuteStatus);
        api.addListener('videoMuteStatusChanged', handleVideoMuteStatus);
        api.addListener('dominantSpeakerChanged', handleDominantSpeaker);
        
        // Handle errors and moderation
        api.addListener('errorOccurred', (error: any) => {
          console.error('Jitsi error:', error);
        });
        
        // Skip any moderator screens automatically
        api.addListener('readyToClose', () => {
          console.log('Jitsi meeting ready to close');
        });
        
        // Automatically handle moderation actions
        api.addListener('participantRoleChanged', (event: any) => {
          if (event.role === 'moderator') {
            console.log('User is now a moderator');
          }
        });
        
        // Bypass lobbies
        api.addListener('knockingParticipant', (event: any) => {
          // Auto-admit any knocking participants
          if (event.participant && event.participant.id) {
            api.executeCommand('answerKnockingParticipant', event.participant.id, true);
          }
        });
        
        // Clean up on component unmount
        return () => {
          if (api) {
            api.dispose();
          }
        };
      } catch (error) {
        console.error("Error initializing Jitsi Meet:", error);
      }
    };
    
    const handleParticipantJoined = (participant: any) => {
      setParticipants(prev => [
        ...prev,
        {
          id: participant.id,
          displayName: participant.displayName,
          isSpeaking: false,
          isAudioMuted: true,
          isVideoMuted: true,
        }
      ]);
    };
    
    const handleParticipantLeft = (participant: any) => {
      setParticipants(prev => prev.filter(p => p.id !== participant.id));
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
        jitsiApiRef.current.dispose();
      }
    };
  }, [roomUrl, user]);

  return (
    <div className="flex-1 p-1 md:p-2 relative">
      <div ref={jitsiContainerRef} className="w-full h-full rounded-lg overflow-hidden"></div>
    </div>
  );
}
