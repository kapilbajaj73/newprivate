import { webSocket } from './websocket';

// WebRTC connection management
interface PeerConnection {
  userId: number;  
  connection: RTCPeerConnection;
  audioStream?: MediaStream;
  audioTrack?: MediaStreamTrack;
}

class WebRTCService {
  private peerConnections: Map<number, PeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private roomId: number | null = null;
  private userId: number | null = null;
  private iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];
  private onParticipantJoined: ((userId: number) => void) | null = null;
  private onParticipantLeft: ((userId: number) => void) | null = null;
  private onAudioStreamAdded: ((userId: number, stream: MediaStream) => void) | null = null;

  constructor() {
    // Listen for WebSocket messages
    webSocket.onMessage((data) => {
      if (!data) return;

      switch (data.type) {
        case 'webrtc_offer':
          this.handleOffer(data.from, data.offer);
          break;
        case 'webrtc_answer':
          this.handleAnswer(data.from, data.answer);
          break;
        case 'webrtc_ice_candidate':
          this.handleIceCandidate(data.from, data.candidate);
          break;
        case 'webrtc_user_joined':
          this.handleUserJoined(data.userId);
          break;
        case 'webrtc_user_left':
          this.handleUserLeft(data.userId);
          break;
      }
    });
  }

  // Set event handlers
  public setEventHandlers({
    onParticipantJoined,
    onParticipantLeft,
    onAudioStreamAdded,
  }: {
    onParticipantJoined?: (userId: number) => void;
    onParticipantLeft?: (userId: number) => void;
    onAudioStreamAdded?: (userId: number, stream: MediaStream) => void;
  }) {
    this.onParticipantJoined = onParticipantJoined || null;
    this.onParticipantLeft = onParticipantLeft || null;
    this.onAudioStreamAdded = onAudioStreamAdded || null;
  }

  // Join an audio room
  public async joinRoom(roomId: number, userId: number): Promise<void> {
    if (!webSocket.isConnected()) {
      await webSocket.connect();
    }

    this.roomId = roomId;
    this.userId = userId;

    // Inform server about joining
    webSocket.send({
      type: 'webrtc_join_room',
      roomId,
      userId,
    });

    // Get existing participants
    const participants = await this.getParticipants(roomId);
    
    // Create connections to all existing participants
    for (const participantId of participants) {
      if (participantId !== userId) {
        await this.createPeerConnection(participantId);
      }
    }
  }

  // Leave the current room
  public leaveRoom(): void {
    if (!this.roomId || !this.userId) return;

    // Inform server about leaving
    webSocket.send({
      type: 'webrtc_leave_room',
      roomId: this.roomId,
      userId: this.userId,
    });

    // Close all peer connections
    this.peerConnections.forEach((peer, userId) => {
      peer.connection.close();
      this.peerConnections.delete(userId);
    });

    // Stop local stream if it exists
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.roomId = null;
  }

  // Start broadcasting audio
  public async startBroadcasting(): Promise<void> {
    try {
      // Request microphone access with good voice quality settings
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true, 
          autoGainControl: true,
          sampleRate: 48000,
        },
        video: false,
      });

      // Add the audio track to all peer connections
      this.peerConnections.forEach((peer, userId) => {
        const audioTrack = this.localStream!.getAudioTracks()[0];
        if (audioTrack) {
          peer.connection.addTrack(audioTrack, this.localStream!);
          
          // Store the track in the peer connection object
          peer.audioTrack = audioTrack;
          
          // Create and send offer to remote peer
          this.createAndSendOffer(userId);
        }
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  // Stop broadcasting audio
  public stopBroadcasting(): void {
    if (!this.localStream) return;

    // Stop all audio tracks
    this.localStream.getAudioTracks().forEach(track => {
      track.stop();
    });

    // Remove tracks from peer connections
    this.peerConnections.forEach((peer) => {
      if (peer.audioTrack) {
        const senders = peer.connection.getSenders();
        const sender = senders.find((s: RTCRtpSender) => s.track === peer.audioTrack);
        if (sender) {
          peer.connection.removeTrack(sender);
        }
        peer.audioTrack = undefined;
      }
    });

    this.localStream = null;
  }

  // Get participants in a room
  private async getParticipants(roomId: number): Promise<number[]> {
    return new Promise((resolve) => {
      webSocket.send({
        type: 'webrtc_get_participants',
        roomId,
      });

      // Set up a one-time listener for the response
      const handleResponse = (data: any) => {
        if (data.type === 'webrtc_participants' && data.roomId === roomId) {
          webSocket.removeMessageListener(handleResponse);
          resolve(data.participants);
        }
      };

      webSocket.addMessageListener(handleResponse);

      // Set a timeout in case the server doesn't respond
      setTimeout(() => {
        webSocket.removeMessageListener(handleResponse);
        resolve([]);
      }, 5000);
    });
  }

  // Create a peer connection to a user
  private async createPeerConnection(userId: number): Promise<void> {
    // Create RTCPeerConnection
    const peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
    });

    // Store the connection
    this.peerConnections.set(userId, {
      userId,
      connection: peerConnection,
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        webSocket.send({
          type: 'webrtc_ice_candidate',
          candidate: event.candidate,
          to: userId,
          from: this.userId,
        });
      }
    };

    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      const stream = event.streams[0];
      
      // Update the peer connection
      const peer = this.peerConnections.get(userId);
      if (peer) {
        peer.audioStream = stream;
      }

      // Notify listeners
      if (this.onAudioStreamAdded) {
        this.onAudioStreamAdded(userId, stream);
      }
    };

    // Add local audio track if available
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        peerConnection.addTrack(audioTrack, this.localStream);
        
        // Store the track
        const peer = this.peerConnections.get(userId);
        if (peer) {
          peer.audioTrack = audioTrack;
        }
        
        // Create and send offer
        await this.createAndSendOffer(userId);
      }
    }
  }

  // Create and send an offer to a peer
  private async createAndSendOffer(userId: number): Promise<void> {
    const peer = this.peerConnections.get(userId);
    if (!peer) return;

    try {
      // Create offer
      const offer = await peer.connection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });

      // Set local description
      await peer.connection.setLocalDescription(offer);

      // Send offer to remote peer
      webSocket.send({
        type: 'webrtc_offer',
        offer,
        to: userId,
        from: this.userId,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }

  // Handle incoming offer
  private async handleOffer(from: number, offer: RTCSessionDescriptionInit): Promise<void> {
    // Create peer connection if it doesn't exist
    if (!this.peerConnections.has(from)) {
      await this.createPeerConnection(from);
    }

    const peer = this.peerConnections.get(from);
    if (!peer) return;

    try {
      // Set remote description
      await peer.connection.setRemoteDescription(new RTCSessionDescription(offer));

      // Create answer
      const answer = await peer.connection.createAnswer();

      // Set local description
      await peer.connection.setLocalDescription(answer);

      // Send answer
      webSocket.send({
        type: 'webrtc_answer',
        answer,
        to: from,
        from: this.userId,
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  // Handle incoming answer
  private async handleAnswer(from: number, answer: RTCSessionDescriptionInit): Promise<void> {
    const peer = this.peerConnections.get(from);
    if (!peer) return;

    try {
      await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  // Handle incoming ICE candidate
  private async handleIceCandidate(from: number, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = this.peerConnections.get(from);
    if (!peer) return;

    try {
      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  // Handle user joined notification
  private async handleUserJoined(userId: number): Promise<void> {
    // Notify listeners
    if (this.onParticipantJoined) {
      this.onParticipantJoined(userId);
    }

    // Create peer connection
    await this.createPeerConnection(userId);
  }

  // Handle user left notification
  private handleUserLeft(userId: number): void {
    // Close peer connection
    const peer = this.peerConnections.get(userId);
    if (peer) {
      peer.connection.close();
      this.peerConnections.delete(userId);
    }

    // Notify listeners
    if (this.onParticipantLeft) {
      this.onParticipantLeft(userId);
    }
  }
}

// Export singleton instance
export const webRTCService = new WebRTCService();