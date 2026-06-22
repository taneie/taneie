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
import {
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  registerSchema,
} from "../schemas.js";

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

  app.post(
    "/api/auth/password-reset/request",
    validateBody(passwordResetRequestSchema),
    asyncHandler(async (req, res) => {
      const result = await authService.requestPasswordReset(req.body.email);
      res.json({
        message:
          "登録済みのメールアドレスの場合、パスワード再設定の案内を送信しました。",
        resetToken:
          process.env.NODE_ENV === "production" || !result.issued
            ? undefined
            : result.token,
        expiresAt:
          process.env.NODE_ENV === "production" || !result.issued
            ? undefined
            : result.expiresAt,
      });
    }),
  );

  app.post(
    "/api/auth/password-reset/confirm",
    validateBody(passwordResetConfirmSchema),
    asyncHandler(async (req, res) => {
      await authService.resetPassword(req.body.token, req.body.password);
      res.json({ message: "パスワードを再設定しました。" });
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
