import { requireAuth } from '@/lib/auth-helpers';

export default async function Dashboard() {
  const session = await requireAuth();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-6 space-y-4 text-gray-600">
        <p>
          <strong>Welcome,</strong> {session.user.name || session.user.email}
        </p>
      </div>
    </main>
  );
}