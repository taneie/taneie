import type { Express } from "express";
import type { ResumeService } from "../../../application/services.js";
import {
  asyncHandler,
  requireAuth,
  requireRole,
  validateBody,
  type AuthedRequest,
} from "../middleware.js";
import { resumeMetadataSchema } from "../schemas.js";

export function registerResumeRoutes(
  app: Express,
  resumeService: ResumeService,
) {
  app.post(
    "/api/resumes",
    requireAuth,
    requireRole("freelancer"),
    validateBody(resumeMetadataSchema),
    asyncHandler<AuthedRequest>(async (req, res) => {
      res.status(201).json(await resumeService.createLatest(req.auth!.userId, req.body));
    }),
  );
}
