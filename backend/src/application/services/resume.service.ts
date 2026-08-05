import {
  get,
  head,
  type PutBlobResult,
} from "@vercel/blob";
import { Storage } from "@google-cloud/storage";
import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { AppError, type AuthContext } from "../../domain/types.js";
import {
  config,
  hasValidBlobReadWriteToken,
  usesGcsResumeStorage,
} from "../../infrastructure/config.js";
import { decryptText, encryptText } from "../../infrastructure/crypto.js";
import {
  signResumePreviewToken,
  verifyResumePreviewToken,
} from "../../infrastructure/security.js";
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

const genericMimeTypes = new Set([
  "",
  "application/octet-stream",
  "binary/octet-stream",
]);

const officePreviewMimeTypes = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const storage = new Storage();

export function isOfficePreviewMimeType(mimeType: string) {
  return officePreviewMimeTypes.has(mimeType);
}

export function toOfficeViewerUrl(fileUrl: string) {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
}

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

  async createPreview(
    auth: AuthContext,
    freelancerProfileId: string,
    publicBaseUrl: string,
  ) {
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
      previewKind: "download" as const,
      expiresAt: "",
    };

    if (
      mimeType === "application/pdf" ||
      isOfficePreviewMimeType(mimeType)
    ) {
      const token = signResumePreviewToken({
        ...auth,
        freelancerProfileId,
        resumeId: latestResume.id,
      });
      const fileUrl = this.createPreviewFileUrl(
        publicBaseUrl,
        freelancerProfileId,
        token,
      );
      return {
        ...basePreview,
        previewKind:
          mimeType === "application/pdf"
            ? ("pdf" as const)
            : ("office" as const),
        previewUrl:
          mimeType === "application/pdf" ? fileUrl : toOfficeViewerUrl(fileUrl),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      };
    }

    return basePreview;
  }

  async downloadWithPreviewToken(freelancerProfileId: string, token: string) {
    let payload: ReturnType<typeof verifyResumePreviewToken>;
    try {
      payload = verifyResumePreviewToken(token);
    } catch {
      throw new AppError(
        401,
        "プレビューの有効期限が切れました。もう一度開き直してください。",
        "RESUME_PREVIEW_TOKEN_INVALID",
      );
    }
    if (payload.freelancerProfileId !== freelancerProfileId) {
      throw new AppError(403, "このレジュメを確認できません。", "FORBIDDEN");
    }

    return this.downloadReadableResume(payload, freelancerProfileId, payload.resumeId);
  }

  async download(auth: AuthContext, freelancerProfileId: string) {
    return this.downloadReadableResume(auth, freelancerProfileId);
  }

  private async downloadReadableResume(
    auth: AuthContext,
    freelancerProfileId: string,
    resumeId?: string,
  ) {
    const { latestResume, uploadedFile } = await this.findReadableResume(
      auth,
      freelancerProfileId,
      resumeId,
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

  private async findReadableResume(
    auth: AuthContext,
    freelancerProfileId: string,
    resumeId?: string,
  ) {
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

    const latestResume = resumeId
      ? profile.resumes.find((resume) => resume.id === resumeId)
      : profile.resumes.find((resume) => resume.isLatest) || profile.resumes[0];
    const uploadedFile = latestResume?.uploadedFile;
    if (!latestResume || !uploadedFile?.blobPath) {
      throw new AppError(404, "レジュメが登録されていません。", "RESUME_NOT_FOUND");
    }

    return { profile, latestResume, uploadedFile };
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
    const inputMimeType = input.mimeType.trim().toLowerCase();
    const extensionMimeType = extensionMimeTypeMap[extension] || "";
    const mimeType =
      genericMimeTypes.has(inputMimeType) ||
      !RESUME_ALLOWED_MIME_TYPES.includes(inputMimeType as (typeof RESUME_ALLOWED_MIME_TYPES)[number])
        ? extensionMimeType
        : inputMimeType;
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

  private createPreviewFileUrl(
    publicBaseUrl: string,
    freelancerProfileId: string,
    token: string,
  ) {
    const baseUrl = publicBaseUrl.replace(/\/$/, "");
    const profileId = encodeURIComponent(freelancerProfileId);

    return `${baseUrl}/api/resumes/freelancers/${profileId}/view?token=${encodeURIComponent(token)}`;
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
