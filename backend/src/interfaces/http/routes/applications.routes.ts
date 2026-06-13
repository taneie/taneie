import type { Express } from "express";
import type { ApplicationService } from "../../../application/services.js";
import {
  asyncHandler,
  requireAuth,
  requireRole,
  validateBody,
  type AuthedRequest,
} from "../middleware.js";
import { applySchema, changeApplicationStatusSchema } from "../schemas.js";
import { routeParam } from "./helpers.js";

export function registerApplicationRoutes(
  app: Express,
  applicationService: ApplicationService,
) {
  app.get(
    "/api/applications",
    requireAuth,
    asyncHandler<AuthedRequest>(async (req, res) => {
      res.json(await applicationService.list(req.auth!));
    }),
  );

  app.post(
    "/api/applications",
    requireAuth,
    requireRole("freelancer"),
    validateBody(applySchema),
    asyncHandler<AuthedRequest>(async (req, res) => {
      res
        .status(201)
        .json(await applicationService.apply(req.body.jobId, req.auth!.userId));
    }),
  );

  app.patch(
    "/api/applications/:id/status",
    requireAuth,
    requireRole("sales"),
    validateBody(changeApplicationStatusSchema),
    asyncHandler<AuthedRequest>(async (req, res) => {
      res.json(
        await applicationService.changeStatus(
          routeParam(req.params.id),
          req.body.status,
          req.auth!.userId,
          req.body.note,
        ),
      );
    }),
  );
}
