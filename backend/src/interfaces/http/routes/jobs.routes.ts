import type { Express, NextFunction, Response } from "express";
import type { JobService } from "../../../application/services.js";
import { config } from "../../../infrastructure/config.js";
import {
  asyncHandler,
  requireAuth,
  requireRole,
  validateBody,
  type AuthedRequest,
} from "../middleware.js";
import {
  createJobSchema,
  importExternalJobsQuerySchema,
  listJobsQuerySchema,
  listScoutableJobsQuerySchema,
  updateJobFlagsSchema,
} from "../schemas.js";
import { routeParam } from "./helpers.js";

export function registerJobRoutes(app: Express, jobService: JobService) {
  app.post(
    "/api/jobs/import/external",
    requireSalesOrSecret("X-Job-Import-Secret", () =>
      config.externalProjectsImportSecret.trim(),
    ),
    asyncHandler<AuthedRequest>(async (req, res) => {
      const query = importExternalJobsQuerySchema.parse(req.query);
      res.json(
        await jobService.importExternalProjects(
          req.auth?.userId,
          query.limit,
          query.onlyNew,
        ),
      );
    }),
  );

  app.post(
    "/api/jobs/cleanup-expired",
    requireSalesOrSecret("X-Job-Cleanup-Secret", () =>
      config.jobCleanupSecret.trim(),
    ),
    asyncHandler(async (_req, res) => {
      res.json(await jobService.cleanupExpiredJobs());
    }),
  );

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

  app.get(
    "/api/jobs/:id",
    requireAuth,
    asyncHandler<AuthedRequest>(async (req, res) => {
      res.json(await jobService.getById(req.auth, routeParam(req.params.id)));
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

function requireSalesOrSecret(
  headerName: string,
  getSecret: () => string,
) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const secret = getSecret();
    const requestSecret = req.get(headerName)?.trim();
    if (secret && requestSecret === secret) {
      next();
      return;
    }

    requireAuth(req, res, (authError) => {
      if (authError) {
        next(authError);
        return;
      }
      requireRole("sales")(req, res, next);
    });
  };
}
