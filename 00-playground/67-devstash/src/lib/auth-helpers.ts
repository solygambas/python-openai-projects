import { auth } from "@/auth";

/**
 * Require authentication and return the user ID
 * @returns The user ID if authenticated, or throws an error
 * @throws Error if not authenticated
 */
export async function requireAuth(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

/**
 * Check authentication and return a result object
 * Useful for server actions that need to return error objects
 * @returns The user ID if authenticated, or an error object
 */
export async function checkAuth(): Promise<
  { success: true; userId: string } | { success: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }
  return { success: true, userId: session.user.id };
}
