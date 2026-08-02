import { describe, it } from "node:test";
import {
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  registerSchema,
} from "../backend/src/interfaces/http/schemas";
import { expectInvalid, expectValid } from "./helpers/schema";

describe("auth schemas", () => {
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

  it("loginSchema accepts valid credentials and rejects malformed email/blank password", () => {
    expectValid(loginSchema, { email: "user@example.com", password: "x" });
    expectInvalid(loginSchema, { email: "invalid", password: "x" });
    expectInvalid(loginSchema, { email: "user@example.com", password: "" });
  });

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
