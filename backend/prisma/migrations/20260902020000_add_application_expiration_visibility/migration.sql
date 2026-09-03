ALTER TABLE "applications"
  ADD COLUMN "is_hidden_by_expiration" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "hidden_at" TIMESTAMPTZ;

CREATE INDEX "applications_is_hidden_by_expiration_idx"
  ON "applications"("is_hidden_by_expiration");
