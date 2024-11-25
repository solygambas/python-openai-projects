import express from "express";
import tablesRoutes from "./routes/tables.js";
import userRoutes from "./routes/users.js";
import { authenticateToken } from "./middleware/auth.js";
import { initializeDatabase } from "./config/database.js";

const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize database
initializeDatabase().catch((error) => {
  console.error("Failed to initialize database:", error);
  process.exit(1);
});

// Routes setup
app.use("/users", userRoutes);
// Protect tables routes with authentication
app.use("/tables", authenticateToken, tablesRoutes);

// Serve static files from public folder
app.use(express.static("public"));

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
