import {
  get,
  head,
  issueSignedToken,
  presignUrl,
  type PutBlobResult,
} from "@vercel/blob";
import { Storage } from "@google-cloud/storage";
import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import mammoth from "mammoth";
import sanitizeHtml from "sanitize-html";
import * as XLSX from "xlsx";
import { AppError, type AuthContext } from "../../domain/types.js";
import {
  config,
  hasValidBlobReadWriteToken,
  usesGcsResumeStorage,
} from "../../infrastructure/config.js";
import { decryptText, encryptText } from "../../infrastructure/crypto.js";
import type {
  ResumeBlobPayload,
  ResumeMetadataInput,
  ResumeUploadCompleteInput,
  ResumeUploadIntentInput,
  ResumeUploadIntentResult,
} from "./shared.js";

export const RESUME_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

const mimeTypeExtensionMap: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
};

const extensionMimeTypeMap: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const storage = new Storage();

export class ResumeService {
  constructor(private readonly db: PrismaClient) {}

  async createLatest(userId: string, input: ResumeMetadataInput) {
    const profile = await this.db.freelancerProfile.findUniqueOrThrow({
      where: { userId },
    });
    await this.db.resume.updateMany({
      where: { freelancerProfileId: profile.id },
      data: { isLatest: false },
    });
    return this.db.resume.create({
      data: {
        ...input,
        originalFilename: encryptText(input.originalFilename),
        freelancerProfileId: profile.id,
        isLatest: true,
      },
    });
  }

  async createUploadIntent(
    userId: string,
    input: ResumeUploadIntentInput,
  ): Promise<ResumeUploadIntentResult> {
    this.assertResumeStorageConfigured();
    await this.assertCanUploadResume(userId);
    await this.assertApplicationOwner(userId, input.applicationId);
    const normalizedInput = this.normalizeUploadMetadata(input);

    const pathname = `uploads/users/${userId}/documents/${randomUUID()}${mimeTypeExtensionMap[normalizedInput.mimeType]}`;
    const payload: ResumeBlobPayload = { ...normalizedInput, userId, pathname };

    return {
      pathname,
      clientPayload: JSON.stringify(payload),
      allowedContentTypes: RESUME_ALLOWED_MIME_TYPES,
      maximumSizeInBytes: config.resumeUploadMaxBytes,
      uploadMode: usesGcsResumeStorage() ? "api" : "blob",
    };
  }

