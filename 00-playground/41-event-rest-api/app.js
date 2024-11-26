import express from "express";
import usersRoutes from "./routes/users.js";
import { initDb } from "./database.js";

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Routes
app.use("/users", usersRoutes);

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
