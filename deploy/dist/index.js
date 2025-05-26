var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertRecordingSchema: () => insertRecordingSchema,
  insertRoomSchema: () => insertRoomSchema,
  insertUserSchema: () => insertUserSchema,
  recordings: () => recordings,
  recordingsRelations: () => recordingsRelations,
  rooms: () => rooms,
  roomsRelations: () => roomsRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
var rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull().default(20),
  active: boolean("active").notNull().default(true),
  encrypted: boolean("encrypted").notNull().default(true),
  isolated: boolean("isolated").notNull().default(true)
});
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  authId: text("auth_id").unique(),
  // Supabase Auth ID for matching with auth system
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"),
  // "admin" or "user"
  roomId: integer("room_id").references(() => rooms.id, { onDelete: "set null" })
});
var recordings = pgTable("recordings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roomId: integer("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  duration: integer("duration").notNull(),
  // in seconds
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var usersRelations = relations(users, ({ one }) => ({
  room: one(rooms, {
    fields: [users.roomId],
    references: [rooms.id]
  })
}));
var roomsRelations = relations(rooms, ({ many }) => ({
  users: many(users),
  recordings: many(recordings)
}));
var recordingsRelations = relations(recordings, ({ one }) => ({
  user: one(users, {
    fields: [recordings.userId],
    references: [users.id]
  }),
  room: one(rooms, {
    fields: [recordings.roomId],
    references: [rooms.id]
  })
}));
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
  roomId: true,
  authId: true
});
var insertRoomSchema = createInsertSchema(rooms).pick({
  name: true,
  capacity: true,
  active: true,
  encrypted: true,
  isolated: true
});
var insertRecordingSchema = createInsertSchema(recordings).pick({
  userId: true,
  roomId: true,
  fileName: true,
  duration: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
var hasDbUrl = !!process.env.DATABASE_URL;
var pool = hasDbUrl ? new Pool({ connectionString: process.env.DATABASE_URL }) : {};
var db = hasDbUrl ? drizzle(pool, { schema: schema_exports }) : {};
console.log(hasDbUrl ? "Using real database connection" : "Using in-memory storage (no database connection)");

// server/storage.ts
import { eq } from "drizzle-orm";
var MemStorage = class {
  users;
  rooms;
  recordings;
  userId;
  roomId;
  recordingId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.rooms = /* @__PURE__ */ new Map();
    this.recordings = /* @__PURE__ */ new Map();
    this.userId = 1;
    this.roomId = 1;
    this.recordingId = 1;
    this.createUser({
      username: "admin",
      password: "admin123",
      // In production, this would be hashed
      email: "admin@onravoice.com",
      fullName: "Admin User",
      role: "admin",
      roomId: null
    });
    this.createRoom({
      name: "Main Conference Room",
      capacity: 20,
      active: true,
      encrypted: true,
      isolated: true
    });
    this.createRoom({
      name: "Training Room",
      capacity: 10,
      active: false,
      encrypted: true,
      isolated: true
    });
    this.createUser({
      username: "user",
      password: "User@123",
      // In production, this would be hashed
      email: "user@onravoice.com",
      fullName: "Demo User",
      role: "user",
      roomId: 1
    });
  }
  // User methods
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  async createUser(insertUser) {
    const id = this.userId++;
    const user = {
      ...insertUser,
      id,
      authId: insertUser.authId ?? null,
      role: insertUser.role ?? "user",
      roomId: insertUser.roomId ?? null
    };
    this.users.set(id, user);
    return user;
  }
  async updateUser(id, userUpdate) {
    const user = await this.getUser(id);
    if (!user) return void 0;
    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  async deleteUser(id) {
    return this.users.delete(id);
  }
  async getAllUsers() {
    return Array.from(this.users.values());
  }
  // Room methods
  async getRoom(id) {
    return this.rooms.get(id);
  }
  async getRoomByName(name) {
    return Array.from(this.rooms.values()).find(
      (room) => room.name === name
    );
  }
  async createRoom(insertRoom) {
    const id = this.roomId++;
    const room = {
      ...insertRoom,
      id,
      capacity: insertRoom.capacity ?? 20,
      active: insertRoom.active ?? true,
      encrypted: insertRoom.encrypted ?? true,
      isolated: insertRoom.isolated ?? true
    };
    this.rooms.set(id, room);
    return room;
  }
  async updateRoom(id, roomUpdate) {
    const room = await this.getRoom(id);
    if (!room) return void 0;
    const updatedRoom = { ...room, ...roomUpdate };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }
  async deleteRoom(id) {
    return this.rooms.delete(id);
  }
  async getAllRooms() {
    return Array.from(this.rooms.values());
  }
  // Recording methods
  async getRecording(id) {
    return this.recordings.get(id);
  }
  async getRecordingsByUser(userId) {
    return Array.from(this.recordings.values()).filter(
      (recording) => recording.userId === userId
    );
  }
  async getRecordingsByRoom(roomId) {
    return Array.from(this.recordings.values()).filter(
      (recording) => recording.roomId === roomId
    );
  }
  async createRecording(insertRecording) {
    const id = this.recordingId++;
    const recording = {
      ...insertRecording,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.recordings.set(id, recording);
    return recording;
  }
  async deleteRecording(id) {
    return this.recordings.delete(id);
  }
};
var DatabaseStorage = class {
  // User methods
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUser(id, userUpdate) {
    const [updatedUser] = await db.update(users).set(userUpdate).where(eq(users.id, id)).returning();
    return updatedUser || void 0;
  }
  async deleteUser(id) {
    const result = await db.delete(users).where(eq(users.id, id));
    return true;
  }
  async getAllUsers() {
    return await db.select().from(users);
  }
  // Room methods
  async getRoom(id) {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || void 0;
  }
  async getRoomByName(name) {
    const [room] = await db.select().from(rooms).where(eq(rooms.name, name));
    return room || void 0;
  }
  async createRoom(insertRoom) {
    const [room] = await db.insert(rooms).values(insertRoom).returning();
    return room;
  }
  async updateRoom(id, roomUpdate) {
    const [updatedRoom] = await db.update(rooms).set(roomUpdate).where(eq(rooms.id, id)).returning();
    return updatedRoom || void 0;
  }
  async deleteRoom(id) {
    const result = await db.delete(rooms).where(eq(rooms.id, id));
    return true;
  }
  async getAllRooms() {
    return await db.select().from(rooms);
  }
  // Recording methods
  async getRecording(id) {
    const [recording] = await db.select().from(recordings).where(eq(recordings.id, id));
    return recording || void 0;
  }
  async getRecordingsByUser(userId) {
    return await db.select().from(recordings).where(eq(recordings.userId, userId));
  }
  async getRecordingsByRoom(roomId) {
    return await db.select().from(recordings).where(eq(recordings.roomId, roomId));
  }
  async createRecording(insertRecording) {
    const [recording] = await db.insert(recordings).values(insertRecording).returning();
    return recording;
  }
  async deleteRecording(id) {
    const result = await db.delete(recordings).where(eq(recordings.id, id));
    return true;
  }
};
var memStorage = new MemStorage();
var databaseStorage = new DatabaseStorage();
var storage = memStorage;

// server/routes.ts
import session from "express-session";
import MemoryStore from "memorystore";
import { z } from "zod";
var MemoryStoreClass = MemoryStore(session);
var sessionStore = new MemoryStoreClass({
  checkPeriod: 864e5
  // prune expired entries every 24h
});
var validateRequest = (schema, req, res) => {
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
var isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};
var isAdmin = async (req, res, next) => {
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
async function registerRoutes(app2) {
  app2.use(
    session({
      cookie: { maxAge: 864e5 },
      // 24 hours
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "this-is-not-a-secure-secret"
    })
  );
  app2.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    const user = await storage.getUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    req.session.userId = user.id;
    return res.status(200).json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      roomId: user.roomId
    });
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });
  app2.get("/api/auth/current", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {
      });
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
  app2.get("/api/users", isAdmin, async (req, res) => {
    const users2 = await storage.getAllUsers();
    return res.status(200).json(users2.map((user) => ({
      ...user,
      password: void 0
      // Don't expose passwords
    })));
  });
  app2.post("/api/users", isAdmin, async (req, res) => {
    const data = validateRequest(insertUserSchema, req, res);
    if (!data) return;
    const existingUser = await storage.getUserByUsername(data.username);
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }
    const user = await storage.createUser(data);
    return res.status(201).json({
      ...user,
      password: void 0
    });
  });
  app2.put("/api/users/:id", isAdmin, async (req, res) => {
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
      password: void 0
    });
  });
  app2.delete("/api/users/:id", isAdmin, async (req, res) => {
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
  app2.get("/api/rooms", isAuthenticated, async (req, res) => {
    const rooms3 = await storage.getAllRooms();
    return res.status(200).json(rooms3);
  });
  app2.post("/api/rooms", isAdmin, async (req, res) => {
    const data = validateRequest(insertRoomSchema, req, res);
    if (!data) return;
    const existingRoom = await storage.getRoomByName(data.name);
    if (existingRoom) {
      return res.status(409).json({ message: "Room with this name already exists" });
    }
    const room = await storage.createRoom(data);
    return res.status(201).json(room);
  });
  app2.put("/api/rooms/:id", isAdmin, async (req, res) => {
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
  app2.delete("/api/rooms/:id", isAdmin, async (req, res) => {
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
  app2.get("/api/rooms/:id", isAuthenticated, async (req, res) => {
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
  app2.post("/api/rooms/:id/assign-users", isAdmin, async (req, res) => {
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
    const allUsers = await storage.getAllUsers();
    for (const user of allUsers) {
      if (user.roomId === roomId) {
        await storage.updateUser(user.id, { roomId: null });
      }
    }
    for (const userId of userIds) {
      const user = await storage.getUser(userId);
      if (user) {
        await storage.updateUser(userId, { roomId });
      }
    }
    return res.status(200).json({ message: "Users assigned to room successfully" });
  });
  app2.get("/api/recordings", isAuthenticated, async (req, res) => {
    const userId = req.session.userId;
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    let recordings2;
    if (user.role === "admin") {
      if (req.query.roomId) {
        const roomId = parseInt(req.query.roomId);
        recordings2 = await storage.getRecordingsByRoom(roomId);
      } else if (req.query.userId) {
        const recordingUserId = parseInt(req.query.userId);
        recordings2 = await storage.getRecordingsByUser(recordingUserId);
      } else {
        recordings2 = await storage.getRecordingsByUser(userId);
      }
    } else {
      recordings2 = await storage.getRecordingsByUser(userId);
    }
    return res.status(200).json(recordings2);
  });
  app2.post("/api/recordings", isAuthenticated, async (req, res) => {
    const data = validateRequest(insertRecordingSchema, req, res);
    if (!data) return;
    if (data.userId !== req.session.userId) {
      return res.status(403).json({ message: "Cannot create recordings for other users" });
    }
    const recording = await storage.createRecording(data);
    return res.status(201).json(recording);
  });
  app2.delete("/api/recordings/:id", isAuthenticated, async (req, res) => {
    const recordingId = parseInt(req.params.id);
    if (isNaN(recordingId)) {
      return res.status(400).json({ message: "Invalid recording ID" });
    }
    const recording = await storage.getRecording(recordingId);
    if (!recording) {
      return res.status(404).json({ message: "Recording not found" });
    }
    const user = await storage.getUser(req.session.userId);
    if (user?.role !== "admin" && recording.userId !== req.session.userId) {
      return res.status(403).json({ message: "Cannot delete recordings of other users" });
    }
    const success = await storage.deleteRecording(recordingId);
    return res.status(200).json({ message: "Recording deleted successfully" });
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({
    noServer: true
  });
  httpServer.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
    if (pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws2) => {
        wss.emit("connection", ws2, request);
      });
    }
  });
  const clients = /* @__PURE__ */ new Map();
  const rooms2 = /* @__PURE__ */ new Map();
  wss.on("connection", async (ws2, req) => {
    let userId = null;
    let user = null;
    ws2.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "auth") {
          userId = parseInt(data.userId);
          if (isNaN(userId)) {
            ws2.close(1008, "Invalid user ID");
            return;
          }
          user = await storage.getUser(userId);
          if (!user) {
            ws2.close(1008, "User not found");
            return;
          }
          clients.set(userId, ws2);
          console.log(`User ${user.username} connected via WebSocket`);
          ws2.send(JSON.stringify({
            type: "auth_success",
            userId: user.id,
            username: user.username
          }));
          return;
        }
        if (!userId || !user) {
          ws2.send(JSON.stringify({
            type: "error",
            message: "Not authenticated"
          }));
          return;
        }
        switch (data.type) {
          // Handle admin broadcasting
          case "broadcast":
            if (user.role === "admin") {
              const { audio, roomId: roomId2 } = data;
              if (!audio) return;
              const allUsers = await storage.getAllUsers();
              const targetUsers = roomId2 ? allUsers.filter((u) => u.roomId === roomId2) : allUsers;
              for (const targetUser of targetUsers) {
                if (targetUser.id === userId) continue;
                const client = clients.get(targetUser.id);
                if (client && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: "admin-broadcast",
                    audio,
                    from: user.username
                  }));
                }
              }
            }
            break;
          // WebRTC Signaling: Join Room
          case "webrtc_join_room":
            const roomId = parseInt(data.roomId);
            if (isNaN(roomId)) {
              ws2.send(JSON.stringify({
                type: "error",
                message: "Invalid room ID"
              }));
              return;
            }
            if (!rooms2.has(roomId)) {
              rooms2.set(roomId, /* @__PURE__ */ new Set());
            }
            rooms2.get(roomId)?.add(userId);
            const roomParticipants = rooms2.get(roomId) || /* @__PURE__ */ new Set();
            roomParticipants.forEach((otherUserId) => {
              if (otherUserId !== userId) {
                const otherClient = clients.get(otherUserId);
                if (otherClient && otherClient.readyState === WebSocket.OPEN) {
                  otherClient.send(JSON.stringify({
                    type: "webrtc_user_joined",
                    userId
                  }));
                }
              }
            });
            break;
          // WebRTC Signaling: Leave Room
          case "webrtc_leave_room":
            const leaveRoomId = parseInt(data.roomId);
            if (!isNaN(leaveRoomId) && rooms2.has(leaveRoomId)) {
              rooms2.get(leaveRoomId)?.delete(userId);
              const leaveRoomParticipants = rooms2.get(leaveRoomId) || /* @__PURE__ */ new Set();
              leaveRoomParticipants.forEach((otherUserId) => {
                const otherClient = clients.get(otherUserId);
                if (otherClient && otherClient.readyState === WebSocket.OPEN) {
                  otherClient.send(JSON.stringify({
                    type: "webrtc_user_left",
                    userId
                  }));
                }
              });
              if (rooms2.get(leaveRoomId)?.size === 0) {
                rooms2.delete(leaveRoomId);
              }
            }
            break;
          // WebRTC Signaling: Get Participants
          case "webrtc_get_participants":
            const participantsRoomId = parseInt(data.roomId);
            if (!isNaN(participantsRoomId) && rooms2.has(participantsRoomId)) {
              ws2.send(JSON.stringify({
                type: "webrtc_participants",
                roomId: participantsRoomId,
                participants: Array.from(rooms2.get(participantsRoomId) || [])
              }));
            } else {
              ws2.send(JSON.stringify({
                type: "webrtc_participants",
                roomId: participantsRoomId,
                participants: []
              }));
            }
            break;
          // WebRTC Signaling: Offer
          case "webrtc_offer":
            const offerToUserId = parseInt(data.to);
            if (!isNaN(offerToUserId)) {
              const toClient = clients.get(offerToUserId);
              if (toClient && toClient.readyState === WebSocket.OPEN) {
                toClient.send(JSON.stringify({
                  type: "webrtc_offer",
                  offer: data.offer,
                  from: userId
                }));
              }
            }
            break;
          // WebRTC Signaling: Answer
          case "webrtc_answer":
            const answerToUserId = parseInt(data.to);
            if (!isNaN(answerToUserId)) {
              const toClient = clients.get(answerToUserId);
              if (toClient && toClient.readyState === WebSocket.OPEN) {
                toClient.send(JSON.stringify({
                  type: "webrtc_answer",
                  answer: data.answer,
                  from: userId
                }));
              }
            }
            break;
          // WebRTC Signaling: ICE Candidate
          case "webrtc_ice_candidate":
            const iceCandidateToUserId = parseInt(data.to);
            if (!isNaN(iceCandidateToUserId)) {
              const toClient = clients.get(iceCandidateToUserId);
              if (toClient && toClient.readyState === WebSocket.OPEN) {
                toClient.send(JSON.stringify({
                  type: "webrtc_ice_candidate",
                  candidate: data.candidate,
                  from: userId
                }));
              }
            }
            break;
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    });
    ws2.on("close", () => {
      if (userId !== null && userId !== void 0) {
        const userIdValue = userId;
        const roomEntries = Array.from(rooms2.entries());
        roomEntries.forEach(([roomId, participants]) => {
          if (participants.has(userIdValue)) {
            participants.delete(userIdValue);
            participants.forEach((otherUserId) => {
              const otherClient = clients.get(otherUserId);
              if (otherClient && otherClient.readyState === WebSocket.OPEN) {
                otherClient.send(JSON.stringify({
                  type: "webrtc_user_left",
                  userId: userIdValue
                }));
              }
            });
            if (participants.size === 0) {
              rooms2.delete(roomId);
            }
          }
        });
        clients.delete(userIdValue);
        if (user) {
          console.log(`User ${user.username} disconnected from WebSocket`);
        }
      }
    });
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen(port, "localhost", () => {
    log(`serving on port ${port}`);
  });
})();
