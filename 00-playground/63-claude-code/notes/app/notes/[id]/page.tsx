import { requireAuth } from '@/lib/auth-helpers';

export default async function NotePage() {
  const session = await requireAuth();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Note Editor</h1>
      <p className="text-gray-600 mt-2">Coming soon...</p>
    </main>
  );
}