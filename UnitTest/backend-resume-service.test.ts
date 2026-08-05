import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isOfficePreviewMimeType,
  ResumeService,
  toOfficeViewerUrl,
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
   * @testData アップロード許可済みのWord/Excel MIMEとPDF MIME。
   * @expected PDF以外の許可Office形式はすべてOfficeプレビュー対象になり、PDFはOffice対象外になる。
   */
  it("isOfficePreviewMimeType accepts all allowed Word and Excel MIME types", () => {
    assert.equal(isOfficePreviewMimeType("application/msword"), true);
    assert.equal(
      isOfficePreviewMimeType(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
      true,
    );
    assert.equal(isOfficePreviewMimeType("application/vnd.ms-excel"), true);
    assert.equal(
      isOfficePreviewMimeType(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ),
      true,
    );
    assert.equal(isOfficePreviewMimeType("application/pdf"), false);
  });

  /**
   * @testData query string付き一時署名URL。
   * @expected Office Web Viewerのembed URLとして、元URL全体が`src`にURLエンコードされる。
   */
  it("toOfficeViewerUrl builds an embeddable Office viewer URL", () => {
    const signedUrl = "https://storage.example.test/resume.docx?X-Goog-Signature=abc";
    const viewerUrl = toOfficeViewerUrl(signedUrl);

    assert.match(
      viewerUrl,
      /^https:\/\/view\.officeapps\.live\.com\/op\/embed\.aspx\?src=/,
    );
    assert.match(viewerUrl, /resume\.docx%3FX-Goog-Signature%3Dabc/);
  });
});
