import { betterAuth } from 'better-auth';
import { getDb } from './db';

export const auth = betterAuth({
  database: getDb(),
  emailAndPassword: {
    enabled: true,
  },
});