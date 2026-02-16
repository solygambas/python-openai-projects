export async function createOrUpdateNote(args: {
  noteId?: string;
  title: string;
  content: unknown;
}) {
  const { noteId, title, content } = args;
  const isEdit = typeof noteId === "string";
  const url = isEdit ? `/api/notes/${noteId}` : "/api/notes";
  const method = isEdit ? "PUT" : "POST";

  const resp = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });

  return resp;
}
