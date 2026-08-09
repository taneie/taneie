import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isResumePreviewTokenRequest,
  isValidBasicAuthHeader,
} from "../backend/src/interfaces/http/middleware";

describe("Basic認証", () => {
  /**
   * @testData 正しいBasic認証ヘッダー、誤ったパスワード、Bearerヘッダー。
   * @expected 正しいBasic認証だけを許可し、誤った認証情報やBearerはBasic認証としては不許可になる。
   */
  it("Basic認証ヘッダーを検証する", () => {
    const valid = `Basic ${Buffer.from("try-freelance-dev:tryangle-frichy-202608").toString("base64")}`;
    const invalid = `Basic ${Buffer.from("try-freelance-dev:wrong").toString("base64")}`;

    assert.equal(
      isValidBasicAuthHeader(
        valid,
        "try-freelance-dev",
        "tryangle-frichy-202608",
      ),
      true,
    );
    assert.equal(
      isValidBasicAuthHeader(
        invalid,
        "try-freelance-dev",
        "tryangle-frichy-202608",
      ),
      false,
    );
    assert.equal(
      isValidBasicAuthHeader(
        "Bearer jwt-token",
        "try-freelance-dev",
        "tryangle-frichy-202608",
      ),
      false,
    );
  });

  /**
   * @testData レジュメの署名付き表示URL、tokenなし表示URL、通常のプレビュー情報取得URL。
   * @expected 署名token付きのGET/HEAD表示URLだけBasic認証の対象外にし、その他のURLはBasic認証対象のままにする。
   */
  it("署名付きレジュメ表示URLだけBasic認証の対象外にする", () => {
    assert.equal(
      isResumePreviewTokenRequest(
        "GET",
        "/api/resumes/freelancers/profile-1/view",
        "signed-preview-token",
      ),
      true,
    );
    assert.equal(
      isResumePreviewTokenRequest(
        "HEAD",
        "/api/resumes/freelancers/profile-1/view",
        "signed-preview-token",
      ),
      true,
    );
    assert.equal(
      isResumePreviewTokenRequest(
        "GET",
        "/api/resumes/freelancers/profile-1/view",
        "",
      ),
      false,
    );
    assert.equal(
      isResumePreviewTokenRequest(
        "GET",
        "/api/resumes/freelancers/profile-1/preview",
        "signed-preview-token",
      ),
      false,
    );
  });
});
