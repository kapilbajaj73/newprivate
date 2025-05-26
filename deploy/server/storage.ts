import { 
  users, type User, type InsertUser,
  rooms, type Room, type InsertRoom,
  recordings, type Recording, type InsertRecording
} from "@shared/schema";
import { db } from './db';
import { and, eq } from 'drizzle-orm';

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Room methods
  getRoom(id: number): Promise<Room | undefined>;
  getRoomByName(name: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, room: Partial<Room>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<boolean>;
  getAllRooms(): Promise<Room[]>;
  
  // Recording methods
  getRecording(id: number): Promise<Recording | undefined>;
  getRecordingsByUser(userId: number): Promise<Recording[]>;
  getRecordingsByRoom(roomId: number): Promise<Recording[]>;
  createRecording(recording: InsertRecording): Promise<Recording>;
  deleteRecording(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rooms: Map<number, Room>;
  private recordings: Map<number, Recording>;
  private userId: number;
  private roomId: number;
  private recordingId: number;

  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.recordings = new Map();
    this.userId = 1;
    this.roomId = 1;
    this.recordingId = 1;
    
    // Create admin user by default
    this.createUser({
      username: "admin",
      password: "admin123", // In production, this would be hashed
      email: "admin@onravoice.com",
      fullName: "Admin User",
      role: "admin",
      roomId: null,
    });
    
    // Create two default rooms
    this.createRoom({
      name: "Main Conference Room",
      capacity: 20,
      active: true,
      encrypted: true,
      isolated: true,
    });
    
    this.createRoom({
      name: "Training Room",
      capacity: 10,
      active: false,
      encrypted: true,
      isolated: true,
    });
    
    // Create a test user
    this.createUser({
      username: "user",
      password: "User@123", // In production, this would be hashed
      email: "user@onravoice.com",
      fullName: "Demo User",
      role: "user",
      roomId: 1,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    // Ensure all required fields are provided with defaults if missing
    const user: User = { 
      ...insertUser, 
      id,
      authId: insertUser.authId ?? null,
      role: insertUser.role ?? 'user',
      roomId: insertUser.roomId ?? null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Room methods
  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async getRoomByName(name: string): Promise<Room | undefined> {
    return Array.from(this.rooms.values()).find(
      (room) => room.name === name
    );
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = this.roomId++;
    // Ensure all required fields are provided with defaults if missing
    const room: Room = { 
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

  async updateRoom(id: number, roomUpdate: Partial<Room>): Promise<Room | undefined> {
    const room = await this.getRoom(id);
    if (!room) return undefined;
    
    const updatedRoom = { ...room, ...roomUpdate };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async deleteRoom(id: number): Promise<boolean> {
    return this.rooms.delete(id);
  }

  async getAllRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }

  // Recording methods
  async getRecording(id: number): Promise<Recording | undefined> {
    return this.recordings.get(id);
  }

  async getRecordingsByUser(userId: number): Promise<Recording[]> {
    return Array.from(this.recordings.values()).filter(
      (recording) => recording.userId === userId
    );
  }

  async getRecordingsByRoom(roomId: number): Promise<Recording[]> {
    return Array.from(this.recordings.values()).filter(
      (recording) => recording.roomId === roomId
    );
  }

  async createRecording(insertRecording: InsertRecording): Promise<Recording> {
    const id = this.recordingId++;
    const recording: Recording = { 
      ...insertRecording, 
      id, 
      createdAt: new Date() 
    };
    this.recordings.set(id, recording);
    return recording;
  }

  async deleteRecording(id: number): Promise<boolean> {
    return this.recordings.delete(id);
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userUpdate)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return true; // Success if no error was thrown
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Room methods
  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || undefined;
  }

  async getRoomByName(name: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.name, name));
    return room || undefined;
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const [room] = await db.insert(rooms).values(insertRoom).returning();
    return room;
  }

  async updateRoom(id: number, roomUpdate: Partial<Room>): Promise<Room | undefined> {
    const [updatedRoom] = await db
      .update(rooms)
      .set(roomUpdate)
      .where(eq(rooms.id, id))
      .returning();
    return updatedRoom || undefined;
  }

  async deleteRoom(id: number): Promise<boolean> {
    const result = await db.delete(rooms).where(eq(rooms.id, id));
    return true; // Success if no error was thrown
  }

  async getAllRooms(): Promise<Room[]> {
    return await db.select().from(rooms);
  }

  // Recording methods
  async getRecording(id: number): Promise<Recording | undefined> {
    const [recording] = await db.select().from(recordings).where(eq(recordings.id, id));
    return recording || undefined;
  }

  async getRecordingsByUser(userId: number): Promise<Recording[]> {
    return await db.select().from(recordings).where(eq(recordings.userId, userId));
  }

  async getRecordingsByRoom(roomId: number): Promise<Recording[]> {
    return await db.select().from(recordings).where(eq(recordings.roomId, roomId));
  }

  async createRecording(insertRecording: InsertRecording): Promise<Recording> {
    const [recording] = await db.insert(recordings).values(insertRecording).returning();
    return recording;
  }

  async deleteRecording(id: number): Promise<boolean> {
    const result = await db.delete(recordings).where(eq(recordings.id, id));
    return true; // Success if no error was thrown
  }
}

// Create instances
const memStorage = new MemStorage();
const databaseStorage = new DatabaseStorage();

// Use in-memory storage for development (no database required)
// For production, switch to database storage
export const storage = memStorage; // Change to databaseStorage when deploying with a real database
