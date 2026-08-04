import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ResumeService } from "../backend/src/application/services/resume.service";

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
});
