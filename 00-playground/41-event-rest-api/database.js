import Database from "better-sqlite3";

let db = null;

export function initDb() {
  if (db) {
    return db;
  }

  db = new Database("events.db", { verbose: console.log });

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  // Create events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      address TEXT,
      date TEXT NOT NULL
    )
  `);

  return db;
}

export function getDb() {
  return initDb(); // This will either return existing db or initialize a new one
}
