import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { getDb } from './db';

const secret = process.env.BETTER_AUTH_SECRET;

export const auth = betterAuth({
  secret,
  database: getDb(),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()], 
});