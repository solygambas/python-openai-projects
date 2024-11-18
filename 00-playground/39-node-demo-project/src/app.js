import express from "express";
// import indexController from "./controllers/index.js";
import tablesRoutes from "./routes/tables.js";

const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes setup
// app.use("/", indexController);
app.use("/tables", tablesRoutes);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
