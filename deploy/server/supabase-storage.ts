import { 
  type User, type InsertUser,
  type Room, type InsertRoom,
  type Recording, type InsertRecording
} from "@shared/schema";
import { supabaseAdmin, getByField, getById, getAll, insert, update, remove, query } from "./supabase";

// Define the Storage interface (same as before)
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

// Implement the Supabase storage implementation
export class SupabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const user = await getById('users', id);
      return user as User;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await getByField('users', 'username', username);
      return user as User;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await getByField('users', 'email', email);
      return user as User;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Check if user already exists with same email or username
      const existingByEmail = await this.getUserByEmail(insertUser.email);
      if (existingByEmail) {
        throw new Error("User with this email already exists");
      }
      
      const existingByUsername = await this.getUserByUsername(insertUser.username);
      if (existingByUsername) {
        throw new Error("User with this username already exists");
      }
      
      // Create user in Supabase Database
      const user = await insert('users', insertUser) as User;
      
      // Create user in Supabase Auth
      await supabaseAdmin.auth.admin.createUser({
        email: insertUser.email,
        password: insertUser.password,
        email_confirm: true,
        user_metadata: {
          username: insertUser.username,
          fullName: insertUser.fullName,
          role: insertUser.role,
          roomId: insertUser.roomId
        }
      });
      
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  
  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    try {
      const updatedUser = await update('users', id, userUpdate) as User;
      
      // If we have the auth ID and email or password, update auth user too
      if (updatedUser.authId) {
        const updates: any = {};
        
        if (userUpdate.email) {
          updates.email = userUpdate.email;
        }
        
        if (userUpdate.password) {
          updates.password = userUpdate.password;
        }
        
        // Update user metadata if any profile fields change
        const metadataUpdates: any = {};
        if (userUpdate.username) metadataUpdates.username = userUpdate.username;
        if (userUpdate.fullName) metadataUpdates.fullName = userUpdate.fullName;
        if (userUpdate.role) metadataUpdates.role = userUpdate.role;
        if (userUpdate.roomId !== undefined) metadataUpdates.roomId = userUpdate.roomId;
        
        if (Object.keys(metadataUpdates).length > 0) {
          updates.user_metadata = metadataUpdates;
        }
        
        if (Object.keys(updates).length > 0) {
          await supabaseAdmin.auth.admin.updateUserById(updatedUser.authId, updates);
        }
      }
      
      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      // Get user to find auth ID
      const user = await this.getUser(id);
      
      // Delete from database
      await remove('users', id);
      
      // Delete from auth if we have authId
      if (user?.authId) {
        await supabaseAdmin.auth.admin.deleteUser(user.authId);
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    try {
      const users = await getAll('users');
      return users as User[];
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }
  
  // Room methods
  async getRoom(id: number): Promise<Room | undefined> {
    try {
      const room = await getById('rooms', id);
      return room as Room;
    } catch (error) {
      console.error("Error getting room:", error);
      return undefined;
    }
  }
  
  async getRoomByName(name: string): Promise<Room | undefined> {
    try {
      const room = await getByField('rooms', 'name', name);
      return room as Room;
    } catch (error) {
      console.error("Error getting room by name:", error);
      return undefined;
    }
  }
  
  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    try {
      // Check if room already exists with same name
      const existingRoom = await this.getRoomByName(insertRoom.name);
      if (existingRoom) {
        throw new Error("Room with this name already exists");
      }
      
      // Set default values if not provided
      const roomToInsert: InsertRoom = {
        ...insertRoom,
        capacity: insertRoom.capacity || 20,
        active: insertRoom.active !== undefined ? insertRoom.active : true,
        encrypted: insertRoom.encrypted !== undefined ? insertRoom.encrypted : true,
        isolated: insertRoom.isolated !== undefined ? insertRoom.isolated : true
      };
      
      // Create room in database
      const room = await insert('rooms', roomToInsert) as Room;
      return room;
    } catch (error) {
      console.error("Error creating room:", error);
      throw error;
    }
  }
  
  async updateRoom(id: number, roomUpdate: Partial<Room>): Promise<Room | undefined> {
    try {
      // If name is changed, check if new name already exists
      if (roomUpdate.name) {
        const existingRoom = await this.getRoomByName(roomUpdate.name);
        if (existingRoom && existingRoom.id !== id) {
          throw new Error("Room with this name already exists");
        }
      }
      
      // Update room
      const updatedRoom = await update('rooms', id, roomUpdate) as Room;
      return updatedRoom;
    } catch (error) {
      console.error("Error updating room:", error);
      return undefined;
    }
  }
  
  async deleteRoom(id: number): Promise<boolean> {
    try {
      await remove('rooms', id);
      return true;
    } catch (error) {
      console.error("Error deleting room:", error);
      return false;
    }
  }
  
  async getAllRooms(): Promise<Room[]> {
    try {
      const rooms = await getAll('rooms');
      return rooms as Room[];
    } catch (error) {
      console.error("Error getting all rooms:", error);
      return [];
    }
  }
  
  // Recording methods
  async getRecording(id: number): Promise<Recording | undefined> {
    try {
      const recording = await getById('recordings', id);
      return recording as Recording;
    } catch (error) {
      console.error("Error getting recording:", error);
      return undefined;
    }
  }
  
  async getRecordingsByUser(userId: number): Promise<Recording[]> {
    try {
      const recordings = await query('recordings', query => 
        query.select('*').eq('userId', userId)
      );
      return recordings as Recording[];
    } catch (error) {
      console.error("Error getting recordings by user:", error);
      return [];
    }
  }
  
  async getRecordingsByRoom(roomId: number): Promise<Recording[]> {
    try {
      const recordings = await query('recordings', query => 
        query.select('*').eq('roomId', roomId)
      );
      return recordings as Recording[];
    } catch (error) {
      console.error("Error getting recordings by room:", error);
      return [];
    }
  }
  
  async createRecording(insertRecording: InsertRecording): Promise<Recording> {
    try {
      // Create recording with current timestamp
      const recordingToInsert = {
        ...insertRecording,
        createdAt: new Date()
      };
      
      const recording = await insert('recordings', recordingToInsert) as Recording;
      return recording;
    } catch (error) {
      console.error("Error creating recording:", error);
      throw error;
    }
  }
  
  async deleteRecording(id: number): Promise<boolean> {
    try {
      await remove('recordings', id);
      return true;
    } catch (error) {
      console.error("Error deleting recording:", error);
      return false;
    }
  }
}

// Export storage instance
export const supabaseStorage = new SupabaseStorage();