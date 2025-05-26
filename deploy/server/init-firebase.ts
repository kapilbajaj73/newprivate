import { firebaseStorage } from './firebase-storage-impl';
import * as bcrypt from 'bcryptjs';

// This script initializes the Firebase database with default data
async function initializeDatabase() {
  console.log("⏳ Initializing Firebase database...");
  
  try {
    // Check for existing admin user
    const existingAdmin = await firebaseStorage.getUserByUsername('admin');
    
    if (!existingAdmin) {
      console.log("📝 Creating admin user...");
      
      // Hash password for admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);
      
      // Create admin user
      const adminUser = await firebaseStorage.createUser({
        username: "admin",
        password: hashedPassword,
        email: "admin@onravoice.com",
        fullName: "Administrator",
        role: "admin",
        roomId: null
      });
      
      console.log("✅ Admin user created:", adminUser.username);
    } else {
      console.log("👍 Admin user already exists, skipping creation");
    }
    
    // Check for existing rooms
    const rooms = await firebaseStorage.getAllRooms();
    
    if (rooms.length === 0) {
      console.log("📝 Creating default rooms...");
      
      // Create main conference room
      const room1 = await firebaseStorage.createRoom({
        name: "Main Conference Room",
        capacity: 20,
        active: true,
        encrypted: true,
        isolated: true
      });
      
      // Create training room
      const room2 = await firebaseStorage.createRoom({
        name: "Training Room",
        capacity: 10,
        active: false,
        encrypted: true,
        isolated: true
      });
      
      console.log("✅ Created default rooms:", room1.name, "and", room2.name);
    } else {
      console.log(`👍 ${rooms.length} rooms already exist, skipping creation`);
    }
    
    // Create a regular user if none exists
    const existingUser = await firebaseStorage.getUserByUsername('user');
    
    if (!existingUser) {
      console.log("📝 Creating regular user...");
      
      // Hash password for regular user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("User@123", salt);
      
      // Create user with room assignment
      const user = await firebaseStorage.createUser({
        username: "user",
        password: hashedPassword,
        email: "user@onravoice.com",
        fullName: "Demo User",
        role: "user",
        roomId: 1 // Assign to room 1
      });
      
      console.log("✅ Regular user created:", user.username);
    } else {
      console.log("👍 Regular user already exists, skipping creation");
    }
    
    console.log("✅ Firebase database initialization completed successfully!");
    console.log("\nDefault credentials:");
    console.log("Admin: admin@onravoice.com / admin123");
    console.log("User: user@onravoice.com / User@123");
    
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error);
  }
}

// Run the initialization
initializeDatabase();