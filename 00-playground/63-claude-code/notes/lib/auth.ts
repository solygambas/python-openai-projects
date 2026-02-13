import { betterAuth } from 'better-auth';
import { getDb } from './db';

export const auth = betterAuth({
  database: getDb() as Parameters<typeof betterAuth>[0]['database'],
  emailAndPassword: {
    enabled: true,
  },
});