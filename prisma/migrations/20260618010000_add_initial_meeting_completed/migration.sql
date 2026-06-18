ALTER TABLE "freelancer_profiles"
  ADD COLUMN "initial_meeting_completed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "initial_meeting_completed_at" TIMESTAMPTZ(6);
