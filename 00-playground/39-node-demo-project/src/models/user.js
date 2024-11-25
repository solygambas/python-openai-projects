import bcrypt from "bcrypt";
import { dbPromise } from "../config/database.js";

export class User {
  static async create(email, password) {
    const db = await dbPromise;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const result = await db.run(
        "INSERT INTO users (email, password) VALUES (?, ?)",
        [email, hashedPassword]
      );
      return { id: result.lastID, email };
    } catch (error) {
      if (error.message.includes("UNIQUE constraint failed")) {
        throw new Error("Email already exists");
      }
      throw error;
    }
  }

  static async findByEmail(email) {
    const db = await dbPromise;
    return db.get("SELECT * FROM users WHERE email = ?", [email]);
  }
}
