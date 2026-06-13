import type { PrismaClient } from "@prisma/client";
import { encryptText, piiHash } from "../../infrastructure/crypto.js";
import type { PushSubscriptionInput } from "./shared.js";

export class PushSubscriptionService {
  constructor(private readonly db: PrismaClient) {}

  async upsert(userId: string, input: PushSubscriptionInput, userAgent?: string) {
    const endpointHash = piiHash(input.endpoint);
    const data = {
      userId,
      endpoint: encryptText(input.endpoint),
      endpointHash,
      p256dh: encryptText(input.keys.p256dh),
      auth: encryptText(input.keys.auth),
      userAgent: userAgent ? encryptText(userAgent) : null,
    };
    const existing = await this.db.pushSubscription.findFirst({
      where: {
        OR: [{ endpointHash }, { endpoint: input.endpoint }],
      },
    });
    const subscription = existing
      ? await this.db.pushSubscription.update({
          where: { id: existing.id },
          data,
        })
      : await this.db.pushSubscription.create({
          data,
        });
    return { id: subscription.id };
  }

  async delete(userId: string, input: PushSubscriptionInput) {
    await this.db.pushSubscription.deleteMany({
      where: {
        userId,
        OR: [
          { endpointHash: piiHash(input.endpoint) },
          { endpoint: input.endpoint },
        ],
      },
    });
  }
}
