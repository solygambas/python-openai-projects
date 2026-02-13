import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient();

// Export convenience methods
export const { signIn, signUp, signOut, useSession } = authClient;