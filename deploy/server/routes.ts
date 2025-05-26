import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertRoomSchema, insertRecordingSchema } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import { z } from "zod";

// Extend the session type to include userId
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

// Create memory store for sessions
const MemoryStoreClass = MemoryStore(session);
const sessionStore = new MemoryStoreClass({
  checkPeriod: 86400000 // prune expired entries every 24h
});

// Function to validate request with zod schema
const validateRequest = <T extends z.ZodTypeAny>(
  schema: T,
  req: Request,
  res: Response
): z.infer<T> | null => {
  try {
    return schema.parse(req.body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    } else {
      res.status(500).json({ message: "Unknown error during validation" });
    }
    return null;
  }
};

// Authentication middleware
const isAuthenticated = (req: Request, res: Response, next: () => void) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

const isAdmin = async (req: Request, res: Response, next: () => void) => {
  if (req.session && req.session.userId) {
    const user = await storage.getUser(req.session.userId);
    if (user && user.role === "admin") {
      next();
    } else {
      res.status(403).json({ message: "Forbidden: Admin access required" });
    }
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(
    session({
      cookie: { maxAge: 86400000 }, // 24 hours
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "this-is-not-a-secure-secret"
    })
  );

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    const user = await storage.getUserByUsername(username);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Store user in session
    req.session.userId = user.id;
    
    return res.status(200).json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      roomId: user.roomId
    });
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/current", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }
    
    return res.status(200).json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      roomId: user.roomId
    });
  });
  
  // User routes
  app.get("/api/users", isAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    return res.status(200).json(users.map(user => ({
      ...user,
      password: undefined // Don't expose passwords
    })));
  });
  
  app.post("/api/users", isAdmin, async (req, res) => {
    const data = validateRequest(insertUserSchema, req, res);
    if (!data) return;
    
    const existingUser = await storage.getUserByUsername(data.username);
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }
    
    const user = await storage.createUser(data);
    return res.status(201).json({
      ...user,
      password: undefined
    });
  });
  
  app.put("/api/users/:id", isAdmin, async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const updatedUser = await storage.updateUser(userId, req.body);
    return res.status(200).json({
      ...updatedUser,
      password: undefined
    });
  });
  
  app.delete("/api/users/:id", isAdmin, async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const success = await storage.deleteUser(userId);
    if (!success) {
      return res.status(404).json({ message: "User not found" });
    }
    
    return res.status(200).json({ message: "User deleted successfully" });
  });
  
  // Room routes
  app.get("/api/rooms", isAuthenticated, async (req, res) => {
    const rooms = await storage.getAllRooms();
    return res.status(200).json(rooms);
  });
  
  app.post("/api/rooms", isAdmin, async (req, res) => {
    const data = validateRequest(insertRoomSchema, req, res);
    if (!data) return;
    
    const existingRoom = await storage.getRoomByName(data.name);
    if (existingRoom) {
      return res.status(409).json({ message: "Room with this name already exists" });
    }
    
    const room = await storage.createRoom(data);
    return res.status(201).json(room);
  });
  
  app.put("/api/rooms/:id", isAdmin, async (req, res) => {
    const roomId = parseInt(req.params.id);
    if (isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }
    
    const room = await storage.getRoom(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    const updatedRoom = await storage.updateRoom(roomId, req.body);
    return res.status(200).json(updatedRoom);
  });
  
  app.delete("/api/rooms/:id", isAdmin, async (req, res) => {
    const roomId = parseInt(req.params.id);
    if (isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }
    
    const success = await storage.deleteRoom(roomId);
    if (!success) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    return res.status(200).json({ message: "Room deleted successfully" });
  });
  
  app.get("/api/rooms/:id", isAuthenticated, async (req, res) => {
    const roomId = parseInt(req.params.id);
    if (isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }
    
    const room = await storage.getRoom(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    return res.status(200).json(room);
  });
  
  // Assign users to room
  app.post("/api/rooms/:id/assign-users", isAdmin, async (req, res) => {
    const roomId = parseInt(req.params.id);
    if (isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }
    
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds)) {
      return res.status(400).json({ message: "userIds must be an array" });
    }
    
    const room = await storage.getRoom(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    // Get all users
    const allUsers = await storage.getAllUsers();
    
    // First, remove all users from this room
    for (const user of allUsers) {
      if (user.roomId === roomId) {
        await storage.updateUser(user.id, { roomId: null });
      }
    }
    
    // Then, assign selected users to this room
    for (const userId of userIds) {
      const user = await storage.getUser(userId);
      if (user) {
        await storage.updateUser(userId, { roomId });
      }
    }
    
    return res.status(200).json({ message: "Users assigned to room successfully" });
  });
  
  // Recording routes
  app.get("/api/recordings", isAuthenticated, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Admins can see all recordings, users can only see their recordings
    let recordings;
    if (user.role === "admin") {
      if (req.query.roomId) {
        const roomId = parseInt(req.query.roomId as string);
        recordings = await storage.getRecordingsByRoom(roomId);
      } else if (req.query.userId) {
        const recordingUserId = parseInt(req.query.userId as string);
        recordings = await storage.getRecordingsByUser(recordingUserId);
      } else {
        // Default to all recordings for the current user if no filters are provided
        recordings = await storage.getRecordingsByUser(userId);
      }
    } else {
      // Non-admin users can only see their own recordings
      recordings = await storage.getRecordingsByUser(userId);
    }
    
    return res.status(200).json(recordings);
  });
  
  app.post("/api/recordings", isAuthenticated, async (req, res) => {
    const data = validateRequest(insertRecordingSchema, req, res);
    if (!data) return;
    
    // Ensure the user is creating a recording for themselves
    if (data.userId !== req.session.userId) {
      return res.status(403).json({ message: "Cannot create recordings for other users" });
    }
    
    const recording = await storage.createRecording(data);
    return res.status(201).json(recording);
  });
  
  app.delete("/api/recordings/:id", isAuthenticated, async (req, res) => {
    const recordingId = parseInt(req.params.id);
    if (isNaN(recordingId)) {
      return res.status(400).json({ message: "Invalid recording ID" });
    }
    
    const recording = await storage.getRecording(recordingId);
    if (!recording) {
      return res.status(404).json({ message: "Recording not found" });
    }
    
    // Check if the user owns this recording or is an admin
    const user = await storage.getUser(req.session.userId!);
    if (user?.role !== "admin" && recording.userId !== req.session.userId) {
      return res.status(403).json({ message: "Cannot delete recordings of other users" });
    }
    
    const success = await storage.deleteRecording(recordingId);
    return res.status(200).json({ message: "Recording deleted successfully" });
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server for push-to-talk broadcasting
  // Use noServer option instead of server for Node.js v23+ compatibility on M2 Macs
  const wss = new WebSocketServer({ 
    noServer: true
  });
  
  // Handle upgrade manually
  httpServer.on('upgrade', (request, socket, head) => {
    // Only handle /ws path
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });
  
  // Store client connections
  const clients: Map<number, WebSocket> = new Map();
  // Map of room IDs to sets of user IDs
  const rooms: Map<number, Set<number>> = new Map();
  
  wss.on('connection', async (ws, req) => {
    let userId: number | null = null;
    let user: any = null;
    
    // Handle messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle authentication
        if (data.type === 'auth') {
          userId = parseInt(data.userId);
          
          if (isNaN(userId)) {
            ws.close(1008, 'Invalid user ID');
            return;
          }
          
          // Get user
          user = await storage.getUser(userId);
          if (!user) {
            ws.close(1008, 'User not found');
            return;
          }
          
          // Associate WebSocket connection with user ID
          clients.set(userId, ws);
          console.log(`User ${user.username} connected via WebSocket`);
          
          // Send a success response
          ws.send(JSON.stringify({
            type: 'auth_success',
            userId: user.id,
            username: user.username
          }));
          
          return;
        }
        
        // Require authentication for all other message types
        if (!userId || !user) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Not authenticated'
          }));
          return;
        }
        
        // Handle different message types
        switch (data.type) {
          // Handle admin broadcasting
          case 'broadcast':
            if (user.role === 'admin') {
              const { audio, roomId } = data;
              
              if (!audio) return;
              
              // If roomId is provided, broadcast only to users in that room
              // Otherwise, broadcast to all users
              const allUsers = await storage.getAllUsers();
              const targetUsers = roomId 
                ? allUsers.filter(u => u.roomId === roomId) 
                : allUsers;
              
              for (const targetUser of targetUsers) {
                // Don't send the broadcast back to the admin
                if (targetUser.id === userId) continue;
                
                const client = clients.get(targetUser.id);
                if (client && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'admin-broadcast',
                    audio,
                    from: user.username
                  }));
                }
              }
            }
            break;
            
          // WebRTC Signaling: Join Room
          case 'webrtc_join_room':
            const roomId = parseInt(data.roomId);
            if (isNaN(roomId)) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid room ID'
              }));
              return;
            }
            
            // Create room if it doesn't exist
            if (!rooms.has(roomId)) {
              rooms.set(roomId, new Set());
            }
            
            // Add user to room
            rooms.get(roomId)?.add(userId);
            
            // Inform other users in the room that this user has joined
            const roomParticipants = rooms.get(roomId) || new Set<number>();
            roomParticipants.forEach(otherUserId => {
              if (otherUserId !== userId) {
                const otherClient = clients.get(otherUserId);
                if (otherClient && otherClient.readyState === WebSocket.OPEN) {
                  otherClient.send(JSON.stringify({
                    type: 'webrtc_user_joined',
                    userId
                  }));
                }
              }
            });
            break;
            
          // WebRTC Signaling: Leave Room
          case 'webrtc_leave_room':
            const leaveRoomId = parseInt(data.roomId);
            if (!isNaN(leaveRoomId) && rooms.has(leaveRoomId)) {
              // Remove user from room
              rooms.get(leaveRoomId)?.delete(userId);
              
              // Inform other users in the room that this user has left
              const leaveRoomParticipants = rooms.get(leaveRoomId) || new Set<number>();
              leaveRoomParticipants.forEach(otherUserId => {
                const otherClient = clients.get(otherUserId);
                if (otherClient && otherClient.readyState === WebSocket.OPEN) {
                  otherClient.send(JSON.stringify({
                    type: 'webrtc_user_left',
                    userId
                  }));
                }
              });
              
              // Remove room if empty
              if (rooms.get(leaveRoomId)?.size === 0) {
                rooms.delete(leaveRoomId);
              }
            }
            break;
            
          // WebRTC Signaling: Get Participants
          case 'webrtc_get_participants':
            const participantsRoomId = parseInt(data.roomId);
            if (!isNaN(participantsRoomId) && rooms.has(participantsRoomId)) {
              // Send list of participants in the room
              ws.send(JSON.stringify({
                type: 'webrtc_participants',
                roomId: participantsRoomId,
                participants: Array.from(rooms.get(participantsRoomId) || [])
              }));
            } else {
              ws.send(JSON.stringify({
                type: 'webrtc_participants',
                roomId: participantsRoomId,
                participants: []
              }));
            }
            break;
            
          // WebRTC Signaling: Offer
          case 'webrtc_offer':
            const offerToUserId = parseInt(data.to);
            if (!isNaN(offerToUserId)) {
              const toClient = clients.get(offerToUserId);
              if (toClient && toClient.readyState === WebSocket.OPEN) {
                toClient.send(JSON.stringify({
                  type: 'webrtc_offer',
                  offer: data.offer,
                  from: userId
                }));
              }
            }
            break;
            
          // WebRTC Signaling: Answer
          case 'webrtc_answer':
            const answerToUserId = parseInt(data.to);
            if (!isNaN(answerToUserId)) {
              const toClient = clients.get(answerToUserId);
              if (toClient && toClient.readyState === WebSocket.OPEN) {
                toClient.send(JSON.stringify({
                  type: 'webrtc_answer',
                  answer: data.answer,
                  from: userId
                }));
              }
            }
            break;
            
          // WebRTC Signaling: ICE Candidate
          case 'webrtc_ice_candidate':
            const iceCandidateToUserId = parseInt(data.to);
            if (!isNaN(iceCandidateToUserId)) {
              const toClient = clients.get(iceCandidateToUserId);
              if (toClient && toClient.readyState === WebSocket.OPEN) {
                toClient.send(JSON.stringify({
                  type: 'webrtc_ice_candidate',
                  candidate: data.candidate,
                  from: userId
                }));
              }
            }
            break;
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      if (userId !== null && userId !== undefined) {
        // Type assertion since we already checked above
        const userIdValue: number = userId;
        
        // Remove user from all rooms
        // Create an array from room entries to avoid iterator issues
        const roomEntries = Array.from(rooms.entries());
        
        roomEntries.forEach(([roomId, participants]) => {
          if (participants.has(userIdValue)) {
            participants.delete(userIdValue);
            
            // Inform other users in the room that this user has left
            participants.forEach(otherUserId => {
              const otherClient = clients.get(otherUserId);
              if (otherClient && otherClient.readyState === WebSocket.OPEN) {
                otherClient.send(JSON.stringify({
                  type: 'webrtc_user_left',
                  userId: userIdValue
                }));
              }
            });
            
            // Remove room if empty
            if (participants.size === 0) {
              rooms.delete(roomId);
            }
          }
        });
        
        // Remove from clients map
        clients.delete(userIdValue);
        
        if (user) {
          console.log(`User ${user.username} disconnected from WebSocket`);
        }
      }
    });
  });
  
  return httpServer;
}
