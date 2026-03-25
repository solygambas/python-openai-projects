import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --experimental-strip-types --env-file=.env prisma/seed.ts",
  },
  datasource: {
    // In Prisma 7, the 'url' in prisma.config.ts is what the CLI (migrations) uses.
    // For Neon/Poolers, this should be the DIRECT_URL.
    url: process.env.DIRECT_URL ? env("DIRECT_URL") : env("DATABASE_URL"),
  },
});
