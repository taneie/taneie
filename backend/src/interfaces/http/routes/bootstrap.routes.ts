import type { Express } from "express";
import type { CatalogService } from "../../../application/services.js";
import { asyncHandler, requireAuth, type AuthedRequest } from "../middleware.js";

export function registerBootstrapRoutes(
  app: Express,
  catalogService: CatalogService,
) {
  app.get(
    "/api/bootstrap",
    requireAuth,
    asyncHandler<AuthedRequest>(async (req, res) => {
      res.json(await catalogService.bootstrap(req.auth!));
    }),
  );
}
