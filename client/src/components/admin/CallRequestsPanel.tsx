import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useWebSocketContext } from '@/lib/wsContext';
import { useAuth } from '@/lib/authContext';
import { Video, Phone, PhoneOff, User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import MobileNotification from './MobileNotification';

type CallRequest = {
  id: string;
  fromUserId: number;
  fromUserName: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'rejected';
};

export default function CallRequestsPanel() {
  const [callRequests, setCallRequests] = useState<CallRequest[]>([]);
  const [currentNotification, setCurrentNotification] = useState<CallRequest | null>(null);
  const { sendMessage, lastMessage } = useWebSocketContext();
  const { user } = useAuth();
  const { toast } = useToast();

  // Handle incoming WebSocket messages for call requests
  useEffect(() => {
    if (!lastMessage || !user || user.role !== 'admin') return;
    
    try {
      const message = typeof lastMessage === 'string' ? JSON.parse(lastMessage) : lastMessage;
      
      if (message.type === 'call-request') {
        // Add the call request to our list
        const newRequest: CallRequest = {
          id: `${message.fromUserId}-${Date.now()}`,
          fromUserId: message.fromUserId,
          fromUserName: message.fromUserName,
          timestamp: Date.now(),
          status: 'pending'
        };
        
        setCallRequests(prev => {
          // Check if we already have this request
          const existingIndex = prev.findIndex(r => r.fromUserId === message.fromUserId);
          if (existingIndex >= 0) {
            // Update existing request
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], timestamp: Date.now(), status: 'pending' };
            return updated;
          } else {
            // Add new request
            return [...prev, newRequest];
          }
        });
        
        // Show mobile-style notification
        setCurrentNotification(newRequest);
      }
      
      if (message.type === 'call-ended' && message.fromUserId) {
        // Remove the call request from our list
        setCallRequests(prev => prev.filter(r => r.fromUserId !== message.fromUserId));
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }, [lastMessage, user, toast]);

  // Clean up old requests after 30 seconds
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setCallRequests(prev => prev.filter(r => {
        // Keep if less than 30 seconds old or not pending
        return (now - r.timestamp < 30000) || r.status !== 'pending';
      }));
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(cleanup);
  }, []);

  const handleAcceptCall = (request: CallRequest) => {
    if (!user) return;
    
    // Log for debugging
    console.log(`Accepting call from user ${request.fromUserId}, admin ID: ${user.id}`);
    
    // Update request status
    setCallRequests(prev => prev.map(r => 
      r.id === request.id ? { ...r, status: 'accepted' } : r
    ));
    
    // Show confirmation
    toast({
      title: 'Call Accepted',
      description: `You accepted the call from ${request.fromUserName}`
    });
    
    // Clear notification
    if (currentNotification?.id === request.id) {
      setCurrentNotification(null);
    }
    
    // Get the room ID from the database
    const targetUser = request.fromUserId;
    
    // Wrap in try-catch for better error handling
    try {
      // Send WebSocket message to accept call
      sendMessage({
        type: 'call-accepted',
        fromUserId: user.id,
        targetUserId: request.fromUserId.toString()
      });
      
      console.log(`WebSocket message sent for call acceptance to user ${request.fromUserId}`);
    } catch (wsError) {
      console.error("Error sending WebSocket message:", wsError);
      // Continue anyway to try the navigation
    }
    
    // Get room information for navigation
    fetch(`/api/users/${targetUser}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then(userData => {
        console.log("User data for video call:", userData);
        
        if (userData && userData.roomId) {
          // Wait a moment to ensure WebSocket message is sent
          console.log(`Navigating to video conference in room ${userData.roomId}`);
          
          setTimeout(() => {
            const videoUrl = `/conference/${userData.roomId}?video=true`;
            console.log(`Redirecting to: ${videoUrl}`);
            window.location.href = videoUrl;
          }, 1000);
        } else {
          console.error("No roomId found for user:", userData);
          toast({
            title: "Navigation Error",
            description: "Could not find room information for the call",
            variant: "destructive"
          });
        }
      })
      .catch(err => {
        console.error("Error navigating to conference room:", err);
        toast({
          title: "Navigation Error",
          description: "Could not navigate to the video call room",
          variant: "destructive"
        });
      });
  };

  const handleRejectCall = (request: CallRequest) => {
    if (!user) return;
    
    // Log for debugging
    console.log(`Rejecting call from user ${request.fromUserId}, admin ID: ${user.id}`);
    
    // Update request status
    setCallRequests(prev => prev.map(r => 
      r.id === request.id ? { ...r, status: 'rejected' } : r
    ));
    
    // Clear notification
    if (currentNotification?.id === request.id) {
      setCurrentNotification(null);
    }
    
    // Wrap in try-catch for better error handling
    try {
      // Send message to reject call
      sendMessage({
        type: 'call-rejected',
        fromUserId: user.id,
        targetUserId: request.fromUserId.toString()
      });
      
      console.log(`WebSocket message sent for call rejection to user ${request.fromUserId}`);
      
      // Show feedback toast
      toast({
        title: 'Call Rejected',
        description: `You rejected the call from ${request.fromUserName}`
      });
    } catch (wsError) {
      console.error("Error sending WebSocket message for rejection:", wsError);
    }
    
    // Remove after 5 seconds
    setTimeout(() => {
      setCallRequests(prev => prev.filter(r => r.id !== request.id));
    }, 5000);
  };

  // If no call requests, show empty state
  if (callRequests.length === 0) {
    return (
      <Card className="border-gray-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-400" />
            <span>Video Call Requests</span>
          </CardTitle>
          <CardDescription>
            Incoming video call requests from users will appear here
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <div className="text-center text-gray-400">
            <div className="p-3 rounded-full bg-gray-700/30 mx-auto mb-3 w-14 h-14 flex items-center justify-center">
              <Phone className="h-7 w-7" />
            </div>
            <p>No pending call requests</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Mobile notification for incoming call requests */}
      {currentNotification && currentNotification.status === 'pending' && (
        <MobileNotification
          title="Incoming Video Call Request"
          message={`${currentNotification.fromUserName} is requesting a video call`}
          type="call"
          duration={15000}
          onAccept={() => handleAcceptCall(currentNotification)}
          onReject={() => handleRejectCall(currentNotification)}
          onDismiss={() => setCurrentNotification(null)}
        />
      )}
      
      <Card className="border-gray-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-400" />
            <span>Video Call Requests</span>
            <span className="ml-auto text-sm bg-blue-600 px-2 py-0.5 rounded-full text-white">
              {callRequests.filter(r => r.status === 'pending').length}
            </span>
          </CardTitle>
          <CardDescription>
            Approve or reject video call requests from users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {callRequests.map(request => (
            <div 
              key={request.id}
              className={`rounded-lg p-3 ${
                request.status === 'pending' 
                  ? 'bg-blue-900/20 border border-blue-700/30' 
                  : request.status === 'accepted'
                    ? 'bg-green-900/20 border border-green-700/30'
                    : 'bg-red-900/20 border border-red-700/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  request.status === 'pending' 
                    ? 'bg-blue-600/20' 
                    : request.status === 'accepted'
                      ? 'bg-green-600/20'
                      : 'bg-red-600/20'
                }`}>
                  {request.status === 'pending' ? (
                    <Phone className="h-5 w-5 text-blue-400" />
                  ) : request.status === 'accepted' ? (
                    <Phone className="h-5 w-5 text-green-400" />
                  ) : (
                    <PhoneOff className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    <span className="font-medium">{request.fromUserName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(request.timestamp, { addSuffix: true })}</span>
                  </div>
                </div>
                
                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      onClick={() => handleRejectCall(request)}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleAcceptCall(request)}
                    >
                      Accept
                    </Button>
                  </div>
                )}
                
                {request.status === 'accepted' && (
                  <div className="text-sm text-green-400">Accepted</div>
                )}
                
                {request.status === 'rejected' && (
                  <div className="text-sm text-red-400">Rejected</div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}