import { adminFirestore } from './firebase-admin';
import { 
  type User, type InsertUser,
  type Room, type InsertRoom,
  type Recording, type InsertRecording
} from "@shared/schema";
import { Timestamp } from 'firebase-admin/firestore';

// Storage interface from storage.ts
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

// Implement storage with Firebase Firestore
export class FirebaseStorage implements IStorage {
  private usersCollection = 'users';
  private roomsCollection = 'rooms';
  private recordingsCollection = 'recordings';
  private counterDocName = 'counters';
  
  // Helper method to get or create a counter
  private async getNextId(counterName: string): Promise<number> {
    const counterRef = doc(adminFirestore, this.counterDocName, 'app-counters');
    
    try {
      const counterDoc = await getDoc(counterRef);
      let currentId = 1;
      
      if (counterDoc.exists()) {
        const data = counterDoc.data();
        currentId = (data[counterName] || 0) + 1;
        await updateDoc(counterRef, { [counterName]: currentId });
      } else {
        await setDoc(counterRef, { [counterName]: currentId });
      }
      
      return currentId;
    } catch (error) {
      console.error(`Error getting next ID for ${counterName}:`, error);
      throw error;
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const userDoc = await getDoc(doc(adminFirestore, this.usersCollection, id.toString()));
      
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      
      return undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const q = query(
        collection(adminFirestore, this.usersCollection), 
        where('username', '==', username)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as User;
      }
      
      return undefined;
    } catch (error) {
      console.error("Error getting user by username:", error);
      throw error;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const q = query(
        collection(adminFirestore, this.usersCollection), 
        where('email', '==', email)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as User;
      }
      
      return undefined;
    } catch (error) {
      console.error("Error getting user by email:", error);
      throw error;
    }
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const id = await this.getNextId('userId');
      const user: User = { ...insertUser, id };
      
      await setDoc(doc(adminFirestore, this.usersCollection, id.toString()), user);
      
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  
  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    try {
      const userRef = doc(adminFirestore, this.usersCollection, id.toString());
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        const updatedUser = { ...userData, ...userUpdate };
        
        await updateDoc(userRef, updatedUser);
        
        return updatedUser;
      }
      
      return undefined;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      await deleteDoc(doc(adminFirestore, this.usersCollection, id.toString()));
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    try {
      const usersSnapshot = await getDocs(collection(adminFirestore, this.usersCollection));
      return usersSnapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }
  
  // Room methods
  async getRoom(id: number): Promise<Room | undefined> {
    try {
      const roomDoc = await getDoc(doc(adminFirestore, this.roomsCollection, id.toString()));
      
      if (roomDoc.exists()) {
        return roomDoc.data() as Room;
      }
      
      return undefined;
    } catch (error) {
      console.error("Error getting room:", error);
      throw error;
    }
  }
  
  async getRoomByName(name: string): Promise<Room | undefined> {
    try {
      const q = query(
        collection(adminFirestore, this.roomsCollection), 
        where('name', '==', name)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as Room;
      }
      
      return undefined;
    } catch (error) {
      console.error("Error getting room by name:", error);
      throw error;
    }
  }
  
  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    try {
      const id = await this.getNextId('roomId');
      const room: Room = { 
        ...insertRoom, 
        id,
        capacity: insertRoom.capacity || 20,
        active: insertRoom.active !== undefined ? insertRoom.active : true,
        encrypted: insertRoom.encrypted !== undefined ? insertRoom.encrypted : true,
        isolated: insertRoom.isolated !== undefined ? insertRoom.isolated : true
      };
      
      await setDoc(doc(adminFirestore, this.roomsCollection, id.toString()), room);
      
      return room;
    } catch (error) {
      console.error("Error creating room:", error);
      throw error;
    }
  }
  
  async updateRoom(id: number, roomUpdate: Partial<Room>): Promise<Room | undefined> {
    try {
      const roomRef = doc(adminFirestore, this.roomsCollection, id.toString());
      const roomDoc = await getDoc(roomRef);
      
      if (roomDoc.exists()) {
        const roomData = roomDoc.data() as Room;
        const updatedRoom = { ...roomData, ...roomUpdate };
        
        await updateDoc(roomRef, updatedRoom);
        
        return updatedRoom;
      }
      
      return undefined;
    } catch (error) {
      console.error("Error updating room:", error);
      throw error;
    }
  }
  
  async deleteRoom(id: number): Promise<boolean> {
    try {
      await deleteDoc(doc(adminFirestore, this.roomsCollection, id.toString()));
      return true;
    } catch (error) {
      console.error("Error deleting room:", error);
      return false;
    }
  }
  
  async getAllRooms(): Promise<Room[]> {
    try {
      const roomsSnapshot = await getDocs(collection(adminFirestore, this.roomsCollection));
      return roomsSnapshot.docs.map(doc => doc.data() as Room);
    } catch (error) {
      console.error("Error getting all rooms:", error);
      throw error;
    }
  }
  
  // Recording methods
  async getRecording(id: number): Promise<Recording | undefined> {
    try {
      const recordingDoc = await getDoc(doc(adminFirestore, this.recordingsCollection, id.toString()));
      
      if (recordingDoc.exists()) {
        const data = recordingDoc.data();
        return {
          ...data,
          createdAt: (data.createdAt as Timestamp).toDate()
        } as Recording;
      }
      
      return undefined;
    } catch (error) {
      console.error("Error getting recording:", error);
      throw error;
    }
  }
  
  async getRecordingsByUser(userId: number): Promise<Recording[]> {
    try {
      const q = query(
        collection(adminFirestore, this.recordingsCollection), 
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: (data.createdAt as Timestamp).toDate()
        } as Recording;
      });
    } catch (error) {
      console.error("Error getting recordings by user:", error);
      throw error;
    }
  }
  
  async getRecordingsByRoom(roomId: number): Promise<Recording[]> {
    try {
      const q = query(
        collection(adminFirestore, this.recordingsCollection), 
        where('roomId', '==', roomId)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: (data.createdAt as Timestamp).toDate()
        } as Recording;
      });
    } catch (error) {
      console.error("Error getting recordings by room:", error);
      throw error;
    }
  }
  
  async createRecording(insertRecording: InsertRecording): Promise<Recording> {
    try {
      const id = await this.getNextId('recordingId');
      const now = Timestamp.now();
      
      const recording: Recording = { 
        ...insertRecording, 
        id,
        createdAt: now.toDate()
      };
      
      // Store with Timestamp for Firestore
      const firestoreRecording = {
        ...recording,
        createdAt: now
      };
      
      await setDoc(
        doc(adminFirestore, this.recordingsCollection, id.toString()), 
        firestoreRecording
      );
      
      return recording;
    } catch (error) {
      console.error("Error creating recording:", error);
      throw error;
    }
  }
  
  async deleteRecording(id: number): Promise<boolean> {
    try {
      await deleteDoc(doc(adminFirestore, this.recordingsCollection, id.toString()));
      return true;
    } catch (error) {
      console.error("Error deleting recording:", error);
      return false;
    }
  }
}

// Export a singleton instance
export const firebaseStorage = new FirebaseStorage();