// No need to import JitsiMeetExternalAPI here since it's loaded dynamically
// The Jitsi API is added to the window object when loaded

// Define interfaces for TypeScript
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export const JITSI_DOMAIN = "meet.jit.si";
export const JITSI_APP_ID = "onra-voice";

// Define types for recording state
interface RecordingState {
  isRecording: boolean;
  mediaRecorder: MediaRecorder | null;
  recordedChunks: Blob[];
  audioStream: MediaStream | null;
}

// Format a duration in seconds to MM:SS format
export function formatDuration(durationInSeconds: number): string {
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = durationInSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// Generate a unique meeting ID based on room name
export function generateMeetingId(roomName: string): string {
  const sanitized = roomName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 10);
  
  const dateSuffix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `onra-${sanitized}-${dateSuffix}`;
}

// Create a URL for a Jitsi room
export function createRoomUrl(roomName: string): string {
  const sanitizedRoomName = encodeURIComponent(roomName.replace(/\s+/g, "-").toLowerCase());
  return `https://${JITSI_DOMAIN}/${sanitizedRoomName}`;
}

// Audio recording functions
export async function startRecording(recordingState: RecordingState): Promise<RecordingState> {
  console.log("Starting audio recording...");
  
  // If already recording, do nothing
  if (recordingState.isRecording) {
    console.log("Already recording, ignoring startRecording call");
    return recordingState;
  }
  
  try {
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Create MediaRecorder instance
    const mediaRecorder = new MediaRecorder(stream);
    const recordedChunks: Blob[] = [];
    
    // Set up event listeners
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    
    // Start recording
    mediaRecorder.start();
    console.log("MediaRecorder started:", mediaRecorder.state);
    
    // Return updated recording state
    return {
      isRecording: true,
      mediaRecorder,
      recordedChunks,
      audioStream: stream,
    };
  } catch (error) {
    console.error("Error starting recording:", error);
    throw error;
  }
}

