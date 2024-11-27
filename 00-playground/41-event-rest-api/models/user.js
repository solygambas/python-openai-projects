import bcrypt from "bcryptjs";
import { getDb } from "../database.js";

export async function createUser({ email, password }) {
  const id = Math.random().toString(36).substring(2);
  const db = getDb();

  // Hash password before storing
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  const stmt = db.prepare(
    "INSERT INTO users (id, email, password) VALUES (?, ?, ?)"
  );
  stmt.run(id, email, hashedPassword);

  return {
    id,
    email,
    password: hashedPassword,
  };
}

export async function verifyUserCredentials({ email, password }) {
  const user = findUserByEmail(email);
  if (!user) {
    return null;
  }
  const passwordIsValid = await bcrypt.compare(password, user.password);
  return passwordIsValid ? user : null;
}

export function validateUser({ email, password }) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !email.trim() || !emailRegex.test(email)) {
    throw new Error("Invalid email");
  }
  if (!password || !password.trim() || password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  return true;
}

export function findUserByEmail(email) {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
  return stmt.get(email);
}

export function findUserById(id) {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
  return stmt.get(id);
}
