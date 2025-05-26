import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Video, Phone, PhoneOff } from 'lucide-react';
import { useWebSocketContext } from '@/lib/wsContext';
import { useAuth } from '@/lib/authContext';

type VideoCallRequestButtonProps = {
  className?: string;
};

export default function VideoCallRequestButton({ className }: VideoCallRequestButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'pending' | 'accepted' | 'rejected'>('idle');
  const { sendMessage, lastMessage } = useWebSocketContext();
  const { user } = useAuth();
  const { toast } = useToast();

  // Handle incoming WebSocket messages for call responses
  useEffect(() => {
    if (!lastMessage) return;
    
    try {
      const message = typeof lastMessage === 'string' ? JSON.parse(lastMessage) : lastMessage;
      
      console.log('Processing WebSocket message:', message);
      
      // Only process messages that have a type and targetUserId
      if (!message || !message.type || !message.targetUserId) return;
      
      // Only process if we have a user
      if (!user) return;
      
      // Compare IDs as strings to handle possible type differences
      const targetIdStr = message.targetUserId.toString();
      const userIdStr = user.id.toString();
      
      console.log(`Comparing message targetUserId: ${targetIdStr} to user.id: ${userIdStr}, equal: ${targetIdStr === userIdStr}`);
      
      // Only process messages targeting this user
      if (targetIdStr !== userIdStr) return;
      
      // Handle call accepted
      if (message.type === 'call-accepted') {
        console.log('Call accepted by admin');
        setRequestStatus('accepted');
        
        toast({
          title: 'Call Accepted',
          description: 'The admin has accepted your call request',
        });
        
        // Navigate to the conference room with video parameter
        if (user.roomId) {
          // Close the dialog first
          setIsDialogOpen(false);
          
          // Wait a moment to allow the dialog to close
          setTimeout(() => {
            window.location.href = `/conference/${user.roomId}?video=true`;
          }, 1000);
        }
      }
      
      // Handle call rejected
      else if (message.type === 'call-rejected') {
        console.log('Call rejected by admin');
        setRequestStatus('rejected');
        
        toast({
          title: 'Call Rejected',
          description: 'The admin is not available at the moment',
          variant: 'destructive',
        });
        
        // Auto close after 5 seconds
        setTimeout(() => {
          setRequestStatus('idle');
          setIsRequesting(false);
        }, 5000);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }, [lastMessage, user, toast]);

  const handleRequestCall = () => {
    setIsRequesting(true);
    setRequestStatus('pending');
    
    // Only send if we have a connected user
    if (user) {
      // Send call request to admin users (targetUserId 'admin' means all admins)
      sendMessage({
        type: 'call-request',
        fromUserId: user.id,
        fromUserName: user.fullName || user.username,
        targetUserId: 'admin' // Special identifier for admin users
      });
      
      toast({
        title: 'Video call request sent',
        description: 'Waiting for an admin to accept your call',
      });
      
      // Set a timeout to auto-cancel if no response
      setTimeout(() => {
        if (requestStatus === 'pending') {
          setRequestStatus('idle');
          setIsRequesting(false);
          toast({
            title: 'Call request timed out',
            description: 'No admin accepted your call. Please try again later.',
            variant: 'destructive',
          });
        }
      }, 30000); // 30 seconds timeout
    }
  };

  const handleCancelRequest = () => {
    if (user) {
      sendMessage({
        type: 'call-ended',
        fromUserId: user.id,
        targetUserId: 'admin' // Special identifier for admin users
      });
    }
    
    setIsRequesting(false);
    setRequestStatus('idle');
  };

  return (
    <>
      <Button 
        variant="outline"
        className={`flex items-center gap-2 ${className}`}
        onClick={() => setIsDialogOpen(true)}
        title="Request Video Call with Admin"
      >
        <Video className="h-5 w-5" />
        {className?.includes('p-2') ? null : (
          <span>Request Video Call with Admin</span>
        )}
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl">Video Call Request</DialogTitle>
            <DialogDescription className="text-gray-400">
              Request a video call with an administrator. They will need to approve your request.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {requestStatus === 'idle' ? (
              <div className="text-center py-6">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-blue-600/20">
                    <Video className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                <p className="mb-2">Ready to start a video call with an administrator?</p>
                <p className="text-sm text-gray-400">
                  This will send a request to all available administrators.
                </p>
              </div>
            ) : requestStatus === 'pending' ? (
              <div className="text-center py-6">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-amber-600/20 animate-pulse">
                    <Phone className="h-8 w-8 text-amber-500" />
                  </div>
                </div>
                <p className="mb-2">Waiting for administrator to accept...</p>
                <p className="text-sm text-gray-400">
                  Your request has been sent. Please wait while an administrator reviews it.
                </p>
              </div>
            ) : requestStatus === 'accepted' ? (
              <div className="text-center py-6">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-green-600/20">
                    <Phone className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <p className="mb-2">Call request accepted!</p>
                <p className="text-sm text-gray-400">
                  You will be redirected to the video call interface.
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-red-600/20">
                    <PhoneOff className="h-8 w-8 text-red-500" />
                  </div>
                </div>
                <p className="mb-2">Call request rejected</p>
                <p className="text-sm text-gray-400">
                  The administrator is not available at the moment. Please try again later.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            {requestStatus === 'idle' ? (
              <>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleRequestCall}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Request Call
                </Button>
              </>
            ) : requestStatus === 'pending' ? (
              <Button 
                variant="destructive"
                onClick={handleCancelRequest}
              >
                Cancel Request
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => {
                  setRequestStatus('idle');
                  setIsDialogOpen(false);
                }}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}