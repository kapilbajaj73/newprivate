import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  roomId: number | null;
}

interface Room {
  id: number;
  name: string;
}

export default function UsersList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAssignRoomDialog, setShowAssignRoomDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>("");

  // Get users
  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/users"],
    onSuccess: (data) => {
      console.log("Successfully loaded users in admin UI:", data);
    },
    onError: (err) => {
      console.error("Error loading users in admin UI:", err);
      toast({
        title: "Error Loading Users",
        description: `${err}`,
        variant: "destructive",
      });
    }
  });

  // Get rooms for assignment
  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowDeleteDialog(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Assign room mutation
  const assignRoomMutation = useMutation({
    mutationFn: async ({ userId, roomId }: { userId: number; roomId: number | null }) => {
      return apiRequest("PUT", `/api/users/${userId}`, { roomId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User has been assigned to room successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowAssignRoomDialog(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to assign room: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleAssignRoomClick = (user: User) => {
    setSelectedUser(user);
    setSelectedRoom(user.roomId ? String(user.roomId) : "");
    setShowAssignRoomDialog(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const confirmAssignRoom = () => {
    if (selectedUser) {
      assignRoomMutation.mutate({
        userId: selectedUser.id,
        roomId: selectedRoom ? parseInt(selectedRoom) : null,
      });
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Find room name by ID
  const getRoomName = (roomId: number | null) => {
    if (!roomId) return "Not assigned";
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.name : "Unknown";
  };

  return (
    <Card className="bg-[#2A3042] border-none shadow-md">
      <CardHeader className="border-b border-gray-700 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">User Management</CardTitle>
          <div className="relative">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 bg-[#374151] border-gray-600 text-white text-sm pl-8"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#1A1F2C]">
              <TableRow>
                <TableHead className="text-gray-300">Name</TableHead>
                <TableHead className="text-gray-300">Username</TableHead>
                <TableHead className="text-gray-300">Assigned Room</TableHead>
                <TableHead className="text-gray-300">Role</TableHead>
                <TableHead className="text-right text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-[#8B5CF6] flex items-center justify-center mr-3">
                          <span className="font-medium text-sm text-white">
                            {user.fullName.split(" ").map(name => name[0]).join("")}
                          </span>
                        </div>
                        <div className="text-sm font-medium">{user.fullName}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.username}</TableCell>
                    <TableCell className="text-sm">{getRoomName(user.roomId)}</TableCell>
                    <TableCell className="text-sm capitalize">{user.role}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAssignRoomClick(user)}
                        className="text-[#0EA5E9] hover:text-[#0284C7] hover:bg-[#374151]"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"></path>
                        </svg>
                        <span className="sr-only">Assign Room</span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(user)}
                        className="text-red-500 hover:text-red-700 hover:bg-[#374151]"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="px-6 py-3 flex justify-between items-center border-t border-gray-700">
          <div className="text-sm text-gray-300">
            Showing <span>{filteredUsers.length}</span> of <span>{users.length}</span> users
          </div>
        </div>
      </CardContent>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#2A3042] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete the user "{selectedUser?.fullName}"? This action cannot be undone.
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
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Room Dialog */}
      <Dialog open={showAssignRoomDialog} onOpenChange={setShowAssignRoomDialog}>
        <DialogContent className="bg-[#2A3042] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Assign Room</DialogTitle>
            <DialogDescription className="text-gray-400">
              Assign {selectedUser?.fullName} to a classroom
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Room
            </label>
            <Select
              value={selectedRoom}
              onValueChange={setSelectedRoom}
            >
              <SelectTrigger className="bg-[#374151] border-gray-600">
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent className="bg-[#374151] border-gray-600">
                <SelectItem value="">No Room</SelectItem>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={String(room.id)}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAssignRoomDialog(false)}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              className="bg-[#0EA5E9] hover:bg-[#0284C7]"
              onClick={confirmAssignRoom}
              disabled={assignRoomMutation.isPending}
            >
              {assignRoomMutation.isPending ? "Assigning..." : "Assign Room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
