import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { timingSafeEqual } from "node:crypto";
import { ZodError, type ZodSchema } from "zod";
import { AppError, type AuthContext } from "../../domain/types.js";
import { config } from "../../infrastructure/config.js";
import { prisma } from "../../infrastructure/prisma.js";
import { verifyToken } from "../../infrastructure/security.js";
import { decryptText } from "../../infrastructure/crypto.js";

export interface AuthedRequest extends Request {
  auth?: AuthContext;
}

export function asyncHandler<T extends Request = Request>(
  handler: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: T, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        new AppError(400, "入力内容を確認してください。", "VALIDATION_ERROR"),
      );
      return;
    }
    req.body = result.data;
    next();
  };
}

export function requireBasicAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const username = config.basicAuthUser;
  const password = config.basicAuthPassword;
  if (!username || !password) {
    next();
    return;
  }

  const authorization = req.headers.authorization || "";
  if (authorization.startsWith("Bearer ")) {
    next();
    return;
  }

  if (isValidBasicAuthHeader(authorization, username, password)) {
    next();
    return;
  }

  res.setHeader("WWW-Authenticate", 'Basic realm="Frichy", charset="UTF-8"');
  res.status(401).send("Authentication required");
}

export function isValidBasicAuthHeader(
  authorization: string,
  username: string,
  password: string,
) {
  const [scheme, credentials] = authorization.split(" ");
  if (scheme !== "Basic" || !credentials) return false;

  const decoded = Buffer.from(credentials, "base64").toString("utf8");
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex < 0) return false;

  const inputUsername = decoded.slice(0, separatorIndex);
  const inputPassword = decoded.slice(separatorIndex + 1);
  return (
    safeEquals(inputUsername, username) &&
    safeEquals(inputPassword, password)
  );
}

function safeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export async function requireAuth(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
) {
  try {
    const [, token] = (req.headers.authorization || "").split(" ");
    if (!token)
      throw new AppError(401, "ログインが必要です。", "AUTH_REQUIRED");

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user || !user.isActive)
      throw new AppError(401, "ログインが必要です。", "AUTH_REQUIRED");

    req.auth = {
      userId: user.id,
      role: user.role,
      email: decryptText(user.email),
    };
    next();
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(401, "ログインが必要です。", "AUTH_REQUIRED"),
    );
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

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    res
      .status(error.statusCode)
      .json({ error: { code: error.code, message: error.message } });
    return;
  }

  if (error instanceof ZodError) {
    res
      .status(400)
      .json({
        error: {
          code: "VALIDATION_ERROR",
          message: "入力内容を確認してください。",
        },
      });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      res
        .status(404)
        .json({
          error: { code: "NOT_FOUND", message: "対象データが見つかりません。" },
        });
      return;
    }
    if (error.code === "P2002") {
      res
        .status(409)
        .json({
          error: {
            code: "UNIQUE_CONSTRAINT",
            message: "すでに登録されています。",
          },
        });
      return;
    }
  }

  console.error(error);
  res
    .status(500)
    .json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "サーバーエラーが発生しました。",
      },
    });
}
