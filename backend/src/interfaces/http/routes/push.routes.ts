import type { Express } from "express";
import { getWebPushPublicKey } from "../../../infrastructure/push.js";
import type { PushSubscriptionService } from "../../../application/services.js";
import {
  asyncHandler,
  requireAuth,
  validateBody,
  type AuthedRequest,
} from "../middleware.js";
import { pushSubscriptionSchema } from "../schemas.js";

export function registerPushRoutes(
  app: Express,
  pushSubscriptionService: PushSubscriptionService,
) {
  app.get("/api/push/public-key", (_req, res) => {
    res.json({ publicKey: getWebPushPublicKey() });
  });

  app.post(
    "/api/push/subscriptions",
    requireAuth,
    validateBody(pushSubscriptionSchema),
    asyncHandler<AuthedRequest>(async (req, res) => {
      const result = await pushSubscriptionService.upsert(
        req.auth!.userId,
        req.body,
        req.headers["user-agent"]?.toString(),
      );
      res.status(201).json(result);
    }),
  );

  app.delete(
    "/api/push/subscriptions",
    requireAuth,
    validateBody(pushSubscriptionSchema),
    asyncHandler<AuthedRequest>(async (req, res) => {
      await pushSubscriptionService.delete(req.auth!.userId, req.body);
      res.status(204).send();
    }),
  );
}
