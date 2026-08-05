import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decryptText,
  encryptText,
  piiHash,
} from "../backend/src/infrastructure/crypto";
import {
  hashPassword,
  signResumePreviewToken,
  signToken,
  verifyResumePreviewToken,
  verifyPassword,
  verifyToken,
} from "../backend/src/infrastructure/security";

describe("暗号化・個人情報ハッシュ", () => {
  /**
   * @testData 通常文字列、空文字、暗号化済み文字列、暗号化prefixを持たない平文。
   * @expected 通常文字列は暗号化/復号でき、空文字と暗号化済み値は冪等に扱われ、平文復号はそのまま返る。
   */
  it("encryptText/decryptText round-trip normal, empty, and already encrypted values", () => {
    const encrypted = encryptText("個人情報");

    assert.notEqual(encrypted, "個人情報");
    assert.equal(decryptText(encrypted), "個人情報");
    assert.equal(encryptText(""), "");
    assert.equal(decryptText(""), "");
    assert.equal(encryptText(encrypted), encrypted);
    assert.equal(decryptText("plain-text"), "plain-text");
  });

  /**
   * @testData 大文字小文字と前後空白が異なる同一email、別email。
   * @expected PII hashはtrim/lowercaseで正規化され、同一emailは同じhash、別emailは別hashになる。
   */
  it("piiHash is normalized and deterministic", () => {
    assert.equal(piiHash("USER@example.com "), piiHash(" user@example.com"));
    assert.notEqual(piiHash("a@example.com"), piiHash("b@example.com"));
  });
});

describe("認証セキュリティ", () => {
  /**
   * @testData 正しいpassword、bcrypt hash、誤ったpassword。
   * @expected 元passwordは検証成功し、異なるpasswordは検証失敗する。
   */
  it("hashPassword/verifyPassword accept the original password and reject others", async () => {
    const hash = await hashPassword("correct-password");

    assert.equal(await verifyPassword("correct-password", hash), true);
    assert.equal(await verifyPassword("wrong-password", hash), false);
  });

  /**
   * @testData userId/role/emailを含む認証contextと、不正なtoken文字列。
   * @expected 署名済みtokenから認証contextを復元でき、不正tokenは検証例外になる。
   */
  it("signToken/verifyToken round-trip auth context and reject malformed tokens", () => {
    const token = signToken({
      userId: "user-id",
      role: "freelancer",
      email: "freelancer@example.com",
    });
    const payload = verifyToken(token);

    assert.equal(payload.userId, "user-id");
    assert.equal(payload.role, "freelancer");
    assert.equal(payload.email, "freelancer@example.com");
    assert.throws(() => verifyToken("not-a-token"));
  });

  /**
   * @testData 営業の認証context、対象freelancerProfileId、resumeId、不正なtoken文字列。
   * @expected プレビューtokenから対象レジュメ情報を復元でき、不正tokenは検証例外になる。
   */
  it("signResumePreviewToken/verifyResumePreviewToken round-trip preview scope", () => {
    const token = signResumePreviewToken({
      userId: "sales-user-id",
      role: "sales",
      email: "sales@frichy.jp",
      freelancerProfileId: "freelancer-profile-id",
      resumeId: "resume-id",
    });
    const payload = verifyResumePreviewToken(token);

    assert.equal(payload.purpose, "resume-preview");
    assert.equal(payload.userId, "sales-user-id");
    assert.equal(payload.role, "sales");
    assert.equal(payload.freelancerProfileId, "freelancer-profile-id");
    assert.equal(payload.resumeId, "resume-id");
    assert.throws(() => verifyResumePreviewToken("not-a-token"));
  });
});
