import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decryptText,
  encryptText,
  piiHash,
} from "../backend/src/infrastructure/crypto";
import {
  hashPassword,
  signToken,
  verifyPassword,
  verifyToken,
} from "../backend/src/infrastructure/security";

describe("crypto methods", () => {
  it("encryptText/decryptText round-trip normal, empty, and already encrypted values", () => {
    const encrypted = encryptText("個人情報");

    assert.notEqual(encrypted, "個人情報");
    assert.equal(decryptText(encrypted), "個人情報");
    assert.equal(encryptText(""), "");
    assert.equal(decryptText(""), "");
    assert.equal(encryptText(encrypted), encrypted);
    assert.equal(decryptText("plain-text"), "plain-text");
  });

  it("piiHash is normalized and deterministic", () => {
    assert.equal(piiHash("USER@example.com "), piiHash(" user@example.com"));
    assert.notEqual(piiHash("a@example.com"), piiHash("b@example.com"));
  });
});

describe("auth security methods", () => {
  it("hashPassword/verifyPassword accept the original password and reject others", async () => {
    const hash = await hashPassword("correct-password");

    assert.equal(await verifyPassword("correct-password", hash), true);
    assert.equal(await verifyPassword("wrong-password", hash), false);
  });

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
});
