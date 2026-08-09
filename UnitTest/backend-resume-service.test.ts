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
});
