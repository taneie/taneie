import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "./config.js";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://frichy:frichy@localhost:5432/frichy?schema=public";

export const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
  log: process.env.NODE_ENV === "development" ? ["warn"] : [],
});

export async function closePrisma() {
  await prisma.$disconnect();
}
