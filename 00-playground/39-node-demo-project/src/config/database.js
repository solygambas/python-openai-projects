import sqlite3 from "sqlite3";
import { open } from "sqlite";

// Database setup
export const dbPromise = open({
  filename: "./database.sqlite",
  driver: sqlite3.Database,
});

export async function initializeDatabase() {
  const db = await dbPromise;

  // Create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add any other table creation statements here

  console.log("Database initialized successfully");
}
