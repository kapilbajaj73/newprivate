import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { db, pool } from "./db";

// This script will apply all pending migrations to the database
async function runMigrations() {
  console.log("⏳ Running migrations...");
  
  try {
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("✅ Migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();