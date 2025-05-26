import { db, pool } from "./db";
import { InsertUser, InsertRoom, users, rooms } from "@shared/schema";
import * as bcrypt from "bcryptjs";

// This script will add initial data to the database
async function seed() {
  console.log("⏳ Seeding database...");
  
  try {
    // Hash password for admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);
    
    // Create admin user
    const adminUser: InsertUser = {
      username: "admin",
      password: hashedPassword,
      email: "admin@onravoice.com",
      fullName: "Administrator",
      role: "admin",
      roomId: null
    };
    
    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(db.eq(users.username, "admin"));
    
    if (existingAdmin.length === 0) {
      console.log("📝 Creating admin user...");
      const [admin] = await db.insert(users).values(adminUser).returning();
      console.log("✅ Admin user created:", admin.username);
    } else {
      console.log("👍 Admin user already exists, skipping creation");
    }
    
    // Create default rooms if they don't exist
    const existingRooms = await db.select().from(rooms);
    
    if (existingRooms.length === 0) {
      console.log("📝 Creating default rooms...");
      
      const defaultRooms: InsertRoom[] = [
        {
          name: "Main Conference Room",
          capacity: 20,
          active: true,
          encrypted: true,
          isolated: true
        },
        {
          name: "Training Room",
          capacity: 10,
          active: false,
          encrypted: true,
          isolated: true
        }
      ];
      
      const createdRooms = await db.insert(rooms).values(defaultRooms).returning();
      console.log(`✅ Created ${createdRooms.length} default rooms`);
    } else {
      console.log(`👍 ${existingRooms.length} rooms already exist, skipping creation`);
    }
    
    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();