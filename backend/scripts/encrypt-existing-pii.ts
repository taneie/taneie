import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  decryptText,
  encryptText,
  piiHash,
} from "../src/infrastructure/crypto.js";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://frichy:frichy@localhost:5432/frichy?schema=public";
const prisma = new PrismaClient({ adapter: new PrismaPg(databaseUrl) });

async function encryptUsers() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    const email = decryptText(user.email);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: encryptText(decryptText(user.name)),
        email: encryptText(email),
        emailHash: piiHash(email),
        phone: user.phone ? encryptText(decryptText(user.phone)) : null,
      },
    });
  }
}

async function encryptResumes() {
  const resumes = await prisma.resume.findMany();
  for (const resume of resumes) {
    await prisma.resume.update({
      where: { id: resume.id },
      data: {
        originalFilename: encryptText(decryptText(resume.originalFilename)),
      },
    });
  }
}

async function encryptMessages() {
  const messages = await prisma.message.findMany();
  for (const message of messages) {
    await prisma.message.update({
      where: { id: message.id },
      data: { body: encryptText(decryptText(message.body)) },
    });
  }
}

async function encryptPrivacyConsents() {
  const consents = await prisma.privacyPolicyConsent.findMany();
  for (const consent of consents) {
    await prisma.privacyPolicyConsent.update({
      where: { id: consent.id },
      data: {
        ipAddress: consent.ipAddress
          ? encryptText(decryptText(consent.ipAddress))
          : null,
        userAgent: consent.userAgent
          ? encryptText(decryptText(consent.userAgent))
          : null,
      },
    });
  }
}

async function encryptPushSubscriptions() {
  const subscriptions = await prisma.pushSubscription.findMany();
  for (const subscription of subscriptions) {
    const endpoint = decryptText(subscription.endpoint);
    await prisma.pushSubscription.update({
      where: { id: subscription.id },
      data: {
        endpoint: encryptText(endpoint),
        endpointHash: piiHash(endpoint),
        p256dh: encryptText(decryptText(subscription.p256dh)),
        auth: encryptText(decryptText(subscription.auth)),
        userAgent: subscription.userAgent
          ? encryptText(decryptText(subscription.userAgent))
          : null,
      },
    });
  }
}

async function main() {
  await encryptUsers();
  await encryptResumes();
  await encryptMessages();
  await encryptPrivacyConsents();
  await encryptPushSubscriptions();
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
