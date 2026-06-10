-- DropForeignKey
ALTER TABLE "alive_check_batches" DROP CONSTRAINT "alive_check_batches_executed_by_fkey";

-- DropForeignKey
ALTER TABLE "alive_check_targets" DROP CONSTRAINT "alive_check_targets_batch_id_fkey";

-- DropForeignKey
ALTER TABLE "alive_check_targets" DROP CONSTRAINT "alive_check_targets_freelancer_profile_id_fkey";

-- DropForeignKey
ALTER TABLE "application_status_histories" DROP CONSTRAINT "application_status_histories_application_id_fkey";

-- DropForeignKey
ALTER TABLE "application_status_histories" DROP CONSTRAINT "application_status_histories_changed_by_fkey";

-- DropForeignKey
ALTER TABLE "applications" DROP CONSTRAINT "applications_freelancer_profile_id_fkey";

-- DropForeignKey
ALTER TABLE "applications" DROP CONSTRAINT "applications_job_id_fkey";

-- DropForeignKey
ALTER TABLE "freelancer_profiles" DROP CONSTRAINT "freelancer_profiles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "freelancer_skills" DROP CONSTRAINT "freelancer_skills_freelancer_profile_id_fkey";

-- DropForeignKey
ALTER TABLE "freelancer_skills" DROP CONSTRAINT "freelancer_skills_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "job_skills" DROP CONSTRAINT "job_skills_job_id_fkey";

-- DropForeignKey
ALTER TABLE "job_skills" DROP CONSTRAINT "job_skills_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_client_id_fkey";

-- DropForeignKey
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_created_by_fkey";

-- DropForeignKey
ALTER TABLE "meeting_requests" DROP CONSTRAINT "meeting_requests_application_id_fkey";

-- DropForeignKey
ALTER TABLE "meeting_requests" DROP CONSTRAINT "meeting_requests_created_by_fkey";

-- DropForeignKey
ALTER TABLE "meeting_requests" DROP CONSTRAINT "meeting_requests_freelancer_profile_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_freelancer_profile_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_job_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_receiver_user_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_sender_user_id_fkey";

-- DropForeignKey
ALTER TABLE "privacy_policy_consents" DROP CONSTRAINT "privacy_policy_consents_user_id_fkey";

-- DropForeignKey
ALTER TABLE "resumes" DROP CONSTRAINT "resumes_freelancer_profile_id_fkey";

-- DropIndex
DROP INDEX "idx_users_role_active";

-- AddForeignKey
ALTER TABLE "freelancer_profiles" ADD CONSTRAINT "freelancer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freelancer_skills" ADD CONSTRAINT "freelancer_skills_freelancer_profile_id_fkey" FOREIGN KEY ("freelancer_profile_id") REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freelancer_skills" ADD CONSTRAINT "freelancer_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_freelancer_profile_id_fkey" FOREIGN KEY ("freelancer_profile_id") REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_freelancer_profile_id_fkey" FOREIGN KEY ("freelancer_profile_id") REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_histories" ADD CONSTRAINT "application_status_histories_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_histories" ADD CONSTRAINT "application_status_histories_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_requests" ADD CONSTRAINT "meeting_requests_freelancer_profile_id_fkey" FOREIGN KEY ("freelancer_profile_id") REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_requests" ADD CONSTRAINT "meeting_requests_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_requests" ADD CONSTRAINT "meeting_requests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_user_id_fkey" FOREIGN KEY ("receiver_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_freelancer_profile_id_fkey" FOREIGN KEY ("freelancer_profile_id") REFERENCES "freelancer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alive_check_batches" ADD CONSTRAINT "alive_check_batches_executed_by_fkey" FOREIGN KEY ("executed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alive_check_targets" ADD CONSTRAINT "alive_check_targets_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "alive_check_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alive_check_targets" ADD CONSTRAINT "alive_check_targets_freelancer_profile_id_fkey" FOREIGN KEY ("freelancer_profile_id") REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "privacy_policy_consents" ADD CONSTRAINT "privacy_policy_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_alive_check_targets_batch" RENAME TO "alive_check_targets_batch_id_idx";

-- RenameIndex
ALTER INDEX "idx_alive_check_targets_profile" RENAME TO "alive_check_targets_freelancer_profile_id_idx";

-- RenameIndex
ALTER INDEX "idx_application_status_histories_application" RENAME TO "application_status_histories_application_id_changed_at_idx";

-- RenameIndex
ALTER INDEX "idx_applications_status" RENAME TO "applications_status_idx";

-- RenameIndex
ALTER INDEX "idx_freelancer_profiles_availability" RENAME TO "freelancer_profiles_availability_status_idx";

-- RenameIndex
ALTER INDEX "idx_freelancer_profiles_remote" RENAME TO "freelancer_profiles_remote_type_idx";

-- RenameIndex
ALTER INDEX "idx_jobs_active_pinned" RENAME TO "jobs_is_active_is_pinned_idx";

-- RenameIndex
ALTER INDEX "idx_jobs_remote_type" RENAME TO "jobs_remote_type_idx";

-- RenameIndex
ALTER INDEX "idx_jobs_stream_type" RENAME TO "jobs_stream_type_idx";

-- RenameIndex
ALTER INDEX "idx_meeting_requests_profile_candidate" RENAME TO "meeting_requests_freelancer_profile_id_candidate_at_idx";

-- RenameIndex
ALTER INDEX "idx_messages_profile_sent" RENAME TO "messages_freelancer_profile_id_sent_at_idx";

-- RenameIndex
ALTER INDEX "idx_messages_sender_sent" RENAME TO "messages_sender_user_id_sent_at_idx";

-- RenameIndex
ALTER INDEX "idx_privacy_policy_consents_user" RENAME TO "privacy_policy_consents_user_id_accepted_at_idx";

-- RenameIndex
ALTER INDEX "idx_resumes_latest" RENAME TO "resumes_freelancer_profile_id_is_latest_idx";
