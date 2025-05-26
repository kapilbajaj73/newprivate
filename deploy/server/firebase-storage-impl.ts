import { adminFirestore } from './firebase-admin';
import { 
  type User, type InsertUser,
  type Room, type InsertRoom,
  type Recording, type InsertRecording
} from "@shared/schema";
import { Timestamp } from 'firebase-admin/firestore';

// Define the Storage interface
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

// Implement using Firebase Admin SDK
export class FirebaseStorage implements IStorage {
  // Collection names
  private usersCollection = 'users';
  private roomsCollection = 'rooms';
  private recordingsCollection = 'recordings';
  private counterDocName = 'counters';
  
  // Helper method to get next ID
  private async getNextId(counterName: string): Promise<number> {
    const counterDocRef = adminFirestore.collection(this.counterDocName).doc('app-counters');
    
    try {
      return await adminFirestore.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterDocRef);
        let currentId = 1;
        
        if (counterDoc.exists) {
          const data = counterDoc.data();
          if (data && data[counterName]) {
            currentId = data[counterName] + 1;
          }
        }
        
        transaction.set(
          counterDocRef, 
          { [counterName]: currentId },
          { merge: true }
        );
        
        return currentId;
      });
    } catch (error) {
      console.error(`Error getting next ID for ${counterName}:`, error);
      throw error;
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const docRef = adminFirestore.collection(this.usersCollection).doc(id.toString());
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        return { id, ...docSnap.data() } as User;
      }
      
      return undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const querySnapshot = await adminFirestore
        .collection(this.usersCollection)
        .where('username', '==', username)
        .limit(1)
        .get();
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { ...doc.data(), id: parseInt(doc.id) } as User;
      }
      
      return undefined;
    } catch (error) {
      console.error("Error getting user by username:", error);
      throw error;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const querySnapshot = await adminFirestore
        .collection(this.usersCollection)
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { ...doc.data(), id: parseInt(doc.id) } as User;
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
      const user = { ...insertUser, id } as User;
      
      await adminFirestore
        .collection(this.usersCollection)
        .doc(id.toString())
        .set(user);
      
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  
  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    try {
      const docRef = adminFirestore.collection(this.usersCollection).doc(id.toString());
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        const userData = docSnap.data() as Partial<User>;
        const updatedUser = { ...userData, ...userUpdate, id } as User;
        
        await docRef.update(userUpdate);
        
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
      await adminFirestore
        .collection(this.usersCollection)
        .doc(id.toString())
        .delete();
      
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    try {
      const snapshot = await adminFirestore.collection(this.usersCollection).get();
      
      return snapshot.docs.map(doc => {
        return { ...doc.data(), id: parseInt(doc.id) } as User;
      });
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }
  
  // Room methods
  async getRoom(id: number): Promise<Room | undefined> {
    try {
      const docRef = adminFirestore.collection(this.roomsCollection).doc(id.toString());
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        return { id, ...docSnap.data() } as Room;
      }
      
      return undefined;
    } catch (error) {
      console.error("Error getting room:", error);
      throw error;
    }
  }
  
  async getRoomByName(name: string): Promise<Room | undefined> {
    try {
      const querySnapshot = await adminFirestore
        .collection(this.roomsCollection)
        .where('name', '==', name)
        .limit(1)
        .get();
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { ...doc.data(), id: parseInt(doc.id) } as Room;
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
      
      await adminFirestore
        .collection(this.roomsCollection)
        .doc(id.toString())
        .set(room);
      
      return room;
    } catch (error) {
      console.error("Error creating room:", error);
      throw error;
    }
  }
  
  async updateRoom(id: number, roomUpdate: Partial<Room>): Promise<Room | undefined> {
    try {
      const docRef = adminFirestore.collection(this.roomsCollection).doc(id.toString());
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        const roomData = docSnap.data() as Partial<Room>;
        const updatedRoom = { ...roomData, ...roomUpdate, id } as Room;
        
        await docRef.update(roomUpdate);
        
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
      await adminFirestore
        .collection(this.roomsCollection)
        .doc(id.toString())
        .delete();
      
      return true;
    } catch (error) {
      console.error("Error deleting room:", error);
      return false;
    }
  }
  
  async getAllRooms(): Promise<Room[]> {
    try {
      const snapshot = await adminFirestore.collection(this.roomsCollection).get();
      
      return snapshot.docs.map(doc => {
        return { ...doc.data(), id: parseInt(doc.id) } as Room;
      });
    } catch (error) {
      console.error("Error getting all rooms:", error);
      throw error;
    }
  }
  
  // Recording methods
  async getRecording(id: number): Promise<Recording | undefined> {
    try {
      const docRef = adminFirestore.collection(this.recordingsCollection).doc(id.toString());
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        const data = docSnap.data();
        
        if (data) {
          // Convert Firestore Timestamp to Date
          return {
            ...data,
            id,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt)
          } as Recording;
        }
      }
      
      return undefined;
    } catch (error) {
      console.error("Error getting recording:", error);
      throw error;
    }
  }
  
  async getRecordingsByUser(userId: number): Promise<Recording[]> {
    try {
      const snapshot = await adminFirestore
        .collection(this.recordingsCollection)
        .where('userId', '==', userId)
        .get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        
        return {
          ...data,
          id: parseInt(doc.id),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt)
        } as Recording;
      });
    } catch (error) {
      console.error("Error getting recordings by user:", error);
      throw error;
    }
  }
  
  async getRecordingsByRoom(roomId: number): Promise<Recording[]> {
    try {
      const snapshot = await adminFirestore
        .collection(this.recordingsCollection)
        .where('roomId', '==', roomId)
        .get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        
        return {
          ...data,
          id: parseInt(doc.id),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt)
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
      
      // Store with Firestore Timestamp
      const firestoreRecording = {
        ...insertRecording,
        id,
        createdAt: now
      };
      
      await adminFirestore
        .collection(this.recordingsCollection)
        .doc(id.toString())
        .set(firestoreRecording);
      
      return recording;
    } catch (error) {
      console.error("Error creating recording:", error);
      throw error;
    }
  }
  
  async deleteRecording(id: number): Promise<boolean> {
    try {
      await adminFirestore
        .collection(this.recordingsCollection)
        .doc(id.toString())
        .delete();
      
      return true;
    } catch (error) {
      console.error("Error deleting recording:", error);
      return false;
    }
  }
}

// Export the Firebase storage implementation
export const firebaseStorage = new FirebaseStorage();