import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidBasicAuthHeader } from "../backend/src/interfaces/http/middleware";

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
});