  async assertCanUploadResume(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true },
    });
    if (!user || !user.isActive || user.role !== "freelancer") {
      throw new AppError(403, "レジュメをアップロードできません。", "FORBIDDEN");
    }
  }

  parseBlobPayload(payload: string | null | undefined) {
    if (!payload) {
      throw new AppError(400, "アップロード情報が不正です。", "INVALID_UPLOAD");
    }
    try {
      const parsed = JSON.parse(payload) as ResumeBlobPayload;
      const normalized = this.normalizeUploadMetadata(parsed);
      if (!parsed.userId || !parsed.pathname) {
        throw new Error("missing required fields");
      }
      return { ...parsed, ...normalized };
    } catch {
      throw new AppError(400, "アップロード情報が不正です。", "INVALID_UPLOAD");
    }
  }

  async createLatestFromBlob(payload: ResumeBlobPayload, blob: PutBlobResult) {
    if (payload.pathname !== blob.pathname) {
      throw new AppError(400, "アップロード情報が一致しません。", "INVALID_UPLOAD");
    }
    await this.assertCanUploadResume(payload.userId);
    await this.assertApplicationOwner(payload.userId, payload.applicationId);

    return this.createLatestRecord(payload, blob);
  }

  async uploadToGcs(userId: string, clientPayload: string | undefined, file: Buffer) {
    this.assertGcsConfigured();
    const payload = this.parseBlobPayload(clientPayload);
    if (payload.userId !== userId) {
      throw new AppError(403, "この操作を行う権限がありません。", "FORBIDDEN");
    }
    if (!file.length) {
      throw new AppError(400, "アップロードファイルが空です。", "INVALID_UPLOAD");
    }
    if (file.length !== payload.fileSizeBytes) {
      throw new AppError(400, "アップロード情報が一致しません。", "INVALID_UPLOAD");
    }
    await this.assertCanUploadResume(userId);
    await this.assertApplicationOwner(userId, payload.applicationId);

    await this.gcsFile(payload.pathname).save(file, {
      contentType: payload.mimeType,
      resumable: false,
      validation: "crc32c",
      metadata: {
        metadata: {
          originalFilename: payload.originalFilename,
          userId,
        },
      },
    });

    return this.createLatestRecord(payload, {
      pathname: payload.pathname,
      url: `gs://${config.gcsBucketName}/${payload.pathname}`,
    });
  }

  async completeClientUpload(userId: string, input: ResumeUploadCompleteInput) {
    this.assertResumeStorageConfigured();
    await this.assertCanUploadResume(userId);
    await this.assertApplicationOwner(userId, input.applicationId);
    const normalizedInput = this.normalizeUploadMetadata(input);
    const expectedPrefix = `uploads/users/${userId}/documents/`;
    if (!normalizedInput.blobPath.startsWith(expectedPrefix)) {
      throw new AppError(400, "アップロード情報が一致しません。", "INVALID_UPLOAD");
    }
    if (usesGcsResumeStorage()) {
      await this.assertGcsStored(normalizedInput);
    } else {
      await this.assertBlobStored(normalizedInput);
    }

    return this.createLatestRecord(
      {
        ...normalizedInput,
        userId,
        pathname: normalizedInput.blobPath,
      },
      {
        pathname: normalizedInput.blobPath,
        url: normalizedInput.blobUrl || "",
      },
    );
  }

  async createPreview(auth: AuthContext, freelancerProfileId: string) {
    const { profile, latestResume, uploadedFile } = await this.findReadableResume(
      auth,
      freelancerProfileId,
    );
    const mimeType = latestResume.mimeType || uploadedFile.mimeType;
    const basePreview = {
      freelancerName: decryptText(profile.user.name),
      fileName: decryptText(latestResume.originalFilename),
      mimeType,
      sizeBytes: latestResume.fileSizeBytes || Number(uploadedFile.sizeBytes),
      previewUrl: "",
      html: "",
      previewKind: "download" as const,
      expiresAt: "",
    };

    if (mimeType === "application/pdf") {
      if (usesGcsResumeStorage()) {
        return {
          ...basePreview,
          previewKind: "download" as const,
        };
      }
      const validUntil = Date.now() + 10 * 60 * 1000;
      const signedToken = await issueSignedToken({
        token: config.blobReadWriteToken,
        pathname: uploadedFile.blobPath,
        operations: ["get"],
        validUntil,
      });
      const { presignedUrl } = await presignUrl(signedToken, {
        access: "private",
        operation: "get",
        pathname: uploadedFile.blobPath,
        validUntil,
      });

      return {
        ...basePreview,
        previewKind: "pdf" as const,
        previewUrl: presignedUrl,
        expiresAt: new Date(validUntil).toISOString(),
      };
    }

    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      return {
        ...basePreview,
        previewKind: "html" as const,
        html: await this.createDocxPreviewHtml(uploadedFile.blobPath),
      };
    }

    if (
      mimeType === "application/vnd.ms-excel" ||
      mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      return {
        ...basePreview,
        previewKind: "html" as const,
        html: await this.createExcelPreviewHtml(uploadedFile.blobPath),
      };
    }

    return basePreview;
  }

  async download(auth: AuthContext, freelancerProfileId: string) {
    const { latestResume, uploadedFile } = await this.findReadableResume(
      auth,
      freelancerProfileId,
    );
    if (usesGcsResumeStorage()) {
      const [metadata] = await this.gcsFile(uploadedFile.blobPath).getMetadata();
      return {
        stream: this.gcsFile(uploadedFile.blobPath).createReadStream(),
        fileName: decryptText(latestResume.originalFilename),
        mimeType:
          String(metadata.contentType || "") ||
          latestResume.mimeType ||
          uploadedFile.mimeType ||
          "application/octet-stream",
        sizeBytes:
          Number(metadata.size || 0) ||
          latestResume.fileSizeBytes ||
          Number(uploadedFile.sizeBytes),
      };
    }
    const blobResult = await get(uploadedFile.blobPath, {
      access: "private",
      token: config.blobReadWriteToken,
      useCache: false,
    });
    if (!blobResult || blobResult.statusCode !== 200 || !blobResult.stream) {
      throw new AppError(404, "レジュメが見つかりません。", "RESUME_NOT_FOUND");
    }
    const blob = blobResult;

    return {
      stream: blob.stream,
      fileName: decryptText(latestResume.originalFilename),
      mimeType:
        blob.blob.contentType ||
        latestResume.mimeType ||
        uploadedFile.mimeType ||
        "application/octet-stream",
      sizeBytes:
        blob.blob.size || latestResume.fileSizeBytes || Number(uploadedFile.sizeBytes),
    };
  }

  private async findReadableResume(auth: AuthContext, freelancerProfileId: string) {
    this.assertResumeStorageConfigured();
    const profile = await this.db.freelancerProfile.findUnique({
      where: { id: freelancerProfileId },
      include: {
        user: true,
        resumes: {
          orderBy: { uploadedAt: "desc" },
          include: { uploadedFile: true },
        },
      },
    });
    if (!profile) {
      throw new AppError(404, "レジュメが見つかりません。", "RESUME_NOT_FOUND");
    }
    if (auth.role !== "sales" && profile.userId !== auth.userId) {
      throw new AppError(403, "このレジュメを確認できません。", "FORBIDDEN");
    }

    const latestResume =
      profile.resumes.find((resume) => resume.isLatest) || profile.resumes[0];
    const uploadedFile = latestResume?.uploadedFile;
    if (!latestResume || !uploadedFile?.blobPath) {
      throw new AppError(404, "レジュメが登録されていません。", "RESUME_NOT_FOUND");
    }

    return { profile, latestResume, uploadedFile };
  }

  private async createDocxPreviewHtml(blobPath: string) {
    const buffer = await this.readBlobBuffer(blobPath);
    const result = await mammoth.convertToHtml({ buffer });

    return this.sanitizePreviewHtml(result.value);
  }

  private async createExcelPreviewHtml(blobPath: string) {
    const buffer = await this.readBlobBuffer(blobPath);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheets = workbook.SheetNames.slice(0, 5)
      .map((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return "";
        const html = XLSX.utils.sheet_to_html(sheet, {
          id: `resume-sheet-${sheetName.replace(/[^a-zA-Z0-9_-]/g, "-")}`,
        });

        return `<section><h3>${this.escapeHtml(sheetName)}</h3>${html}</section>`;
      })
      .filter(Boolean)
      .join("");

    return this.sanitizePreviewHtml(sheets || "<p>表示できるシートがありません。</p>");
  }

  private async readBlobBuffer(blobPath: string) {
    if (usesGcsResumeStorage()) {
      const [buffer] = await this.gcsFile(blobPath).download();
      return buffer;
    }
    const blobResult = await get(blobPath, {
      access: "private",
      token: config.blobReadWriteToken,
      useCache: false,
    });
    if (!blobResult || blobResult.statusCode !== 200 || !blobResult.stream) {
      throw new AppError(404, "レジュメが見つかりません。", "RESUME_NOT_FOUND");
    }
    const nodeStream = Readable.fromWeb(
      blobResult.stream as unknown as NodeReadableStream<Uint8Array>,
    );
    const chunks: Buffer[] = [];
    for await (const chunk of nodeStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  private sanitizePreviewHtml(html: string) {
    return sanitizeHtml(html, {
      allowedTags: [
        "a",
        "b",
        "blockquote",
        "br",
        "caption",
        "code",
        "div",
        "em",
        "h1",
        "h2",
        "h3",
        "h4",
        "li",
        "ol",
        "p",
        "pre",
        "section",
        "span",
        "strong",
        "sub",
        "sup",
        "table",
        "tbody",
        "td",
        "tfoot",
        "th",
        "thead",
        "tr",
        "u",
        "ul",
      ],
      allowedAttributes: {
        a: ["href", "name", "target"],
        table: ["id"],
        td: ["colspan", "rowspan"],
        th: ["colspan", "rowspan"],
      },
      allowedSchemes: ["http", "https", "mailto"],
    });
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private async createLatestRecord(
    payload: ResumeBlobPayload,
    blob: { pathname: string; url?: string },
  ) {
    return this.db.$transaction(async (tx) => {
      const profile = await tx.freelancerProfile.findUniqueOrThrow({
        where: { userId: payload.userId },
      });
      await tx.resume.updateMany({
        where: { freelancerProfileId: profile.id },
        data: { isLatest: false },
      });
      const existingFile = await tx.uploadedFile.findFirst({
        where: { blobPath: blob.pathname },
        select: { id: true },
      });
      const uploadedFile =
        existingFile ||
        (await tx.uploadedFile.create({
          data: {
            userId: payload.userId,
            applicationId: payload.applicationId,
            originalFileName: encryptText(payload.originalFilename),
            blobPath: blob.pathname,
            blobUrl: blob.url || null,
            mimeType: payload.mimeType,
            sizeBytes: BigInt(payload.fileSizeBytes),
            visibility: "private",
          },
        }));
      const existingResume = await tx.resume.findFirst({
        where: { uploadedFileId: uploadedFile.id },
      });
      if (existingResume) {
        return tx.resume.update({
          where: { id: existingResume.id },
          data: { isLatest: true },
        });
      }

      return tx.resume.create({
        data: {
          freelancerProfileId: profile.id,
          uploadedFileId: uploadedFile.id,
          originalFilename: encryptText(payload.originalFilename),
          mimeType: payload.mimeType,
          fileSizeBytes: payload.fileSizeBytes,
          storageKey: blob.pathname,
          isLatest: true,
        },
      });
    });
  }

  private async assertBlobStored(input: ResumeUploadCompleteInput) {
    try {
      const blob = await head(input.blobPath, {
        token: config.blobReadWriteToken,
      });
      if (blob.size !== input.fileSizeBytes) {
        throw new Error("size mismatch");
      }
      if (
        blob.contentType &&
        input.mimeType &&
        blob.contentType !== input.mimeType
      ) {
        throw new Error("mime mismatch");
      }
    } catch {
      throw new AppError(
        400,
        "アップロード済みファイルを確認できません。",
        "BLOB_NOT_FOUND",
      );
    }
  }

  private async assertGcsStored(input: ResumeUploadCompleteInput) {
    try {
      const [metadata] = await this.gcsFile(input.blobPath).getMetadata();
      const storedSize = Number(metadata.size || 0);
      if (storedSize !== input.fileSizeBytes) {
        throw new Error("size mismatch");
      }
      if (
        metadata.contentType &&
        input.mimeType &&
        metadata.contentType !== input.mimeType
      ) {
        throw new Error("mime mismatch");
      }
    } catch {
      throw new AppError(
        400,
        "アップロード済みファイルを確認できません。",
        "BLOB_NOT_FOUND",
      );
    }
  }

  private normalizeUploadMetadata<T extends ResumeUploadIntentInput>(input: T) {
    const extension = this.extractAllowedExtension(input.originalFilename);
    const mimeType = input.mimeType || extensionMimeTypeMap[extension] || "";
    if (!RESUME_ALLOWED_MIME_TYPES.includes(mimeType as (typeof RESUME_ALLOWED_MIME_TYPES)[number])) {
      throw new AppError(400, "PDF、Word、Excelファイルのみアップロードできます。", "INVALID_FILE_TYPE");
    }
    if (input.fileSizeBytes > config.resumeUploadMaxBytes) {
      throw new AppError(400, "ファイルサイズが上限を超えています。", "FILE_TOO_LARGE");
    }

    return { ...input, mimeType };
  }

  private extractAllowedExtension(filename: string) {
    const extension = filename.trim().toLowerCase().match(/\.[^.]+$/)?.[0] || "";
    if (!extensionMimeTypeMap[extension]) {
      throw new AppError(400, "PDF、Word、Excelファイルのみアップロードできます。", "INVALID_FILE_TYPE");
    }

    return extension;
  }

  private assertBlobConfigured() {
    if (!hasValidBlobReadWriteToken()) {
      throw new AppError(
        503,
        "レジュメアップロード用のBlobトークンが未設定、またはダミー値です。",
        "BLOB_NOT_CONFIGURED",
      );
    }
  }

  private assertGcsConfigured() {
    if (!config.gcsBucketName.trim()) {
      throw new AppError(
        503,
        "レジュメ保存用のGCSバケットが未設定です。",
        "GCS_NOT_CONFIGURED",
      );
    }
  }

  private assertResumeStorageConfigured() {
    if (usesGcsResumeStorage()) {
      this.assertGcsConfigured();
      return;
    }
    this.assertBlobConfigured();
  }

  private gcsFile(pathname: string) {
    this.assertGcsConfigured();
    return storage.bucket(config.gcsBucketName).file(pathname);
  }

  private async assertApplicationOwner(userId: string, applicationId?: string) {
    if (!applicationId) return;
    const application = await this.db.application.findFirst({
      where: {
        id: applicationId,
        freelancerProfile: { userId },
      },
      select: { id: true },
    });
    if (!application) {
      throw new AppError(403, "この応募にファイルを紐づけられません。", "FORBIDDEN");
    }
  }
}
