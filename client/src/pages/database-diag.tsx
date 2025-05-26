import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Database, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import DatabaseStatusIndicator from '@/components/DatabaseStatusIndicator';

export default function DatabaseDiag() {
  const [users, setUsers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  useEffect(() => {
    fetchUsers();
    fetchRooms();
  }, []);
  
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    setErrorMessage(null);
    try {
      console.log('Fetching users from database...');
      const response = await fetch('/api/users');
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Users data:', data);
        setUsers(data);
      } else {
        const errText = await response.text();
        console.error('Error response:', errText);
        setErrorMessage(`Failed to load users: ${response.status} - ${errText}`);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setErrorMessage(`Error fetching users: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const response = await fetch('/api/rooms');
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      } else {
        const errText = await response.text();
        if (!errorMessage) { // Don't overwrite user error
          setErrorMessage(`Failed to load rooms: ${response.status} - ${errText}`);
        }
      }
    } catch (error) {
      if (!errorMessage) { // Don't overwrite user error
        setErrorMessage(`Error fetching rooms: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally {
      setIsLoadingRooms(false);
    }
  };
  
  return (
    <div className="container py-10 space-y-6">
      <h1 className="text-3xl font-bold">Database Diagnostics</h1>
      <p className="text-muted-foreground">
        This page shows the current state of the database and helps diagnose connection issues.
      </p>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Content
              </CardTitle>
              <CardDescription>Current records in the database tables</CardDescription>
            </CardHeader>
            <CardContent>
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                  {errorMessage}
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Users</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchUsers}
                      disabled={isLoadingUsers}
                    >
                      {isLoadingUsers ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Refresh
                    </Button>
                  </div>
                  
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Room</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 && !isLoadingUsers ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : isLoadingUsers ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>{user.id}</TableCell>
                              <TableCell>{user.username}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                  {user.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {user.roomId ? user.roomId : <span className="text-muted-foreground">None</span>}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Rooms</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchRooms}
                      disabled={isLoadingRooms}
                    >
                      {isLoadingRooms ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Refresh
                    </Button>
                  </div>
                  
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Options</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rooms.length === 0 && !isLoadingRooms ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                              No rooms found
                            </TableCell>
                          </TableRow>
                        ) : isLoadingRooms ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                            </TableCell>
                          </TableRow>
                        ) : (
                          rooms.map((room) => (
                            <TableRow key={room.id}>
                              <TableCell>{room.id}</TableCell>
                              <TableCell>{room.name}</TableCell>
                              <TableCell>{room.capacity}</TableCell>
                              <TableCell>
                                <Badge variant={room.active ? 'default' : 'secondary'} className={room.active ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                                  {room.active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell className="space-x-1">
                                {room.encrypted && (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                    Encrypted
                                  </Badge>
                                )}
                                {room.isolated && (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    Isolated
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <DatabaseStatusIndicator />
        </div>
      </div>
    </div>
  );
}