import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  RESUME_ALLOWED_MIME_TYPES,
  resolveResumeMimeType,
} from "../Frontend/composables/frichy/resumeUpload";

describe("フロントエンドのレジュメアップロード判定", () => {
  /**
   * @testData ブラウザが`application/octet-stream`として渡すPDFファイル。
   * @expected 拡張子から`application/pdf`へ補正され、アップロード許可MIMEとして扱われる。
   */
  it("resolveResumeMimeType falls back to extension for generic browser MIME", () => {
    const mimeType = resolveResumeMimeType({
      name: "職務経歴書.pdf",
      type: "application/octet-stream",
    } as File);

    assert.equal(mimeType, "application/pdf");
    assert.equal(RESUME_ALLOWED_MIME_TYPES.includes(mimeType), true);
  });

  /**
   * @testData 拡張子が`.docx`で、ブラウザMIMEが空文字のWordファイル。
   * @expected 拡張子からWordの正式MIMEへ補正される。
   */
  it("resolveResumeMimeType uses extension when browser MIME is empty", () => {
    assert.equal(
      resolveResumeMimeType({ name: "resume.docx", type: "" } as File),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });
});
