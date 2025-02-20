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
      date TEXT NOT NULL,
      image TEXT NOT NULL,
      user_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) 
    )
  `);

  // Create registrations table
  db.exec(`
  CREATE TABLE IF NOT EXISTS registrations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (event_id) REFERENCES events (id)
  )
 `);

  return db;
}

export function getDb() {
  return initDb(); // This will either return existing db or initialize a new one
}
