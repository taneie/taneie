import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "./config.js";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://tryangle:tryangle@localhost:5432/tryangle_freelance?schema=public";

export const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

export async function closePrisma() {
  await prisma.$disconnect();
}
