import express from "express";
import {
  createEvent,
  editEvent,
  deleteEvent,
  getAllEvents,
  getEventById,
  registerToEvent,
  unregisterFromEvent,
} from "../controllers/events-controller.js";
import { authenticateJWT } from "../util/auth.js";
import { upload } from "../util/upload.js";

const router = express.Router();

// Create a new event
router.post("/", authenticateJWT, upload.single("image"), createEvent);

// Get all events
router.get("/", getAllEvents);

// Get event by ID
router.get("/:id", getEventById);

// Edit an event by ID
router.put("/:id", authenticateJWT, upload.single("image"), editEvent);

// Delete an event by ID
router.delete("/:id", authenticateJWT, deleteEvent);

// Register to an event
router.post("/:id/register", authenticateJWT, registerToEvent);

// Unregister from an event
router.delete("/:id/unregister", authenticateJWT, unregisterFromEvent);

export default router;
