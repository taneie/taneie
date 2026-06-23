create table "uploaded_files" (
  "id" uuid primary key default gen_random_uuid(),
  "user_id" uuid not null,
  "application_id" uuid,
  "original_file_name" text not null,
  "blob_path" text not null,
  "blob_url" text,
  "mime_type" varchar(255) not null,
  "size_bytes" bigint not null,
  "visibility" varchar(50) not null default 'private',
  "created_at" timestamptz(6) not null default now(),
  "updated_at" timestamptz(6) not null default now()
);

alter table "uploaded_files"
  add constraint "uploaded_files_user_id_fkey"
  foreign key ("user_id") references "users"("id")
  on delete cascade on update cascade;

alter table "uploaded_files"
  add constraint "uploaded_files_application_id_fkey"
  foreign key ("application_id") references "applications"("id")
  on delete set null on update cascade;

create index "uploaded_files_user_id_created_at_idx"
  on "uploaded_files"("user_id", "created_at");

create index "uploaded_files_application_id_idx"
  on "uploaded_files"("application_id");

alter table "resumes"
  add column "uploaded_file_id" uuid;

alter table "resumes"
  add constraint "resumes_uploaded_file_id_fkey"
  foreign key ("uploaded_file_id") references "uploaded_files"("id")
  on delete set null on update cascade;

create index "resumes_uploaded_file_id_idx"
  on "resumes"("uploaded_file_id");
