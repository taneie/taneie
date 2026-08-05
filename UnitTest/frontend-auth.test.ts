import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  findDemoAccountByCredentials,
  resolveLoginSource,
  shouldFallbackToLocalDemoLogin,
} from "../Frontend/composables/frichy/auth";
import { demoAccounts } from "../Frontend/composables/frichy/constants";

describe("フロントエンド認証フロー", () => {
  /**
   * @testData デモ営業emailの前後に空白を含めた入力値、正しい固定password。
   * @expected 空白を除去してデモ営業アカウントを特定できる。
   */
  it("findDemoAccountByCredentials trims email and finds demo sales", () => {
    const account = findDemoAccountByCredentials(
      demoAccounts,
      " sales@frichy.jp ",
      "sales123",
    );

    assert.equal(account?.role, "sales");
  });

  /**
   * @testData API loginがJWT付きで成功するデモ営業credentials。
   * @expected 固定デモcredentialsでもローカルログインに逃げず、API login結果を採用する。
   */
  it("resolveLoginSource prefers API login even for demo credentials", async () => {
    const result = await resolveLoginSource(
      { email: "sales@frichy.jp", password: "sales123" },
      demoAccounts,
      async () => ({
        token: "jwt-token",
        user: {
          email: "sales@frichy.jp",
          role: "sales",
          name: "営業",
        },
      }),
    );

    assert.equal(result.kind, "api");
    if (result.kind === "api") {
      assert.equal(result.result.token, "jwt-token");
      assert.equal(result.result.user.role, "sales");
    }
  });

  /**
   * @testData API loginがnetwork系TypeErrorで失敗するデモ求職者credentials。
   * @expected API自体が使えない時だけローカルデモログインへフォールバックする。
   */
  it("resolveLoginSource falls back to local demo only for network failures", async () => {
    const result = await resolveLoginSource(
      { email: "freelancer@example.com", password: "freelance123" },
      demoAccounts,
      async () => {
        throw new TypeError("Failed to fetch");
      },
    );

    assert.equal(result.kind, "local-demo");
    if (result.kind === "local-demo") {
      assert.equal(result.account.role, "freelancer");
    }
  });

  /**
   * @testData API loginが401相当の認証エラーメッセージで失敗するデモ営業credentials。
   * @expected seed漏れやpassword不一致を隠さないため、ローカルデモへフォールバックしない。
   */
  it("resolveLoginSource does not hide authentication failures", async () => {
    const result = await resolveLoginSource(
      { email: "sales@frichy.jp", password: "sales123" },
      demoAccounts,
      async () => {
        throw new Error("メールアドレスまたはパスワードが違います。");
      },
    );

    assert.equal(result.kind, "error");
  });

  /**
   * @testData fetchのnetwork系エラーと、APIが返す`ログインが必要です。`の業務エラー。
   * @expected network系だけフォールバック対象になり、認証必須エラーは対象外になる。
   */
  it("shouldFallbackToLocalDemoLogin distinguishes network and auth errors", () => {
    assert.equal(shouldFallbackToLocalDemoLogin(new TypeError("fetch failed")), true);
    assert.equal(
      shouldFallbackToLocalDemoLogin(new Error("ログインが必要です。")),
      false,
    );
  });
});
