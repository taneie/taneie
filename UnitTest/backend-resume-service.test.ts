import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isDocxPreviewMimeType,
  ResumeService,
} from "../backend/src/application/services/resume.service";

describe("レジュメサービス", () => {
  /**
   * @testData PDF拡張子だがMIMEが`application/octet-stream`のアップロードpayload。
   * @expected 拡張子から`application/pdf`へ補正され、アップロード情報として受理される。
   */
  it("parseBlobPayload normalizes generic MIME from the filename extension", () => {
    const service = new ResumeService({} as never);

    const payload = service.parseBlobPayload(
      JSON.stringify({
        originalFilename: "職務経歴書.pdf",
        mimeType: "application/octet-stream",
        fileSizeBytes: 128,
        userId: "user-test",
        pathname: "uploads/users/user-test/documents/resume.pdf",
      }),
    );

    assert.equal(payload.mimeType, "application/pdf");
  });

  /**
   * @testData 未許可拡張子でMIMEが`application/octet-stream`のアップロードpayload。
   * @expected 拡張子から許可MIMEへ補正できないため、validation errorとして拒否される。
   */
  it("parseBlobPayload rejects generic MIME when extension is not allowed", () => {
    const service = new ResumeService({} as never);

    assert.throws(
      () =>
        service.parseBlobPayload(
          JSON.stringify({
            originalFilename: "resume.txt",
            mimeType: "application/octet-stream",
            fileSizeBytes: 128,
            userId: "user-test",
            pathname: "uploads/users/user-test/documents/resume.txt",
          }),
        ),
      /アップロード情報が不正です。/,
    );
  });

  /**
   * @testData アップロード許可済みのdocx/旧doc/Excel/PDF MIME。
   * @expected docxだけFrichy内プレビュー対象になり、Microsoft Office Viewerへ渡す形式は対象外になる。
   */
  it("isDocxPreviewMimeType accepts only docx preview MIME type", () => {
    assert.equal(isDocxPreviewMimeType("application/msword"), false);
    assert.equal(
      isDocxPreviewMimeType(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
      true,
    );
    assert.equal(isDocxPreviewMimeType("application/vnd.ms-excel"), false);
    assert.equal(
      isDocxPreviewMimeType(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ),
      false,
    );
    assert.equal(isDocxPreviewMimeType("application/pdf"), false);
  });

  /**
   * @testData 求職者本人の最新レジュメrecordと、呼ばれたら失敗にするストレージ削除mock。
   * @expected 最新レジュメは直接削除できず、ストレージ削除やDB削除は実行されない。
   */
  it("deleteOwnResume rejects deleting the latest resume directly", async () => {
    let storageDeleted = false;
    const service = new ResumeService(
      {
        resume: {
          findFirst: async () => ({
            id: "resume-current",
            uploadedFileId: "file-current",
            storageKey: "uploads/current.pdf",
            isLatest: true,
            uploadedFile: { blobPath: "uploads/current.pdf" },
          }),
        },
      } as never,
      async () => {
        storageDeleted = true;
      },
    );

    await assert.rejects(
      () => service.deleteOwnResume("user-test", "resume-current"),
      /最新レジュメは登録完了後に置き換えてから削除してください。/,
    );
    assert.equal(storageDeleted, false);
  });

  /**
   * @testData 求職者本人の旧レジュメrecord、ストレージ削除mock、Prisma transaction mock。
   * @expected 旧レジュメのストレージobjectを削除してから、resumeと未参照uploadedFileをDBから削除する。
   */
  it("deleteOwnResume deletes a replaced resume object and records", async () => {
    const calls: string[] = [];
    const service = new ResumeService(
      {
        resume: {
          findFirst: async () => ({
            id: "resume-old",
            uploadedFileId: "file-old",
            storageKey: "uploads/old.pdf",
            isLatest: false,
            uploadedFile: { blobPath: "uploads/old.pdf" },
          }),
        },
        $transaction: async (callback: (tx: unknown) => Promise<void>) =>
          callback({
            resume: {
              delete: async ({ where }: { where: { id: string } }) => {
                calls.push(`resume:${where.id}`);
              },
            },
            uploadedFile: {
              deleteMany: async ({ where }: { where: { id: string } }) => {
                calls.push(`uploadedFile:${where.id}`);
              },
            },
          }),
      } as never,
      async (pathname) => {
        calls.push(`storage:${pathname}`);
      },
    );

    assert.deepEqual(await service.deleteOwnResume("user-test", "resume-old"), {
      deleted: true,
    });
    assert.deepEqual(calls, [
      "storage:uploads/old.pdf",
      "resume:resume-old",
      "uploadedFile:file-old",
    ]);
  });
});
