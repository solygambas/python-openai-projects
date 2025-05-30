import express from "express";
import cors from "cors";
import usersRoutes from "./routes/users.js";
import eventsRoutes from "./routes/events.js";
import { initDb } from "./database.js";

const app = express();
const port = process.env.PORT || 3000;

// Middleware to enable CORS
app.use(cors());
// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static("public"));

// Routes
app.use("/users", usersRoutes);
app.use("/events", eventsRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  // Initialize database
  try {
    initDb();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
});
