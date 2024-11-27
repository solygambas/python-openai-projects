import {
  createUser,
  validateUser,
  verifyUserCredentials,
} from "../models/user.js";

// In-memory storage for users (temporary solution)
const users = [];

export async function signup(req, res) {
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
    const newUser = await createUser({ email, password });
    users.push(newUser);

    res.status(201).json({ message: "User created", userId: newUser.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim() || !password || !password.trim()) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Verify user credentials
    const user = await verifyUserCredentials({ email, password });
    if (!user) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    res.json({ message: "Login successful", userId: user.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
