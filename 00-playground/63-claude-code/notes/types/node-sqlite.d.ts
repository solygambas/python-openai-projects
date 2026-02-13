declare module 'node:sqlite' {
  export interface StatementSync {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown | undefined;
    run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
  }

  export interface DatabaseSync {
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
  }

  const DatabaseSync: {
    new (filename: string, options?: unknown): DatabaseSync;
  };

  export { DatabaseSync };
}

export {};
