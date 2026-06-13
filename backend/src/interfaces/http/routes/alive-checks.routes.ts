import type { Express } from "express";
import type { CommunicationService } from "../../../application/services.js";
import {
  asyncHandler,
  requireAuth,
  requireRole,
  type AuthedRequest,
} from "../middleware.js";

export function registerAliveCheckRoutes(
  app: Express,
  communicationService: CommunicationService,
) {
  app.post(
    "/api/alive-checks",
    requireAuth,
    requireRole("sales"),
    asyncHandler<AuthedRequest>(async (req, res) => {
      res
        .status(201)
        .json(await communicationService.createAliveCheck(req.auth!.userId));
    }),
  );
}
