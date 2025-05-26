import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useClipboard } from "@/hooks/use-clipboard";
import { createRoomUrl } from "@/lib/jitsiUtils";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface Room {
  id: number;
  name: string;
  capacity: number;
  active: boolean;
  encrypted: boolean;
  isolated: boolean;
}

interface User {
  id: number;
  username: string;
  email?: string;
  roomId: number | null;
  role?: string;
}

interface RoomsListProps {
  onCreateRoom: () => void;
}

export default function RoomsList({ onCreateRoom }: RoomsListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { copy } = useClipboard();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showManageUsersDialog, setShowManageUsersDialog] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  // Get rooms
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  // Get users to calculate room occupancy
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Delete room mutation
  const deleteRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      return apiRequest("DELETE", `/api/rooms/${roomId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Room has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      setShowDeleteDialog(false);
      setSelectedRoom(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete room: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Toggle room active status mutation
  const toggleRoomActiveMutation = useMutation({
    mutationFn: async ({ roomId, active }: { roomId: number; active: boolean }) => {
      return apiRequest("PUT", `/api/rooms/${roomId}`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update room status: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Assign users to room mutation
  const assignUsersToRoomMutation = useMutation({
    mutationFn: async ({ roomId, userIds }: { roomId: number; userIds: number[] }) => {
      return apiRequest("POST", `/api/rooms/${roomId}/assign-users`, { userIds });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Users have been assigned to room successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowManageUsersDialog(false);
      setSelectedRoom(null);
      setSelectedUsers([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to assign users: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (room: Room) => {
    setSelectedRoom(room);
    setShowDeleteDialog(true);
  };
  
  const handleManageUsersClick = (room: Room) => {
    setSelectedRoom(room);
    setSelectedUsers(users.filter(user => user.roomId === room.id).map(user => user.id));
    setShowManageUsersDialog(true);
  };

  const confirmDelete = () => {
    if (selectedRoom) {
      deleteRoomMutation.mutate(selectedRoom.id);
    }
  };

  const toggleRoomActive = (room: Room) => {
    toggleRoomActiveMutation.mutate({
      roomId: room.id,
      active: !room.active,
    });
  };

  const handleCopyRoomId = (roomName: string) => {
    const roomUrl = createRoomUrl(roomName);
    copy(roomUrl);
    toast({
      title: "Copied!",
      description: "Room link copied to clipboard",
    });
  };

  const joinRoom = (roomName: string) => {
    // Navigate to the internal room page instead of opening external URL
    window.location.href = `/conference/${selectedRoom?.id || 1}`;
  };

  // Get user count in each room
  const getUserCountInRoom = (roomId: number) => {
    return users.filter(user => user.roomId === roomId).length;
  };

  if (isLoadingRooms) {
    return <div className="py-4 text-center">Loading rooms...</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const userCount = getUserCountInRoom(room.id);
          const occupancyPercentage = (userCount / room.capacity) * 100;
          
          return (
            <Card key={room.id} className="bg-[#2A3042] border-none shadow-md overflow-hidden">
              <CardHeader className="border-b border-gray-700 pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-medium">{room.name}</CardTitle>
                  <div className="flex items-center">
                    <span 
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                        room.active 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {room.active ? "Active" : "Inactive"}
                    </span>
                    <div className="relative">
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="1"></circle>
                          <circle cx="19" cy="12" r="1"></circle>
                          <circle cx="5" cy="12" r="1"></circle>
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="mb-4">
                  <div className="text-sm text-gray-300 mb-1">Capacity</div>
                  <Progress value={occupancyPercentage} className="h-2 bg-[#374151]" />
                  <div className="mt-1 text-xs text-gray-300">
                    {userCount} of {room.capacity} participants
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-300">Room ID</span>
                    <Button 
                      variant="ghost" 
                      className="text-[#0EA5E9] text-xs flex items-center h-auto py-0 px-1"
                      onClick={() => handleCopyRoomId(room.name)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                      </svg>
                      Copy
                    </Button>
                  </div>
                  <div className="bg-[#374151] rounded p-2 text-xs text-gray-300 font-mono truncate">
                    {room.name.toLowerCase().replace(/\s+/g, '-')}-onra-voice-{Math.floor(Math.random() * 90000) + 10000}
                  </div>
                </div>
                <div className="mb-4">
                  <Button 
                    className="w-full flex justify-center items-center space-x-1 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white mb-2"
                    onClick={() => handleManageUsersClick(room)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span>Manage Users</span>
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    className="flex-1 flex justify-center items-center space-x-1 bg-[#0EA5E9] hover:bg-[#0284C7] text-white"
                    onClick={() => joinRoom(room.name)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4m-5-4l5-5-5-5m5 5H3"></path>
                    </svg>
                    <span>Join Room</span>
                  </Button>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      className="px-3 py-2 border-gray-600 hover:bg-[#374151]"
                      onClick={() => toggleRoomActive(room)}
                    >
                      {room.active ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18.36 6.64a9 9 0 11-12.73 0"></path>
                          <line x1="12" y1="2" x2="12" y2="12"></line>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18.36 6.64a9 9 0 11-12.73 0"></path>
                          <line x1="12" y1="2" x2="12" y2="12"></line>
                        </svg>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="px-3 py-2 border-gray-600 hover:bg-[#374151] text-red-500 hover:text-red-400"
                      onClick={() => handleDeleteClick(room)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                      </svg>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Create Room Card */}
        <Card 
          className="bg-[#2A3042] border-2 border-dashed border-gray-600 flex items-center justify-center p-4 min-h-[280px] cursor-pointer hover:border-gray-500 transition-colors"
          onClick={onCreateRoom}
        >
          <div className="flex flex-col items-center justify-center text-gray-400 hover:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            <span className="font-medium">Create New Room</span>
          </div>
        </Card>
      </div>

      {/* Delete Room Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#2A3042] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete the room "{selectedRoom?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteRoomMutation.isPending}
            >
              {deleteRoomMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Users Dialog */}
      <Dialog open={showManageUsersDialog} onOpenChange={setShowManageUsersDialog}>
        <DialogContent className="bg-[#2A3042] text-white border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Users in {selectedRoom?.name}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select users to assign to this room. Unselected users will be removed from the room.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ScrollArea className="h-72 rounded border border-gray-700 p-4">
              {users.length === 0 ? (
                <div className="text-center text-gray-400 py-4">No users found</div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`user-${user.id}`} 
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                      />
                      <Label
                        htmlFor={`user-${user.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {user.username} {user.role === 'admin' && <span className="ml-1 text-xs bg-purple-600 text-white px-1 py-0.5 rounded">Admin</span>}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowManageUsersDialog(false)}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedRoom) {
                  assignUsersToRoomMutation.mutate({
                    roomId: selectedRoom.id,
                    userIds: selectedUsers
                  });
                }
              }}
              disabled={assignUsersToRoomMutation.isPending}
              className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
            >
              {assignUsersToRoomMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
