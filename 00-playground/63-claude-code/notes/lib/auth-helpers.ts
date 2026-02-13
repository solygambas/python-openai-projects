import { auth } from './auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Get the current session on the server side.
 * Returns null if user is not authenticated.
 * 
 * Usage in server components:
 * const session = await getSession();
 * if (!session) return <div>Not authenticated</div>;
 */
export async function getSession() {
  const headersList = await headers();
  return auth.api.getSession({
    headers: headersList,
  });
}

/**
 * Require authentication for a page or route.
 * Automatically redirects to /authenticate if not logged in.
 * 
 * Usage in protected pages:
 * export default async function DashboardPage() {
 *   const session = await requireAuth();
 *   return <div>Welcome {session.user.name}</div>;
 * }
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect('/authenticate');
  }
  return session;
}

/**
 * Get session from a Request object (for API routes).
 * Returns null if user is not authenticated.
 * 
 * Usage in API route handlers:
 * export async function GET(req: Request) {
 *   const session = await getSessionFromRequest(req);
 *   if (!session) {
 *     return new Response('Unauthorized', { status: 401 });
 *   }
 *   // Use session.user.id
 * }
 */
export async function getSessionFromRequest(req: Request) {
  const headersList = new Headers(req.headers);
  return auth.api.getSession({
    headers: headersList,
  });
}
