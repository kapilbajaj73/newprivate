import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/authContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersList from "./UsersList";
import RoomsList from "./RoomsList";
import AdminSettings from "./AdminSettings";
import AddUserModal from "./AddUserModal";
import CreateRoomModal from "./CreateRoomModal";
import PushToTalkButton from "./PushToTalkButton";
import AllRecordingsPanel from "./AllRecordingsPanel";
import VideoConferencePanel from "./VideoConferencePanel";
import CallRequestsPanel from "./CallRequestsPanel";
import OnlineUsersPanel from "./OnlineUsersPanel";
import AudioReceiver from "@/components/AudioReceiver";
import AdminAudioReceiver from "./AdminAudioReceiver";
import { useWebSocketContext } from '@/lib/wsContext';
import MobileNotification from "./MobileNotification";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [_, navigate] = useLocation();
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const { lastMessage } = useWebSocketContext();
  const [currentCallRequest, setCurrentCallRequest] = useState<{
    id: string;
    fromUserId: number;
    fromUserName: string;
  } | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };
  
  // Listen for call requests via websocket
  useEffect(() => {
    if (!lastMessage) return;
    
    try {
      const message = typeof lastMessage === 'string' ? JSON.parse(lastMessage) : lastMessage;
      
      // Handle call request
      if (message.type === 'call-request' && message.fromUserId) {
        console.log('Admin received call request:', message);
        setCurrentCallRequest({
          id: message.fromUserId + '-' + Date.now(),
          fromUserId: message.fromUserId,
          fromUserName: message.fromUserName || 'User'
        });
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }, [lastMessage]);

  // Handle accepting/rejecting call requests
  const handleCallAction = (action: 'accept' | 'reject') => {
    if (!currentCallRequest) return;
    
    if (!user) return;
    
    // Get the sendMessage function from context
    const { sendMessage } = useWebSocketContext();
    
    // Send message to accept or reject call
    sendMessage({
      type: action === 'accept' ? 'call-accepted' : 'call-rejected',
      fromUserId: user.id,
      targetUserId: currentCallRequest.fromUserId.toString()
    });
    
    if (action === 'accept') {
      // Get the room ID from the database for navigation
      const targetUser = currentCallRequest.fromUserId;
      fetch(`/api/users/${targetUser}`)
        .then(res => res.json())
        .then(userData => {
          if (userData && userData.roomId) {
            // Wait a moment to ensure WebSocket message is sent
            setTimeout(() => {
              window.location.href = `/conference/${userData.roomId}?video=true`;
            }, 1000);
          }
        })
        .catch(err => {
          console.error("Error navigating to conference room:", err);
        });
    }
    
    setCurrentCallRequest(null);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {currentCallRequest && (
        <MobileNotification
          title={`Call Request from ${currentCallRequest.fromUserName}`}
          message="Incoming video call request"
          icon="video"
          onAccept={() => handleCallAction('accept')}
          onReject={() => handleCallAction('reject')}
        />
      )}
      <header className="bg-[#2A3042] px-4 py-3 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-[#0EA5E9]">Onra Voice Admin</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-300">{user.fullName}</span>
            <button 
              className="text-gray-300 hover:text-white"
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

      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg sm:text-xl font-bold mb-3 md:mb-0">Admin Dashboard</h2>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button 
                className="flex-1 sm:flex-none flex items-center justify-center sm:justify-start space-x-1 bg-[#0EA5E9] hover:bg-[#0284C7] rounded-lg px-3 sm:px-4 py-2 text-white transition-colors text-sm sm:text-base"
                onClick={() => setShowAddUserModal(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Add User</span>
              </button>
              <button 
                className="flex-1 sm:flex-none flex items-center justify-center sm:justify-start space-x-1 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg px-3 sm:px-4 py-2 text-white transition-colors text-sm sm:text-base"
                onClick={() => setShowCreateRoomModal(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3h18v18H3zM9 3v18M14 3v18"></path>
                </svg>
                <span>Create Room</span>
              </button>
            </div>
          </div>

          <Tabs defaultValue="users" onValueChange={setActiveTab}>
            <TabsList className="border-b border-gray-700 w-full justify-start mb-4 md:mb-6 overflow-x-auto flex-nowrap whitespace-nowrap pb-1 gap-0">
              <TabsTrigger value="users" className="py-2 px-3 sm:px-4 border-b-2 border-transparent data-[state=active]:border-[#0EA5E9] data-[state=active]:text-[#0EA5E9] text-sm">
                Users
              </TabsTrigger>
              <TabsTrigger value="rooms" className="py-2 px-3 sm:px-4 border-b-2 border-transparent data-[state=active]:border-[#0EA5E9] data-[state=active]:text-[#0EA5E9] text-sm">
                Rooms
              </TabsTrigger>
              <TabsTrigger value="monitor" className="py-2 px-3 sm:px-4 border-b-2 border-transparent data-[state=active]:border-[#0EA5E9] data-[state=active]:text-[#0EA5E9] text-sm">
                Monitor
              </TabsTrigger>
              <TabsTrigger value="recordings" className="py-2 px-3 sm:px-4 border-b-2 border-transparent data-[state=active]:border-[#0EA5E9] data-[state=active]:text-[#0EA5E9] text-sm">
                Recordings
              </TabsTrigger>
              <TabsTrigger value="videoconf" className="py-2 px-3 sm:px-4 border-b-2 border-transparent data-[state=active]:border-[#0EA5E9] data-[state=active]:text-[#0EA5E9] text-sm">
                Video
              </TabsTrigger>
              <TabsTrigger value="settings" className="py-2 px-3 sm:px-4 border-b-2 border-transparent data-[state=active]:border-[#0EA5E9] data-[state=active]:text-[#0EA5E9] text-sm">
                Settings
              </TabsTrigger>
              <a href="/database-diag" target="_blank" className="py-2 px-3 sm:px-4 text-amber-400 hover:text-amber-300 border-b-2 border-transparent text-sm flex items-center">
                Database <span className="hidden sm:inline ml-1">Diagnostics</span> <span className="ml-1">↗</span>
              </a>
            </TabsList>

            <TabsContent value="users">
              <UsersList />
            </TabsContent>

            <TabsContent value="rooms">
              <RoomsList onCreateRoom={() => setShowCreateRoomModal(true)} />
            </TabsContent>
            
            <TabsContent value="monitor">
              <OnlineUsersPanel />
            </TabsContent>

            <TabsContent value="recordings">
              <AllRecordingsPanel />
            </TabsContent>
            
            <TabsContent value="videoconf">
              <div className="space-y-6">
                <CallRequestsPanel />
                <VideoConferencePanel />
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <AdminSettings />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Global Push-to-Talk Button (fixed at bottom) - only show if not on settings tab */}
      {activeTab !== "settings" && (
        <div id="global-push-to-talk" className="fixed bottom-4 left-4 right-4 md:left-auto md:right-auto md:bottom-6 md:w-96 md:mx-auto z-50">
          <PushToTalkButton userId={user.id} />
        </div>
      )}

      {showAddUserModal && <AddUserModal onClose={() => setShowAddUserModal(false)} />}
      {showCreateRoomModal && <CreateRoomModal onClose={() => setShowCreateRoomModal(false)} />}
      
      {/* Audio receiver for push-to-talk messages */}
      {user && <AudioReceiver userId={user.id} />}
      
      {/* Special admin audio receiver to hear all users from any room */}
      {user && user.role === "admin" && <AdminAudioReceiver userId={user.id} />}
    </div>
  );
}
