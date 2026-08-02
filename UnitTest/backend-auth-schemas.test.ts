import { describe, it } from "node:test";
import {
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  registerSchema,
} from "../backend/src/interfaces/http/schemas";
import { expectInvalid, expectValid } from "./helpers/schema";

describe("認証API入力スキーマ", () => {
  /**
   * @testData 有効なemail/password/規約同意、email不正、短すぎるpassword、規約未同意。
   * @expected 有効な登録情報だけが受理され、不正email・短いpassword・規約未同意は拒否される。
   */
  it("registerSchema accepts valid input and rejects invalid email/password/consent", () => {
    expectValid(registerSchema, {
      email: "user@example.com",
      password: "password123",
      privacyPolicyAccepted: true,
    });
    expectInvalid(registerSchema, {
      email: "invalid",
      password: "password123",
      privacyPolicyAccepted: true,
    });
    expectInvalid(registerSchema, {
      email: "user@example.com",
      password: "short",
      privacyPolicyAccepted: true,
    });
    expectInvalid(registerSchema, {
      email: "user@example.com",
      password: "password123",
      privacyPolicyAccepted: false,
    });
  });

  /**
   * @testData 有効なemail/password、不正email、空password。
   * @expected 有効なログイン情報だけが受理され、不正emailと空passwordはvalidation errorになる。
   */
  it("loginSchema accepts valid credentials and rejects malformed email/blank password", () => {
    expectValid(loginSchema, { email: "user@example.com", password: "x" });
    expectInvalid(loginSchema, { email: "invalid", password: "x" });
    expectInvalid(loginSchema, { email: "user@example.com", password: "" });
  });

  /**
   * @testData 有効/不正なリセット要求email、32文字token、短いtoken、短い新password。
   * @expected リセット要求と確定の入力制約が守られ、token/passwordの不正値は拒否される。
   */
  it("password reset schemas validate request and confirm inputs", () => {
    expectValid(passwordResetRequestSchema, { email: "user@example.com" });
    expectInvalid(passwordResetRequestSchema, { email: "invalid" });
    expectValid(passwordResetConfirmSchema, {
      token: "a".repeat(32),
      password: "password123",
    });
    expectInvalid(passwordResetConfirmSchema, {
      token: "short",
      password: "password123",
    });
    expectInvalid(passwordResetConfirmSchema, {
      token: "a".repeat(32),
      password: "short",
    });
  });
});
