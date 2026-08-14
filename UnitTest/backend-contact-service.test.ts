import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ContactService } from "../backend/src/application/services/contact.service";

describe("問い合わせクローズ", () => {
  it("営業未返信の問い合わせはクローズできない", async () => {
    const service = new ContactService({
      contactInquiry: {
        findFirst: async () => ({
          id: "inquiry-id",
          status: "new",
          answeredAt: null,
          answeredBy: null,
        }),
      },
    } as never);

    await assert.rejects(
      () =>
        service.closeInquiry(
          { userId: "sales-id", role: "sales", email: "sales@example.com" },
          "inquiry-id",
        ),
      (error: Error & { code?: string }) => error.code === "CONTACT_REPLY_REQUIRED",
    );
  });
});
