import express, { type Express } from "express";
import { handleUpload } from "@vercel/blob/client";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import type { ResumeService } from "../../../application/services.js";
import { AppError } from "../../../domain/types.js";
import { config, hasValidBlobReadWriteToken } from "../../../infrastructure/config.js";
import { verifyToken } from "../../../infrastructure/security.js";
import {
  asyncHandler,
  requireAuth,
  requireRole,
  validateBody,
  type AuthedRequest,
} from "../middleware.js";
import {
  resumeMetadataSchema,
  resumeUploadCompleteSchema,
  resumeUploadIntentSchema,
} from "../schemas.js";
import { routeParam } from "./helpers.js";

function readBearerToken(authorization: string | undefined) {
  const [scheme, token] = (authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new AppError(401, "ログインが必要です。", "AUTH_REQUIRED");
  }
  return token;
}

function readSingleHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function readPublicBaseUrl(req: express.Request) {
  const forwardedProto = readSingleHeader(req.headers["x-forwarded-proto"]);
  const forwardedHost = readSingleHeader(req.headers["x-forwarded-host"]);
  const proto = (forwardedProto || req.protocol || "http").split(",")[0].trim();
  const host = (forwardedHost || req.get("host") || "").split(",")[0].trim();

  return `${proto}://${host}`;
}

function readQueryString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function sendResumeFile(
  res: express.Response,
  file: Awaited<ReturnType<ResumeService["download"]>>,
  disposition: "attachment" | "inline",
) {
  res.setHeader("Content-Type", file.mimeType);
  res.setHeader("Content-Length", String(file.sizeBytes));
  res.setHeader(
    "Content-Disposition",
    `${disposition}; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
  );
  if (disposition === "inline") {
    res.setHeader("Cache-Control", "private, max-age=0, no-store");
  }
  const stream =
    file.stream instanceof Readable
      ? file.stream
      : Readable.fromWeb(
          file.stream as unknown as NodeReadableStream<Uint8Array>,
        );
  stream.pipe(res);
}

function decodeClientPayload(
  payload: string | undefined,
  encoding: string | undefined,
) {
  if (encoding !== "base64url" || !payload) return payload;

  try {
    return Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    throw new AppError(400, "アップロード情報が不正です。", "INVALID_UPLOAD");
  }
}

export function registerResumeRoutes(
  app: Express,
  resumeService: ResumeService,
) {
  app.post(
    "/api/resumes/upload-intent",
    requireAuth,
    requireRole("freelancer"),
    validateBody(resumeUploadIntentSchema),
    asyncHandler<AuthedRequest>(async (req, res) => {
      res
        .status(201)
        .json(await resumeService.createUploadIntent(req.auth!.userId, req.body));
    }),
  );

  app.post(
    "/api/resumes/blob-upload",
    asyncHandler(async (req, res) => {
      if (!hasValidBlobReadWriteToken()) {
        throw new AppError(
          503,
          "レジュメアップロード用のBlobトークンが未設定、またはダミー値です。",
          "BLOB_NOT_CONFIGURED",
        );
      }
      const jsonResponse = await handleUpload({
        request: req,
        body: req.body,
        token: config.blobReadWriteToken || undefined,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          const token = readBearerToken(req.headers.authorization);
          const auth = verifyToken(token);
          const payload = resumeService.parseBlobPayload(clientPayload);
          if (auth.userId !== payload.userId || auth.role !== "freelancer") {
            throw new AppError(403, "この操作を行う権限がありません。", "FORBIDDEN");
          }
          if (pathname !== payload.pathname) {
            throw new AppError(400, "アップロード情報が一致しません。", "INVALID_UPLOAD");
          }
          await resumeService.assertCanUploadResume(auth.userId);

          return {
            allowedContentTypes: payload.mimeType ? [payload.mimeType] : undefined,
            maximumSizeInBytes: config.resumeUploadMaxBytes,
            addRandomSuffix: false,
            allowOverwrite: false,
            tokenPayload: JSON.stringify(payload),
            callbackUrl: config.blobUploadCallbackUrl || undefined,
          };
        },
        onUploadCompleted: async ({ blob, tokenPayload }) => {
          const payload = resumeService.parseBlobPayload(tokenPayload);
          await resumeService.createLatestFromBlob(payload, blob);
        },
      });
      res.json(jsonResponse);
    }),
  );

  app.post(
    "/api/resumes/gcs-upload",
    requireAuth,
    requireRole("freelancer"),
    express.raw({ type: "*/*", limit: config.resumeUploadMaxBytes }),
    asyncHandler<AuthedRequest>(async (req, res) => {
      const clientPayload = decodeClientPayload(
        readSingleHeader(req.headers["x-client-payload"]),
        readSingleHeader(req.headers["x-client-payload-encoding"]),
      );
      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
      res
        .status(201)
        .json(await resumeService.uploadToGcs(req.auth!.userId, clientPayload, body));
    }),
  );

  app.post(
    "/api/resumes/complete",
    requireAuth,
    requireRole("freelancer"),
    validateBody(resumeUploadCompleteSchema),
    asyncHandler<AuthedRequest>(async (req, res) => {
      res
        .status(201)
        .json(await resumeService.completeClientUpload(req.auth!.userId, req.body));
    }),
  );

  app.delete(
    "/api/resumes/:resumeId",
    requireAuth,
    requireRole("freelancer"),
    asyncHandler<AuthedRequest>(async (req, res) => {
      res.json(
        await resumeService.deleteOwnResume(
          req.auth!.userId,
          routeParam(req.params.resumeId),
        ),
      );
    }),
  );

  app.get(
    "/api/resumes/freelancers/:freelancerId/preview",
    requireAuth,
    asyncHandler<AuthedRequest>(async (req, res) => {
      res.json(
        await resumeService.createPreview(
          req.auth!,
          routeParam(req.params.freelancerId),
          readPublicBaseUrl(req),
        ),
      );
    }),
  );

  app.get(
    "/api/resumes/freelancers/:freelancerId/view",
    asyncHandler(async (req, res) => {
      const file = await resumeService.downloadWithPreviewToken(
        routeParam(req.params.freelancerId),
        readQueryString(req.query.token),
      );
      sendResumeFile(res, file, "inline");
    }),
  );

  app.get(
    "/api/resumes/freelancers/:freelancerId/download",
    requireAuth,
    asyncHandler<AuthedRequest>(async (req, res) => {
      const file = await resumeService.download(
        req.auth!,
        routeParam(req.params.freelancerId),
      );
      sendResumeFile(res, file, "attachment");
    }),
  );

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
