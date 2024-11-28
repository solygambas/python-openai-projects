import express from "express";
import { getDb } from "../database.js";

const router = express.Router();
const db = getDb();

// Create a new event
export function create(event) {
  const { title, description, address, date } = event;
  const stmt = db.prepare(
    "INSERT INTO events (title, description, address, date) VALUES (?, ?, ?, ?)"
  );
  const info = stmt.run(title, description, address, date);
  return { id: info.lastInsertRowid, title, description, address, date };
}

// Edit an event by ID
export function findByIdAndUpdate(id, update) {
  const { title, description, address, date } = update;
  const stmt = db.prepare(
    "UPDATE events SET title = ?, description = ?, address = ?, date = ? WHERE id = ?"
  );
  const info = stmt.run(title, description, address, date, id);
  if (info.changes > 0) {
    return { id, title, description, address, date };
  }
  return null;
}

// Delete an event by ID
export function findByIdAndDelete(id) {
  const stmt = db.prepare("DELETE FROM events WHERE id = ?");
  const info = stmt.run(id);
  if (info.changes > 0) {
    return { id };
  }
  return null;
}

// Get all events
export function find() {
  const stmt = db.prepare("SELECT * FROM events");
  return stmt.all();
}

// Get a single event by ID
export function findById(id) {
  const stmt = db.prepare("SELECT * FROM events WHERE id = ?");
  return stmt.get(id);
}
