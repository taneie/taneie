import type { Express } from "express";
import type { ProfileService } from "../../../application/services.js";
import { AppError } from "../../../domain/types.js";
import {
  asyncHandler,
  requireAuth,
  requireRole,
  validateBody,
  type AuthedRequest,
} from "../middleware.js";
import { updateProfileSchema } from "../schemas.js";

export function registerProfileRoutes(
  app: Express,
  profileService: ProfileService,
) {
  app.get(
    "/api/freelancers",
    requireAuth,
    requireRole("sales"),
    asyncHandler(async (_req, res) => {
      res.json(await profileService.listFreelancers());
    }),
  );

  app.get(
    "/api/profile/me",
    requireAuth,
    requireRole("freelancer"),
    asyncHandler<AuthedRequest>(async (req, res) => {
      const profile = await profileService.getCurrent(req.auth!.userId);
      if (!profile)
        throw new AppError(
          404,
          "プロフィールが見つかりません。",
          "PROFILE_NOT_FOUND",
        );
      res.json(profile);
    }),
  );

  app.put(
    "/api/profile/me",
    requireAuth,
    requireRole("freelancer"),
    validateBody(updateProfileSchema),
    asyncHandler<AuthedRequest>(async (req, res) => {
      res.json(await profileService.updateCurrent(req.auth!.userId, req.body));
    }),
  );
}
