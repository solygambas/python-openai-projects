import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "abctesttoken";
const JWT_EXPIRES_IN = "1h";

export function generateJWT(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyJWT(token) {
  const decodedToken = jwt.verify(token, JWT_SECRET);
  return decodedToken;
}
