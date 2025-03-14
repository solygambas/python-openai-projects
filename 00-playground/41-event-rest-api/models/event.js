import express from "express";
import { getDb } from "../database.js";

const router = express.Router();
const db = getDb();

// Create a new event
export function create(event) {
  const id = Math.random().toString(36).substring(2);
  const { title, description, address, date, userId, image } = event;
  const stmt = db.prepare(
    "INSERT INTO events (id, title, description, address, date, user_id, image) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const info = stmt.run(id, title, description, address, date, userId, image);

  return { id, title, description, address, date, userId, image };
}

// Edit an event by ID
export function findByIdAndUpdate(id, update) {
  const { title, description, address, date, image } = update;
  const stmt = db.prepare(
    "UPDATE events SET title = ?, description = ?, address = ?, date = ?, image = ? WHERE id = ?"
  );
  const info = stmt.run(title, description, address, date, image, id);
  if (info.changes > 0) {
    // Get the updated event to include user_id
    const updatedEvent = findById(id);
    return updatedEvent;
  }
  return null;
}

// Delete an event by ID
export function findByIdAndDelete(id) {
  // Get the event before deletion to return user_id
  const event = findById(id);
  if (!event) return null;

  const stmt = db.prepare("DELETE FROM events WHERE id = ?");
  const info = stmt.run(id);
  if (info.changes > 0) {
    return { id, user_id: event.user_id };
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

// Validate event data
export function validate(event) {
  const { title, date } = event;
  return Boolean(title?.trim() && date?.trim());
}

// Register to an event
export function register(userId, eventId) {
  const id = Math.random().toString(36).substring(2);
  const stmt = db.prepare(
    "INSERT INTO registrations (id, user_id, event_id) VALUES (?, ?, ?)"
  );
  const info = stmt.run(id, userId, eventId);

  return { id, userId, eventId };
}

// Unregister from an event
export function unregister(userId, eventId) {
  const stmt = db.prepare(
    "DELETE FROM registrations WHERE user_id = ? AND event_id = ?"
  );
  const info = stmt.run(userId, eventId);
  if (info.changes > 0) {
    return { userId, eventId };
  }
  return null;
}
