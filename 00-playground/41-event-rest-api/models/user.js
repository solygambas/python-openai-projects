// Helper function to create a new user object
export function createUser({ email, password }) {
  return {
    id: Math.random().toString(36).substring(2), // Simple ID generation
    email: email,
    password: password, // Note: In real app, this should be hashed
  };
}

// Helper function to validate user data
export function validateUser({ email, password }) {
  if (!email || !email.includes("@")) {
    throw new Error("Invalid email");
  }
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  return true;
}
