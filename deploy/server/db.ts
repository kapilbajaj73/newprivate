import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Check if DATABASE_URL is available
const hasDbUrl = !!process.env.DATABASE_URL;

// Create a mock pool if no DATABASE_URL is provided
// This is just for development to let the app start without a real database
// The app will use MemStorage instead of actually querying the database
export const pool = hasDbUrl 
  ? new Pool({ connectionString: process.env.DATABASE_URL }) 
  : {} as Pool;

// Create drizzle instance with mock or real pool
export const db = hasDbUrl 
  ? drizzle(pool, { schema })
  : {} as ReturnType<typeof drizzle>;

// Log whether we're using a real database or not
console.log(hasDbUrl 
  ? "Using real database connection" 
  : "Using in-memory storage (no database connection)");