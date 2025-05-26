import { storage } from "./storage";
import { InsertUser } from "@shared/schema";

async function createTestUser() {
  try {
    // Check if user already exists
    const existingUser = await storage.getUserByUsername("testuser");
    
    if (existingUser) {
      console.log("Test user already exists");
      return;
    }
    
    // Create a regular test user
    const testUser: InsertUser = {
      username: "testuser",
      password: "testuser123",
      fullName: "Test User",
      email: "testuser@example.com",
      role: "user",
      roomId: null
    };
    
    const user = await storage.createUser(testUser);
    console.log("Created test user:", user);
  } catch (error) {
    console.error("Error creating test user:", error);
  }
}

// Self-executing function
(async () => {
  await createTestUser();
  process.exit(0);
})();