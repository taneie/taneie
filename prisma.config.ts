import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://freelink:freelink@localhost:5432/freelink?schema=public";

export default defineConfig({
  schema: "Backend/prisma/schema.prisma",
  migrations: {
    path: "Backend/prisma/migrations",
    seed: "tsx Backend/prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
