import type { Express } from "express";
import type { JobService } from "../../../application/services.js";
import {
  asyncHandler,
  requireAuth,
  requireRole,
  validateBody,
  type AuthedRequest,
} from "../middleware.js";
import {
  createJobSchema,
  listJobsQuerySchema,
  listScoutableJobsQuerySchema,
  updateJobFlagsSchema,
} from "../schemas.js";
import { routeParam } from "./helpers.js";

export function registerJobRoutes(app: Express, jobService: JobService) {
  app.get(
    "/api/jobs/scoutable/:freelancerProfileId",
    requireAuth,
    requireRole("sales"),
    asyncHandler<AuthedRequest>(async (req, res) => {
      const query = listScoutableJobsQuerySchema.parse(req.query);
      res.json(
        await jobService.listScoutableForFreelancer(
          req.auth!,
          routeParam(req.params.freelancerProfileId),
          query,
        ),
      );
    }),
  );

  app.get(
    "/api/jobs",
    requireAuth,
    asyncHandler<AuthedRequest>(async (req, res) => {
      const query = listJobsQuerySchema.parse(req.query);
      res.json(await jobService.list(req.auth, query));
    }),
  );

  app.post(
    "/api/jobs",
    requireAuth,
    requireRole("sales"),
    validateBody(createJobSchema),
    asyncHandler<AuthedRequest>(async (req, res) => {
      res.status(201).json(await jobService.create(req.body, req.auth!.userId));
    }),
  );

  app.patch(
    "/api/jobs/:id",
    requireAuth,
    requireRole("sales"),
    validateBody(updateJobFlagsSchema),
    asyncHandler(async (req, res) => {
      res.json(
        await jobService.updateFlags(routeParam(req.params.id), req.body),
      );
    }),
  );
}
