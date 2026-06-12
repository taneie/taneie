import webPush from "web-push";
import type { PrismaClient } from "@prisma/client";
import { config } from "./config.js";
import { decryptText } from "./crypto.js";

const pushEnabled = Boolean(
  config.webPushPublicKey && config.webPushPrivateKey,
);

if (pushEnabled) {
  webPush.setVapidDetails(
    config.webPushSubject,
    config.webPushPublicKey,
    config.webPushPrivateKey,
  );
}

export function getWebPushPublicKey() {
  return config.webPushPublicKey;
}

export async function notifyUser(
  db: PrismaClient,
  userId: string | null | undefined,
  payload: { title: string; body: string; url?: string; tag?: string },
) {
  if (!pushEnabled || !userId) return;

  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });
  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: decryptText(subscription.endpoint),
            keys: {
              p256dh: decryptText(subscription.p256dh),
              auth: decryptText(subscription.auth),
            },
          },
          JSON.stringify(payload),
        );
      } catch (error: unknown) {
        const statusCode =
          typeof error === "object" && error && "statusCode" in error
            ? Number((error as { statusCode?: number }).statusCode)
            : 0;
        if (statusCode === 404 || statusCode === 410) {
          await db.pushSubscription.deleteMany({
            where: { id: subscription.id },
          });
        }
      }
    }),
  );
}
