export function makeNoteRow(overrides = {}) {
  return Object.assign(
    {
      id: "n1",
      user_id: "u1",
      title: "Title",
      content: "{}",
      is_public: 0,
      public_slug: null,
      created_at: "2020-01-01",
      updated_at: "2020-01-02",
    },
    overrides
  );
}

export function makeNoteListRow(overrides = {}) {
  return Object.assign(
    {
      id: "n1",
      title: "Title",
      is_public: 0,
      public_slug: null,
      created_at: "2020-01-01",
      updated_at: "2020-01-02",
    },
    overrides
  );
}
