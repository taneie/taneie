import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError, type ZodSchema } from "zod";
import { AppError, type AuthContext } from "../../domain/types.js";
import { prisma } from "../../infrastructure/prisma.js";
import { verifyToken } from "../../infrastructure/security.js";

export interface AuthedRequest extends Request {
  auth?: AuthContext;
}

export function asyncHandler<T extends Request = Request>(
  handler: (req: T, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: T, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new AppError(400, "入力内容を確認してください。", "VALIDATION_ERROR"));
      return;
    }
    req.body = result.data;
    next();
  };
}

export async function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const [, token] = (req.headers.authorization || "").split(" ");
    if (!token) throw new AppError(401, "ログインが必要です。", "AUTH_REQUIRED");

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) throw new AppError(401, "ログインが必要です。", "AUTH_REQUIRED");

    req.auth = { userId: user.id, role: user.role, email: user.email };
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, "ログインが必要です。", "AUTH_REQUIRED"));
  }
}

export function requireRole(...roles: AuthContext["role"][]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      next(new AppError(401, "ログインが必要です。", "AUTH_REQUIRED"));
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(new AppError(403, "この操作を行う権限がありません。", "FORBIDDEN"));
      return;
    }
    next();
  };
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "入力内容を確認してください。" } });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "対象データが見つかりません。" } });
      return;
    }
    if (error.code === "P2002") {
      res.status(409).json({ error: { code: "UNIQUE_CONSTRAINT", message: "すでに登録されています。" } });
      return;
    }
  }

  console.error(error);
  res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message: "サーバーエラーが発生しました。" } });
}
