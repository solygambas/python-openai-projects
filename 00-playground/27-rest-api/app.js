// Import dependencies
const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const Joi = require("joi");
const fs = require("fs");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();
const port = 3000;

// Middleware for parsing JSON request bodies
app.use(bodyParser.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
});

// Load meetups data from meetups.json file
let meetups = [];
try {
  const data = fs.readFileSync("meetups.json");
  meetups = JSON.parse(data);
} catch (error) {
  console.error("Error reading meetups.json:", error);
}

// Load users data from users.json file
let users = [];
try {
  const data = fs.readFileSync("users.json");
  users = JSON.parse(data);
} catch (error) {
  console.error("Error reading users.json:", error);
}

// Routes
app.get("/meetups", (req, res) => {
  // Remove private user information from meetups before sending the response
  const sanitizedMeetups = meetups.map((meetup) => {
    const { id, title, summary, address } = meetup;
    return { id, title, summary, address };
  });

  res.json(sanitizedMeetups);
});

app.post("/meetups", authenticateToken, (req, res) => {
  // Validate incoming data using Joi
  const schema = Joi.object({
    title: Joi.string().required(),
    summary: Joi.string().required(),
    address: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const newMeetup = {
    id: crypto.randomUUID(),
    title: value.title,
    summary: value.summary,
    address: value.address,
  };

  meetups.push(newMeetup);
  saveMeetups();

  res.status(201).json(newMeetup);
});

app.patch("/meetups/:id", authenticateToken, (req, res) => {
  const id = req.params.id;
  const meetup = meetups.find((m) => m.id === id);

  if (!meetup) {
    return res.status(404).json({ error: "Meetup not found" });
  }

  // Validate incoming data using Joi
  const schema = Joi.object({
    title: Joi.string(),
    summary: Joi.string(),
    address: Joi.string(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  meetup.title = value.title || meetup.title;
  meetup.summary = value.summary || meetup.summary;
  meetup.address = value.address || meetup.address;

  saveMeetups();

  res.json(meetup);
});

app.delete("/meetups/:id", authenticateToken, (req, res) => {
  const id = req.params.id;
  const meetupIndex = meetups.findIndex((m) => m.id === id);

  if (meetupIndex === -1) {
    return res.status(404).json({ error: "Meetup not found" });
  }

  const deletedMeetup = meetups.splice(meetupIndex, 1)[0];
  saveMeetups();

  res.json(deletedMeetup);
});

app.post("/signup", (req, res) => {
  const { username, password } = req.body;

  // Check if the username is already taken
  if (users.find((user) => user.username === username)) {
    return res.status(400).json({ error: "Username already taken" });
  }

  // Hash the password
  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = {
    id: crypto.randomUUID(),
    username,
    password: hashedPassword,
  };

  users.push(newUser);
  saveUsers();

  res.sendStatus(200);
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ username: user.username }, process.env.SECRET_KEY);
  res.json({ token });
});

// Function to save meetups data to meetups.json file
function saveMeetups() {
  fs.writeFileSync("meetups.json", JSON.stringify(meetups, null, 2));
}

// Function to save users data to users.json file
function saveUsers() {
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
}

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
