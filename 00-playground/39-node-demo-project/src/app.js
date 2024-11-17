const express = require("express");
const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes setup
const indexController = require("./controllers/index");
app.use("/", indexController);

const tablesRoutes = require("./routes/tables");
app.use("/api", tablesRoutes);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
