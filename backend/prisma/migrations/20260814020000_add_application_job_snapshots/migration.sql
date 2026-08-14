ALTER TABLE "applications" ADD COLUMN "source_job_id" UUID;

UPDATE "applications" SET "source_job_id" = "job_id";

ALTER TABLE "applications" ALTER COLUMN "source_job_id" SET NOT NULL;

CREATE TABLE "application_job_snapshots" (
  "application_id" UUID NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "client_name" VARCHAR(255) NOT NULL,
  "summary" TEXT,
  "required_skills" JSONB NOT NULL DEFAULT '[]',
  "nice_skills" JSONB NOT NULL DEFAULT '[]',
  "rate_min" INTEGER NOT NULL DEFAULT 0,
  "rate_max" INTEGER NOT NULL DEFAULT 0,
  "unit_price" VARCHAR(255),
  "settlement_lower" VARCHAR(100),
  "settlement_upper" VARCHAR(100),
  "location" TEXT,
  "start_period" VARCHAR(255),
  "remote_ratio" VARCHAR(255),
  "foreigner_availability" VARCHAR(255),
  "age_limit" VARCHAR(100),
  "received_at" TIMESTAMPTZ(6),
  "received_at_ms" BIGINT,
  "remote_type" "remote_type" NOT NULL,
  "is_pinned" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "source_created_at" TIMESTAMPTZ(6) NOT NULL,
  "captured_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "application_job_snapshots_pkey" PRIMARY KEY ("application_id"),
  CONSTRAINT "application_job_snapshots_application_id_fkey"
    FOREIGN KEY ("application_id") REFERENCES "applications"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "application_job_snapshots" (
  "application_id", "title", "client_name", "summary",
  "required_skills", "nice_skills", "rate_min", "rate_max", "unit_price",
  "settlement_lower", "settlement_upper", "location", "start_period",
  "remote_ratio", "foreigner_availability", "age_limit", "received_at",
  "received_at_ms", "remote_type", "is_pinned", "is_active", "source_created_at"
)
SELECT
  a."id", j."title", COALESCE(c."name", '未設定'), j."summary",
  COALESCE((SELECT jsonb_agg(s."name" ORDER BY s."name") FROM "job_skills" js JOIN "skills" s ON s."id" = js."skill_id" WHERE js."job_id" = j."id" AND js."requirement_type" = 'required'), '[]'::jsonb),
  COALESCE((SELECT jsonb_agg(s."name" ORDER BY s."name") FROM "job_skills" js JOIN "skills" s ON s."id" = js."skill_id" WHERE js."job_id" = j."id" AND js."requirement_type" = 'nice'), '[]'::jsonb),
  j."rate_min", j."rate_max", j."unit_price", j."settlement_lower",
  j."settlement_upper", j."location", j."start_period", j."remote_ratio",
  j."foreigner_availability", j."age_limit", j."external_received_at",
  j."external_received_at_ms", j."remote_type", j."is_pinned", j."is_active", j."created_at"
FROM "applications" a
JOIN "jobs" j ON j."id" = a."job_id"
LEFT JOIN "clients" c ON c."id" = j."client_id";

ALTER TABLE "applications" DROP CONSTRAINT "applications_job_id_fkey";
ALTER TABLE "applications" DROP CONSTRAINT "applications_job_id_freelancer_profile_id_key";
ALTER TABLE "applications" ALTER COLUMN "job_id" DROP NOT NULL;
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fkey"
  FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "applications" ADD CONSTRAINT "applications_source_job_id_freelancer_profile_id_key"
  UNIQUE ("source_job_id", "freelancer_profile_id");
