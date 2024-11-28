import express from "express";
import {
  createEvent,
  editEvent,
  deleteEvent,
  getAllEvents,
  getEventById,
} from "../controllers/events-controller.js";

const router = express.Router();

// Create a new event
router.post("/", createEvent);

// Get all events
router.get("/", getAllEvents);

// Get event by ID
router.get("/:id", getEventById);

// Edit an event by ID
router.put("/:id", editEvent);

// Delete an event by ID
router.delete("/:id", deleteEvent);

export default router;
