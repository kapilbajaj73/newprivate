import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, PhoneOff, Video, VideoOff, Mic, MicOff, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/authContext';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  roomId: number | null;
}

export default function VideoConferencePanel() {
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<string | null>(null);
  const [isConnectingCall, setIsConnectingCall] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  // Get all users for admin to select
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
    staleTime: 30000, // 30 seconds
  });
  
  // Set up WebRTC connections and media
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  // Initialize WebRTC
  useEffect(() => {
    // Clean up function
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);
  
  // Set up event listeners for WebSocket messages (call requests, ICE candidates, etc.)
  useEffect(() => {
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'call-request' && data.targetUserId === currentUser?.id) {
          setIncomingCall(data.fromUserId);
          toast({
            title: 'Incoming Video Call',
            description: `${data.fromUserName} is calling you`,
            duration: 10000,
          });
        }
        
        if (data.type === 'call-accepted' && data.targetUserId === currentUser?.id) {
          handleCallAccepted();
        }
        
        if (data.type === 'call-rejected' && data.targetUserId === currentUser?.id) {
          setCalling(false);
          toast({
            title: 'Call Rejected',
            description: 'The user rejected your call',
            variant: 'destructive',
          });
        }
        
        if (data.type === 'call-ended' && isCallInProgress) {
          endCall();
          toast({
            title: 'Call Ended',
            description: 'The other user ended the call',
          });
        }
        
        // Handle WebRTC signaling
        if (data.type === 'webrtc-offer' && data.targetUserId === currentUser?.id) {
          handleWebRTCOffer(data.offer);
        }
        
        if (data.type === 'webrtc-answer' && data.targetUserId === currentUser?.id) {
          handleWebRTCAnswer(data.answer);
        }
        
        if (data.type === 'webrtc-ice-candidate' && data.targetUserId === currentUser?.id) {
          handleWebRTCIceCandidate(data.candidate);
        }
        
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    // Connect to WebSocket
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const socket = new WebSocket(wsUrl);
      
      socket.addEventListener('message', handleWebSocketMessage);
      
      return () => {
        socket.removeEventListener('message', handleWebSocketMessage);
        socket.close();
      };
    }
  }, [currentUser?.id, isCallInProgress, toast]);
  
  // Initialize media and start call
  const startCall = async () => {
    if (!selectedUserId) {
      toast({
        title: 'No User Selected',
        description: 'Please select a user to call',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setCalling(true);
      
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled,
      });
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Send call request via WebSocket
      const callRequest = {
        type: 'call-request',
        fromUserId: currentUser?.id,
        fromUserName: currentUser?.fullName,
        targetUserId: selectedUserId,
      };
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        socket.send(JSON.stringify(callRequest));
      };
      
    } catch (error) {
      console.error('Error starting call:', error);
      setCalling(false);
      toast({
        title: 'Call Failed',
        description: 'Could not access camera or microphone',
        variant: 'destructive',
      });
    }
  };
  
  // Handle incoming call acceptance
  const acceptCall = async () => {
    if (!incomingCall) return;
    
    setIsConnectingCall(true);
    
    try {
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled,
      });
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Send call accepted message
      const acceptMessage = {
        type: 'call-accepted',
        fromUserId: currentUser?.id,
        targetUserId: incomingCall,
      };
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        socket.send(JSON.stringify(acceptMessage));
      };
      
      setIncomingCall(null);
      setIsCallInProgress(true);
      setIsConnectingCall(false);
      
    } catch (error) {
      console.error('Error accepting call:', error);
      setIsConnectingCall(false);
      toast({
        title: 'Call Failed',
        description: 'Could not access camera or microphone',
        variant: 'destructive',
      });
    }
  };
  
  // Reject incoming call
  const rejectCall = () => {
    if (!incomingCall) return;
    
    const rejectMessage = {
      type: 'call-rejected',
      fromUserId: currentUser?.id,
      targetUserId: incomingCall,
    };
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      socket.send(JSON.stringify(rejectMessage));
    };
    
    setIncomingCall(null);
  };
  
  // End the current call
  const endCall = () => {
    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Send call ended message
    const endCallMessage = {
      type: 'call-ended',
      fromUserId: currentUser?.id,
      targetUserId: selectedUserId,
    };
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      socket.send(JSON.stringify(endCallMessage));
    };
    
    // Reset state
    setCalling(false);
    setIsCallInProgress(false);
    setSelectedUserId(null);
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };
  
  // WebRTC handlers
  const handleCallAccepted = async () => {
    setCalling(false);
    setIsCallInProgress(true);
    
    // Create peer connection and offer
    createPeerConnection();
  };
  
  const createPeerConnection = async () => {
    try {
      // Create new RTCPeerConnection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      };
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;
      
      // Add local stream tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current!);
        });
      }
      
      // Handle ICE candidates
      peerConnection.onicecandidate = event => {
        if (event.candidate) {
          const message = {
            type: 'webrtc-ice-candidate',
            candidate: event.candidate,
            fromUserId: currentUser?.id,
            targetUserId: selectedUserId,
          };
          
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = `${protocol}//${window.location.host}/ws`;
          const socket = new WebSocket(wsUrl);
          
          socket.onopen = () => {
            socket.send(JSON.stringify(message));
          };
        }
      };
      
      // Handle remote stream
      peerConnection.ontrack = event => {
        if (remoteVideoRef.current && event.streams && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };
      
      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      const offerMessage = {
        type: 'webrtc-offer',
        offer: offer,
        fromUserId: currentUser?.id,
        targetUserId: selectedUserId,
      };
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        socket.send(JSON.stringify(offerMessage));
      };
      
    } catch (error) {
      console.error('Error creating peer connection:', error);
      toast({
        title: 'Connection Error',
        description: 'Could not establish video connection',
        variant: 'destructive',
      });
      endCall();
    }
  };
  
  const handleWebRTCOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      // Create peer connection if it doesn't exist
      if (!peerConnectionRef.current) {
        const configuration = {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        };
        
        const peerConnection = new RTCPeerConnection(configuration);
        peerConnectionRef.current = peerConnection;
        
        // Add local stream tracks to peer connection
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStreamRef.current!);
          });
        }
        
        // Handle ICE candidates
        peerConnection.onicecandidate = event => {
          if (event.candidate) {
            const message = {
              type: 'webrtc-ice-candidate',
              candidate: event.candidate,
              fromUserId: currentUser?.id,
              targetUserId: incomingCall,
            };
            
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            const socket = new WebSocket(wsUrl);
            
            socket.onopen = () => {
              socket.send(JSON.stringify(message));
            };
          }
        };
        
        // Handle remote stream
        peerConnection.ontrack = event => {
          if (remoteVideoRef.current && event.streams && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };
      }
      
      // Set remote description (offer)
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Create and send answer
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      const answerMessage = {
        type: 'webrtc-answer',
        answer: answer,
        fromUserId: currentUser?.id,
        targetUserId: incomingCall,
      };
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        socket.send(JSON.stringify(answerMessage));
      };
      
    } catch (error) {
      console.error('Error handling WebRTC offer:', error);
      toast({
        title: 'Connection Error',
        description: 'Could not establish video connection',
        variant: 'destructive',
      });
      endCall();
    }
  };
  
  const handleWebRTCAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Error handling WebRTC answer:', error);
      toast({
        title: 'Connection Error',
        description: 'Could not establish video connection',
        variant: 'destructive',
      });
      endCall();
    }
  };
  
  const handleWebRTCIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };
  
  const toggleVideo = async () => {
    setIsVideoEnabled(!isVideoEnabled);
    
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
    }
  };
  
  const toggleAudio = async () => {
    setIsAudioEnabled(!isAudioEnabled);
    
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isAudioEnabled;
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Video Conference</h2>
      
      <p className="text-sm text-muted-foreground mb-4">
        Start a video call with users who need additional support or guidance. Ensure you have camera and microphone permissions enabled.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-slate-900">
            <CardTitle className="flex items-center text-white">
              <Video className="h-5 w-5 mr-2" />
              Your Camera
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 aspect-video bg-slate-950 relative">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!isCallInProgress && !calling && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
                <Video className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm opacity-70">
                  {isVideoEnabled ? 'Camera ready' : 'Camera disabled'}
                </p>
              </div>
            )}
            
            {calling && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
                <Loader2 className="h-12 w-12 mb-2 animate-spin" />
                <p>Calling...</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardHeader className="bg-slate-900">
            <CardTitle className="flex items-center text-white">
              <UserPlus className="h-5 w-5 mr-2" />
              Remote User
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 aspect-video bg-slate-950 relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!isCallInProgress && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
                <UserPlus className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm opacity-70">No remote user connected</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Call Settings</h3>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="video-toggle" className="flex items-center">
                  <Video className="h-4 w-4 mr-2" />
                  Video
                </Label>
                <Switch
                  id="video-toggle"
                  checked={isVideoEnabled}
                  onCheckedChange={toggleVideo}
                  disabled={isCallInProgress}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="audio-toggle" className="flex items-center">
                  <Mic className="h-4 w-4 mr-2" />
                  Audio
                </Label>
                <Switch
                  id="audio-toggle"
                  checked={isAudioEnabled}
                  onCheckedChange={toggleAudio}
                  disabled={isCallInProgress}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              {!isCallInProgress && !calling && (
                <>
                  <h3 className="text-lg font-medium">Start Call</h3>
                  
                  <div>
                    <Label htmlFor="user-select">Select User</Label>
                    <Select 
                      onValueChange={setSelectedUserId} 
                      value={selectedUserId || undefined}
                      disabled={isCallInProgress || calling}
                    >
                      <SelectTrigger id="user-select">
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users?.filter(u => u.id !== currentUser?.id).map(user => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.fullName} ({user.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={startCall}
                    disabled={!selectedUserId || calling}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Start Call
                  </Button>
                </>
              )}
              
              {isCallInProgress && (
                <>
                  <h3 className="text-lg font-medium">Active Call</h3>
                  
                  <div className="flex justify-center space-x-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-12 w-12"
                      onClick={toggleVideo}
                    >
                      {isVideoEnabled ? (
                        <Video className="h-6 w-6" />
                      ) : (
                        <VideoOff className="h-6 w-6 text-destructive" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-12 w-12"
                      onClick={toggleAudio}
                    >
                      {isAudioEnabled ? (
                        <Mic className="h-6 w-6" />
                      ) : (
                        <MicOff className="h-6 w-6 text-destructive" />
                      )}
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="icon"
                      className="rounded-full h-12 w-12"
                      onClick={endCall}
                    >
                      <PhoneOff className="h-6 w-6" />
                    </Button>
                  </div>
                </>
              )}
              
              {calling && (
                <>
                  <h3 className="text-lg font-medium">Calling...</h3>
                  
                  <Button 
                    variant="destructive"
                    className="w-full"
                    onClick={endCall}
                  >
                    <PhoneOff className="h-4 w-4 mr-2" />
                    Cancel Call
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md animate-in fade-in">
            <CardHeader>
              <CardTitle className="text-center">Incoming Video Call</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center">
                {users?.find(u => u.id.toString() === incomingCall)?.fullName || 'Someone'} is calling you
              </p>
              
              <div className="flex justify-center space-x-3">
                <Button 
                  variant="destructive" 
                  className="w-1/2"
                  onClick={rejectCall}
                  disabled={isConnectingCall}
                >
                  <PhoneOff className="h-4 w-4 mr-2" />
                  Decline
                </Button>
                
                <Button 
                  className="w-1/2"
                  onClick={acceptCall}
                  disabled={isConnectingCall}
                >
                  {isConnectingCall ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Phone className="h-4 w-4 mr-2" />
                  )}
                  {isConnectingCall ? 'Connecting...' : 'Accept'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}