import express from "express";
import usersRoutes from "./routes/users.js";

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Routes
app.use("/users", usersRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
