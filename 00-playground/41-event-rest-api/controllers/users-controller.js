import { createUser, validateUser } from "../models/user.js";

// In-memory storage for users (temporary solution)
const users = [];

export function signup(req, res) {
  try {
    const { email, password } = req.body;

    // Validate user input
    validateUser({ email, password });

    // Check if user already exists
    const existingUser = users.find((user) => user.email === email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const newUser = createUser({ email, password });
    users.push(newUser);

    res.status(201).json({ message: "User created", userId: newUser.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export function login(req, res) {
  try {
    const { email, password } = req.body;

    // Find user
    const user = users.find((user) => user.email === email);
    if (!user) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    // Check password
    if (user.password !== password) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    res.json({ message: "Login successful", userId: user.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
