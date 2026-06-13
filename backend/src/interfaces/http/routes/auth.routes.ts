import type { Express } from "express";
import { config } from "../../../infrastructure/config.js";
import { AppError } from "../../../domain/types.js";
import type { AuthService } from "../../../application/services.js";
import {
  asyncHandler,
  requireAuth,
  validateBody,
  type AuthedRequest,
} from "../middleware.js";
import { loginSchema, registerSchema } from "../schemas.js";

export function registerAuthRoutes(app: Express, authService: AuthService) {
  app.post(
    "/api/auth/register",
    validateBody(registerSchema),
    asyncHandler(async (req, res) => {
      const result = await authService.register({
        ...req.body,
        policyVersion: config.privacyPolicyVersion,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]?.toString(),
      });
      res.status(201).json(result);
    }),
  );

  app.post(
    "/api/auth/login",
    validateBody(loginSchema),
    asyncHandler(async (req, res) => {
      const result = await authService.login(req.body.email, req.body.password);
      if (!result)
        throw new AppError(
          401,
          "メールアドレスまたはパスワードが違います。",
          "INVALID_CREDENTIALS",
        );
      res.json(result);
    }),
  );

  app.get(
    "/api/auth/me",
    requireAuth,
    asyncHandler<AuthedRequest>(async (req, res) => {
      res.json(await authService.getCurrentUser(req.auth!.userId));
    }),
  );
}
