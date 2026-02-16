import { requireAuth } from '@/lib/auth-helpers';
import NoteForm from '@/app/components/NoteForm';

export const metadata = {
  title: 'Create New Note | NextNotes',
  description: 'Create a new note with rich text formatting',
};

export default async function NewNotePage() {
  // Protect this page - redirect to login if not authenticated
  await requireAuth();

  return (
    <main className="bg-white dark:bg-gray-950">
      <NoteForm />
    </main>
  );
}