export async function stopRecording(recordingState: RecordingState): Promise<{ state: RecordingState, audioBlob: Blob | null }> {
  console.log("Stopping audio recording...");
  
  // If not recording, do nothing
  if (!recordingState.isRecording || !recordingState.mediaRecorder) {
    console.log("Not recording, ignoring stopRecording call");
    return { 
      state: recordingState, 
      audioBlob: null 
    };
  }
  
  try {
    const { mediaRecorder, recordedChunks, audioStream } = recordingState;
    
    return new Promise<{ state: RecordingState, audioBlob: Blob | null }>((resolve) => {
      // Set up onstop handler to create audio blob
      mediaRecorder.onstop = () => {
        console.log("MediaRecorder stopped, processing chunks...");
        
        // Stop audio tracks
        if (audioStream) {
          audioStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
        
        // Create blob from recorded chunks
        let audioBlob = null;
        if (recordedChunks.length > 0) {
          audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
          console.log(`Audio blob created, size: ${audioBlob.size} bytes`);
        } else {
          console.warn("No audio data was recorded");
        }
        
        // Reset recording state
        const newState: RecordingState = {
          isRecording: false,
          mediaRecorder: null,
          recordedChunks: [],
          audioStream: null,
        };
        
        resolve({ state: newState, audioBlob });
      };
      
      // Stop recording if it's active
      if (mediaRecorder.state !== 'inactive') {
        console.log(`Stopping MediaRecorder (current state: ${mediaRecorder.state})`);
        mediaRecorder.stop();
      } else {
        console.warn("MediaRecorder already inactive");
        
        // Stop audio tracks anyway
        if (audioStream) {
          audioStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
        
        // Reset recording state
        const newState: RecordingState = {
          isRecording: false,
          mediaRecorder: null,
          recordedChunks: [],
          audioStream: null,
        };
        
        resolve({ 
          state: newState, 
          audioBlob: null 
        });
      }
    });
  } catch (error) {
    console.error("Error stopping recording:", error);
    
    // Stop audio tracks if available
    if (recordingState.audioStream) {
      recordingState.audioStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }
    
    // Reset recording state on error
    return { 
      state: {
        isRecording: false,
        mediaRecorder: null,
        recordedChunks: [],
        audioStream: null,
      }, 
      audioBlob: null 
    };
  }
}

// Function to broadcast audio to both the room and ensure it reaches admins
export async function broadcastAudioToAdmins(userId: number, roomId: number, audioBlob: Blob) {
  try {
    console.log("Broadcasting audio to admins...", { userId, roomId, blobSize: audioBlob.size });
    
    // Convert Blob to base64 string for easier transmission
    const reader = new FileReader();
    const audioBase64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64Audio = base64data.split(',')[1] || base64data; // Handle both formats
        resolve(base64Audio);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
    
    const base64Audio = await audioBase64Promise;
    
    // Import the WebSocket service
    const { webSocket } = await import('@/lib/websocket');
    
    // Wait for WebSocket connection if not already connected
    if (!webSocket.isConnected()) {
      await webSocket.connect();
    }
    
    // Send the audio broadcast with a flag to make sure it reaches admin
    webSocket.send({
      type: 'broadcast',
      userId,
      roomId,
      audio: base64Audio,
      targetAdmins: true, // This is the key flag to ensure admins receive it
    });
    
    console.log('Audio broadcasted to admins successfully');
    return true;
  } catch (error) {
    console.error('Error broadcasting audio to admins:', error);
    return false;
  }
}

// Save the recording to the server
export async function saveRecording(userId: number, roomId: number, audioBlob: Blob, duration: number) {
  try {
    console.log("Saving recording...", { userId, roomId, blobSize: audioBlob.size, duration });
    
    // First, ensure the audio is broadcasted to admins (add this new call)
    await broadcastAudioToAdmins(userId, roomId, audioBlob);
    
    // Generate a unique filename for the recording
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `recording_user${userId}_room${roomId}_${timestamp}`;
    
    // First create the recording record in the database
    console.log("Creating recording record in database");
    const recordingResponse = await fetch("/api/recordings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        roomId,
        fileName: filename,
        duration,
        createdAt: new Date().toISOString(),
      }),
    });
    
    if (!recordingResponse.ok) {
      throw new Error(`Failed to create recording record: ${recordingResponse.statusText}`);
    }
    
    const recordingData = await recordingResponse.json();
    console.log("Recording record created:", recordingData);
    
    // Convert Blob to base64 string for easier transmission
    const reader = new FileReader();
    const audioBase64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64Audio = base64data.split(',')[1];
        resolve(base64Audio);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
    
    // Wait for base64 conversion
    const audioBase64 = await audioBase64Promise;
    console.log(`Audio converted to base64, length: ${audioBase64.length}`);
    
    // Then upload the audio data
    console.log("Uploading audio data");
    const uploadResponse = await fetch("/api/recordings/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename,
        audio: audioBase64
      }),
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload audio: ${uploadResponse.statusText}`);
    }
    
    console.log("Recording saved successfully:", recordingData);
    return recordingData;
  } catch (error) {
    console.error("Error saving recording:", error);
    throw error;
  }
}

/**
 * Get Jitsi configuration options for a room
 * @param roomName Name of the room
 * @param displayName User's display name
 * @param email User's email
 * @param isAdmin Whether the user is an admin
 */
export function getJitsiOptions(
  roomName: string,
  displayName: string,
  email: string = "",
  isAdmin: boolean = false
) {
  const options = {
    roomName: roomName,
    width: "100%",
    height: "100%",
    configOverwrite: {
      // General configuration
      disableDeepLinking: true,
      disableInviteFunctions: true,
      enableClosePage: false,
      enableWelcomePage: false,
      prejoinPageEnabled: false,
      
      // Security settings
      enableInsecureRoomNameWarning: false,
      disableRemoteMute: !isAdmin, // Only admin can mute others
      
      // Media settings
      startAudioOnly: false, // Allow video for both admin and users
      startWithVideoMuted: !isAdmin, // Admin starts with video on, others off
      startWithAudioMuted: !isAdmin, // Admin starts unmuted, others muted
      
      // UI Settings
      subject: "Onra Voice Secure Conference",
      defaultLanguage: "en",
      hideConferenceSubject: false,
      hideConferenceTimer: false,
      
      // Disable distractions
      disablePolls: true,
      disableReactions: true,
      
      // Features for admin
      toolbarButtons: isAdmin ? [
        'microphone', 'camera', 'closedcaptions', 'desktop', 
        'fullscreen', 'fodeviceselection', 'hangup', 'profile', 
        'settings', 'videoquality', 'filmstrip', 'participants-pane'
      ] : [
        'microphone', 'camera', 'hangup',
        'settings', 'videoquality'
      ],
      
      // Camera settings
      resolution: 720,
      constraints: {
        video: {
          height: {
            ideal: 720,
            max: 720,
            min: 240
          }
        }
      }
    },
    
    interfaceConfigOverwrite: {
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      
      // Simplified toolbar for our app
      TOOLBAR_BUTTONS: isAdmin ? [
        "microphone", "camera", "desktop", "fullscreen",
        "hangup", "profile", "settings", "videoquality"
      ] : [
        "microphone", "camera", "hangup", "settings"
      ],
      
      SETTINGS_SECTIONS: ["devices", "language"],
      MOBILE_APP_PROMO: false,
      
      // Notifications
      HIDE_INVITE_MORE_HEADER: true,
      DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
      DISABLE_FOCUS_INDICATOR: true,
      
      // Branding
      DEFAULT_BACKGROUND: "#1A1F2C",
      DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
      DISABLE_VIDEO_BACKGROUND: true,
      ENABLE_FEEDBACK_ANIMATION: false,
    },
    
    userInfo: {
      displayName: displayName,
      email: email,
    },
  };

  // Add specific admin capabilities
  if (isAdmin) {
    options.configOverwrite = {
      ...options.configOverwrite,
      // Add moderation privileges
      disableRemoteMute: false,
      // Additional admin features are configured through interfaceConfigOverwrite
    };
    
    options.interfaceConfigOverwrite = {
      ...options.interfaceConfigOverwrite,
      // Admin-specific interface settings
      TOOLBAR_BUTTONS: [
        "microphone", "camera", "desktop", "fullscreen",
        "hangup", "profile", "settings", "videoquality", 
        "mute-everyone"
      ],
    };
  }

  return options;
}